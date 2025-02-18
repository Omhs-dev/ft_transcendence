const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const paddleWidth = 10;
const paddleHeight = 100;
const ballSize = 10;

let game_id = 'lobby';
window.game_id = game_id;
let user1_id = '1';
let user2_id = '2';
let username = '';
let player1 = { x: 10, y: canvas.height / 2 - paddleHeight / 2, score: 0 };
let player2 = { x: canvas.width - 20, y: canvas.height / 2 - paddleHeight / 2, score: 0 };
let ball = { x: canvas.width / 2, y: canvas.height / 2, dx: 0, dy: 0 };

let websocket;
let gameInProgress =false;
let gamePaused = false;

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas

    // Debugging
    console.log("Drawing paddle1 at:", player1.y, "paddle2 at:", player2.y, "ball at:", ball.x, ball.y);

    // Draw paddles
    ctx.fillStyle = "#000";
    ctx.fillRect(player1.x, player1.y, paddleWidth, paddleHeight);
    ctx.fillRect(player2.x, player2.y, paddleWidth, paddleHeight);

    // Draw ball
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ballSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();

    // Draw scores
    ctx.font = "20px Arial";
    ctx.fillText(`Host: ${player1.score}`, 50, 20);
    ctx.fillText(`Guest: ${player2.score}`, canvas.width - 150, 20);
}


// // Main game loop
// function gameLoop() {
//     if (!gamePaused && gameInProgress) {
//         draw();
//     }
//     // requestAnimationFrame(gameLoop); // Keep looping
// }

function updateGameState(data) {
        // console.log("The ball is being updated ..", data.ball);
        ball.x = data.ball.x;
        ball.y = data.ball.y;
        player1.y = data.paddle1.y;
        player2.y = data.paddle2.y;
        player1.score = data.score1;
        player2.score = data.score2;
        game_id = data.game_id;
        // console.log("players. ", player1, player2);
        draw();
        // sleep(10000);
}

// Fix the incorrect event listener binding
document.getElementById("startGame").addEventListener("click", setupWebSocket);

function setupWebSocket() {
    // websocket = new WebSocket("ws://" + window.location.host + "/ws/game/?token=<access_token>");
    websocket = new WebSocket("ws://" + window.location.host + "/ws/game/");

    websocket.onopen = () => {
        console.log("WebSocket connected");
        // websocket.send(JSON.stringify({ action: "start_game", game_id, "player_id": player_id }));
        // gameInProgress = true;
        // gamePaused = false;
        // startGameLoop();
    };

    websocket.onmessage = (e) => {
        const data = JSON.parse(e.data);
        // console.log("Received update from server:", data);

        if (data["type"] == "id") {
            console.log("Received Id");
            user1_id = data["id"];
            websocket.send(JSON.stringify({ action: "start_game", game_id, "player_id": user1_id }));
            gameInProgress = true;
            gamePaused = false;
            return;
        }
        // setInterval(updateGameState(data), 1000);
        updateGameState(data);
        // updateGameState(data);

        // if (data.type === "send_game_state") {
        //     console.log("this is game_state...........");
        // }
        // if (data.type === "game_update") {
        //     console.log("this is game_update......");
        // }
        if (data.action === "move_paddle") {
            console.log("Moving paddle ohhhhhh...");
            // console.log("drawing map");
            // if (data.player === "paddle1") {
            //     console.log("this is player 1");
            //     player1.y = data.position;
            // }
            // if (data.player === "paddle2") {
            //     console.log("this is player 2");
            //     player2.y = data.position;
            // }
            // draw();
        }
        if (data.type === "game_started") {
            console.log("Game started updating game state ...");
            // game_id = data.game_id;
            // localStorage.setItem("gameId", game_id);
            // gameInProgress = true;
            console.log("Game started with ID:", data);
        }
        // if (data.type === "game_paused") gamePaused = true;
        // if (data.type === "game_resumed") gamePaused = false;
        // if (data.type === "game_restarted") resetGameState();
        // if (data.type === "game_ended") {
        //     gameInProgress = false;
        //     alert(`Game Over! Winner: ${data.winner}`);
        //     websocket.close();
        // }
    };

    websocket.onerror = (e) => console.error("WebSocket error:", e);

    websocket.onclose = () => {
        console.log("WebSocket disconnected. Reconnecting in 3 seconds...");
        setTimeout(setupWebSocket, 3000);
    };

}
window.addEventListener("keydown", (e) => {
    if (websocket && websocket.readyState === WebSocket.OPEN) {
        let action = null;
        if (e.key === "w") action = { player: user1_id, position: player1.y - 20 };
        // if (e.key === "w") action = { player: "paddle1", motion: -1 };
        if (e.key === "s") action = { player: user1_id, position: player1.y + 20 };
        if (e.key === "ArrowUp") action = { player: user1_id, position: player2.y - 20 };
        if (e.key === "ArrowDown") action = { player: user1_id, position: player2.y + 20 };

        if (action) {
            data = {
                action: "move_paddle",
                ...action,
                game_id: window.game_id, // localStorage.getItem("gameId")
            };
            console.log(data);
            websocket.send(JSON.stringify(data));
        }
    }
});

function resetGameState() {
    player1.y = canvas.height / 2 - paddleHeight / 2;
    player2.y = canvas.height / 2 - paddleHeight / 2;
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    player1.score = 0;
    player2.score = 0;
}
