const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const paddleWidth = 10;
const paddleHeight = 100;
const ballSize = 10;

let game_id = "980179"
window.game_id = game_id;
// let game_id = window.game_id; // This window.game_id is set from another js file, i.e.
//                               // what is listed from chat
let user_id = ''; 
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

function updateGameState(data) {
    ball.x = data.ball.x;
    ball.y = data.ball.y;
    player1.y = data.paddle1.y;
    player2.y = data.paddle2.y;
    player1.score = data.score1;
    player2.score = data.score2;

    const winner = data.winner;
    game_id = data.game_id;
    if (winner) {
        gameInProgress = false;
        document.getElementById("pauseGame").disabled = true;
        document.getElementById("resumeGame").disabled = true;
    } else {
        document.getElementById("pauseGame").disabled = false;
        document.getElementById("resumeGame").disabled = false;
    }
    draw();
}

// Fix the incorrect event listener binding
document.getElementById("startGame").addEventListener("click", async () => { 
    await Profile();
    setupWebSocket(); 
    document.getElementById("startGame").disabled = true; 
});

// function Profile() {
//     fetch('/auth/api/profile/')
//     .then(response => response.json())
//     .then(profile => {
//         user_id = profile.id;
//         username = profile.username;
//         console.log("username and user_id: ", username, user_id);
//     })
//     .catch((error) => { 
//         console.error('Error fetching profile:', error);
//     });
// }

async function Profile() {
    try {
        const response = await fetch('/auth/api/profile/');
        
        if (!response.ok) {
            throw new Error(`can't fetch api ${response.status}`);
        }
        const profile = await response.json();
        user_id = profile.id;
        username = profile.username;
        console.log("profile", profile);
        console.log("username and user_id: ", username, user_id);
    } catch(error) {
        console.error('Error fetching profile:', error);
    }
}

function setupWebSocket() {
    // websocket = new WebSocket("ws://" + window.location.host + "/ws/game/?token=<access_token>");
    websocket = new WebSocket("ws://" + window.location.host + "/ws/game/");
    websocket.onopen = () => {
        console.log("WebSocket connected");
    };
    websocket.onmessage = (e) => {
        const data = JSON.parse(e.data);
        // console.log("Received update from server:", data);

        if (data["type"] == "id") {
            console.log("Received Id");
            console.log(`Game ID: ${game_id}, Player ID: ${user_id}`);
            websocket.send(JSON.stringify({ action: "start_game", game_id, "player_id": user_id }));
            gameInProgress = true;
            gamePaused = false;
            return;
        }
        document.getElementById("startGame").hidden = true; 
        updateGameState(data);
    };

    websocket.onerror = (e) => console.error("WebSocket error:", e);

    websocket.onclose = () => {
        console.log("WebSocket disconnected. Reconnecting in 3 seconds...");
        setTimeout(setupWebSocket, 3000);
    };

}

document.getElementById("pauseGame").addEventListener("click", () => {
    console.log("Pause game button clicked");
    if (websocket && websocket.readyState === WebSocket.OPEN) {
        data = {    // Send pause game request  to server   
            action: "pause_game",   
            game_id: window.game_id, // localStorage.getItem("gameId")
        };
        websocket.send(JSON.stringify(data));
    }
});

document.getElementById("resumeGame").addEventListener("click", () => {
    console.log("Resume game button clicked");
    if (websocket && websocket.readyState === WebSocket.OPEN) {
        data = {    // Send resume game request  to server
            action: "resume_game",
            game_id: window.game_id, // localStorage.getItem("gameId")
        };
        websocket.send(JSON.stringify(data));
    }
});

document.getElementById("restartGame").addEventListener("click", () => {
    console.log("Restart game button clicked");
    if (websocket && websocket.readyState === WebSocket.OPEN) {
        data = {    // Send restart game request  to server
            action: "restart_game",
            game_id: window.game_id, // localStorage.getItem("gameId")
        };
        websocket.send(JSON.stringify(data));
    }
});


window.addEventListener("keydown", (e) => {
    if (websocket && websocket.readyState === WebSocket.OPEN) {
        let action = null;
        if (e.key === "w") action = { player: user_id, position: player1.y - 20 };
        // if (e.key === "w") action = { player: "paddle1", motion: -1 };
        if (e.key === "s") action = { player: user_id, position: player1.y + 20 };
        if (e.key === "ArrowUp") action = { player: user_id, position: player2.y - 20 };
        if (e.key === "ArrowDown") action = { player: user_id, position: player2.y + 20 };

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
