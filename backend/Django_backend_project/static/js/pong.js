const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const paddleWidth = 10;
const paddleHeight = 100;
const ballSize = 10;

let game_id = '';
let user1_id = '1';
let user2_id = '2';
let username = '';
let player1 = { x: 10, y: canvas.height / 2 - paddleHeight / 2, score: 0 };
let player2 = { x: canvas.width - 20, y: canvas.height / 2 - paddleHeight / 2, score: 0 };
let ball = { x: canvas.width / 2, y: canvas.height / 2, dx: 4, dy: 4 };

let keys = {};
let websocket;
let gameInProgress = false;
let gamePaused = false;

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#000";
    ctx.fillRect(player1.x, player1.y, paddleWidth, paddleHeight);
    ctx.fillRect(player2.x, player2.y, paddleWidth, paddleHeight);

    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ballSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();

    ctx.font = "20px Arial";
    ctx.fillText(`Host: ${player1.score}`, 50, 20);
    ctx.fillText(`Guest: ${player2.score}`, canvas.width - 150, 20);
}

function updateGameState(state) {
    if (state.ball) {
        ball.x = state.ball.x;
        ball.y = state.ball.y;
        ball.dx = state.ball.dx;
        ball.dy = state.ball.dy;
    }
    if (state.paddle1) player1.y = state.paddle1.y;
    if (state.paddle2) player2.y = state.paddle2.y;
    if (state.score1 !== undefined) player1.score = state.score1;
    if (state.score2 !== undefined) player2.score = state.score2;
}


function moveBall() {
    ball.x += ball.dx;
    ball.y += ball.dy;
    // Ball collision with top and bottom
    if (ball.y <= 0 || ball.y >= canvas.height - ballSize) ball.dy *= -1;

    // Ball collision with paddles
    if (
        (ball.x <= player1.x + paddleWidth && ball.y >= player1.y && ball.y <= player1.y + paddleHeight) ||
        (ball.x >= player2.x - ballSize && ball.y >= player2.y && ball.y <= player2.y + paddleHeight)
    ) {
        ball.dx *= -1;
    }
    // Ball out of bounds (reset and update score)
    if (ball.x < 0) {
        player2.score++;
        resetBall();
    } else if (ball.x > canvas.width) {
        player1.score++;
        resetBall();
    }
}

function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.dx = 4 * (Math.random() > 0.5 ? 1 : -1);
    ball.dy = 4 * (Math.random() > 0.5 ? 1 : -1);
}

function gameLoop() {
    if (gameInProgress && !gamePaused)
    {
        moveBall();
    }
    draw();
    requestAnimationFrame(gameLoop);
}

document.getElementById("startGame").addEventListener("click", () => {
    setupWebSocket();
});

function setupWebSocket() {
    websocket = new WebSocket("ws://" + window.location.host + "/ws/game/");

    websocket.onopen = function () {
        console.log("WebSocket connected");
        // Send invitation to start the game
        websocket.send(JSON.stringify({ action: "start_game", user1_id: user1_id, user2_id: user2_id }));
    };

    websocket.onmessage = function (e) {
        const data = JSON.parse(e.data);
        console.log("Received update:", data);
        console.log("ball: ", ball);

        // Process game state updates
        if (data.type === "game_update" || data.type === "ball_update") {
            console.log(data, "Updating game state...");
            updateGameState(data);
        }
        if (data.type === "game_started") {
            game_id = data.game_id;
            localStorage.setItem("gameId", game_id);
            gameInProgress = true;
            console.log("Game started with ID:", data);
            console.log("ball: ", ball);
        }
        if (data.type === "game_paused") {
            gamePaused = true;
            console.log("Game paused");
        }
        if (data.type === "game_resumed") {
            gamePaused = false;
            console.log("Game resumed");
        }
        if (data.type === "game_restarted") {
            resetGameState();
            console.log("Game restarted");
        }
        if (data.type === "game_ended") {
            gameInProgress = false;
            alert(`Game Over! Winner: ${data.winner}`);
            websocket.close();
        }
    };

    websocket.onerror = function (e) {
        console.error("WebSocket error:", e);
    };

    websocket.onclose = function () {
        console.log("WebSocket disconnected. Reconnecting in 3 seconds...");
        setTimeout(setupWebSocket, 3000);
    };

    gameLoop();
}

window.addEventListener("keydown", (e) => {
    keys[e.key] = true;
    if (e.key === "w" || e.key === "s") {
        if (keys.w && player1.y > 0) player1.y -= 5;
        if (keys.s && player1.y < canvas.height - paddleHeight) player1.y += 5;
        sendPaddlePosition(player1.y, "paddle1");
    }
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        if (e.key === "ArrowUp" && player2.y > 0) player2.y -= 5;
        if (e.key === "ArrowDown" && player2.y < canvas.height - paddleHeight) player2.y += 5;
        sendPaddlePosition(player2.y, "paddle2");
    }
});

function sendPaddlePosition(position, paddle) {
    if (websocket && websocket.readyState === WebSocket.OPEN) {
        websocket.send(JSON.stringify({
            action: "move_paddle",
            player: paddle,
            position: position,
            game_id: localStorage.getItem("gameId")
        }));
    }
}
function resetGameState() {
    player1 = { x: 10, y: canvas.height / 2 - paddleHeight / 2, score: 0 };
    player2 = { x: canvas.width - 20, y: canvas.height / 2 - paddleHeight / 2, score: 0 };
    ball = { x: canvas.width / 2, y: canvas.height / 2, dx: 4, dy: 4 };
    gameInProgress = false;
}
