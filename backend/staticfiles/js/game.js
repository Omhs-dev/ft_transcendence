const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const paddleWidth = 10;
const paddleHeight = 100;
const ballSize = 10;

let game_id ='';
let user2_id = '';
let username = '';
let player1 = { x: 0, y: canvas.height / 2 - paddleHeight / 2, score: 0 };
let player2 = { x: canvas.width - paddleWidth, y: canvas.height / 2 - paddleHeight / 2, score: 0 };
let ball = { x: canvas.width / 2, y: canvas.height / 2, dx: 4, dy: 4 };

let keys = {};
let websocket;
let gameInProgress = false; // Track if the game is in progress
let gamePaused = false; // Track if the game is paused

// Fetch Profile
async function fetchProfile() {
	try {
		const response = await fetch('/auth/api/profile/');
		if (response.ok) {
			const profile = await response.json();
			user2_id = profile.id;
			username = profile.username;
			console.log("username and user_id: ", username, user2_id);
		} else {
			console.error('Failed to fetch profile:', response.status);
		}
	} catch (error) {
		console.error('Error fetching profile:', error);
	}
}


// Draw paddles and ball
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw paddles
    ctx.fillStyle = "#000";
    ctx.fillRect(player1.x, player1.y, paddleWidth, paddleHeight);
    ctx.fillRect(player2.x, player2.y, paddleWidth, paddleHeight);

    // Draw ball
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ballSize, 0, Math.PI * 2);
    ctx.fillStyle = "#000";
    ctx.fill();
    ctx.closePath();

    // Draw scores
    ctx.font = "20px Arial";
    ctx.fillText(`Admin: ${player1.score}`, 50, 20);
    ctx.fillText(`${username}: ${player2.score}`, canvas.width - 150, 20);
}

// Move paddles based on keys pressed
function movePaddles() {
    const paddleSpeed = 5;

    if (keys.w && player1.y > 0) {
        player1.y -= paddleSpeed;
        sendPaddlePosition(player1.y, "player1");
    }
    if (keys.s && player1.y < canvas.height - paddleHeight) {
        player1.y += paddleSpeed;
        sendPaddlePosition(player1.y, "player1");
    }

    if (keys.ArrowUp && player2.y > 0) {
        player2.y -= paddleSpeed;
        sendPaddlePosition(player2.y, "player2");
    }
    if (keys.ArrowDown && player2.y < canvas.height - paddleHeight) {
        player2.y += paddleSpeed;
        sendPaddlePosition(player2.y, "player2");
    }
}

// Move ball locally (optional if handled by server)
function moveBall() {
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Ball collision with top and bottom
    if (ball.y <= 0 || ball.y >= canvas.height) ball.dy *= -1;

    // Ball collision with paddles
    if (
        (ball.x <= paddleWidth && ball.y >= player1.y && ball.y <= player1.y + paddleHeight) ||
        (ball.x >= canvas.width - paddleWidth && ball.y >= player2.y && ball.y <= player2.y + paddleHeight)
    ) {
        ball.dx *= -1;
        sendBallPosition(ball.x, ball.y, ball.dx, ball.dy);
    }

    // Ball goes out of bounds
    if (ball.x < 0) {
        player2.score++;
        resetBall();
        sendScoreUpdate();
    } else if (ball.x > canvas.width) {
        player1.score++;
        resetBall();
        sendScoreUpdate();
    }
}

// Reset ball to center
function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.dx = 4 * (Math.random() > 0.5 ? 1 : -1);
    ball.dy = 4 * (Math.random() > 0.5 ? 1 : -1);
    sendBallPosition(ball.x, ball.y, ball.dx, ball.dy);
}


// Update and draw the game
function updateGame() {
    if (!gamePaused && gameInProgress) {
        movePaddles();
        moveBall();
    }
    draw();
}

// WebSocket connection and event handlers
document.getElementById("startGame").addEventListener("click", async () => {
	await fetchProfile();
	resetGameState();
    if (!websocket || websocket.readyState !== WebSocket.OPEN) {
        console.log("WebSocket not connected. Reconnecting...");
        setupWebSocket();
        
        websocket.onopen = function () {
            console.log("WebSocket connected");
			console.log("user_id: ", user2_id);
			// user2_id = localStorage.getItem("userId");
			console.log("user_id: ", user2_id);
            websocket.send(JSON.stringify({ action: "start_game", user2_id }));
            // websocket.send(JSON.stringify({ action: "start_game", userId, game_id: 1 }));
            startGameLoop();
        };
    } else if (!gameInProgress) {
		websocket.send(JSON.stringify({ action: "start_game", user2_id }));
        // websocket.send(JSON.stringify({ action: "start_game", game_id: 1 }));
        startGameLoop();
    }
});

function setupWebSocket() {
    websocket = new WebSocket("ws://" + window.location.host + "/ws/game/");

    websocket.onmessage = function (e) {
        const data = JSON.parse(e.data);
        console.log("Message from server: ", data);

        if (data.type === "game_update") {
            if (data.player1) player1 = data.player1;
            if (data.player2) player2 = data.player2;
            if (data.ball) ball = data.ball;
            if (data.player1_score !== undefined) {
                player1.score = data.player1_score;
            }
            if (data.player2_score !== undefined) {
                player2.score = data.player2_score;
            }
        }

        if (data.type === "game_started") {
			game_id = localStorage.setItem("gameId", data.game_id);
            gameInProgress = true;
            console.log("Game started");
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
			winnerID = data.winner;
			if (winnerID === user2_id ? winner = username:'Admin');
            gameInProgress = false; // Prevent game updates
            alert(`MATCH RESULT \n WINNER: <<<****${winner}****>>>\n SCORE: ${player1.score} - ${player2.score}`);
            clearInterval(gameLoopInterval);  // Stop the game loop
            cancelAnimationFrame(animationFrame);  // Stop any ongoing animation
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
            document.getElementById("restartGame").style.display = "block";
            document.getElementById("startGame").style.display = "none";
            websocket.close();  // Close the WebSocket connection
        }
    };

    websocket.onerror = function (e) {
        console.error("WebSocket error: ", e);
    };

    websocket.onclose = function () {
        console.log("WebSocket disconnected. Reconnecting...");
        setTimeout(setupWebSocket, 3000);
    };
}


function startGameLoop() {
    if (!gameInProgress) {
        gameInProgress = true;
        setInterval(updateGame, 1000 / 60); // 60 FPS
    }
}


// Send paddle position to server
function sendPaddlePosition(y, player) {
	const gID = localStorage.getItem('gameId');
	if (websocket.readyState === WebSocket.OPEN) {
		websocket.send(
			JSON.stringify({
				action: "move_paddle",
				player: player,
				position: y,
				// game_id: 1,  // Example game ID
				game_id: gID,  // Example game ID
			})
		);
	}
}

// Send ball position to server (optional)
function sendBallPosition(x, y, dx, dy) {
	const gID = localStorage.getItem('gameId');
	console.log("game_id in the send ball position: ", gID);
	if (websocket.readyState === WebSocket.OPEN) {
		websocket.send(
			JSON.stringify({
				action: "update_ball",
				ball: { x: x, y: y, dx: dx, dy: dy },
				// game_id: 1,  // Example game ID
				game_id: gID,  // Example game ID
			})
		);
	}
}

// Send score update to server
function sendScoreUpdate() {
	const gID = localStorage.getItem('gameId');
    console.log("Sending score update");
	if (websocket.readyState === WebSocket.OPEN) {
		websocket.send(
			JSON.stringify({
				action: "update_score",
				player1_score: player1.score,
				player2_score: player2.score,
				// game_id: 1,  // Example game ID
				game_id: gID,  // Example game ID
			})
		);
	}
}


// Pause game
document.getElementById("pauseGame").addEventListener("click", () => {
    if (gameInProgress) {
        websocket.send(JSON.stringify({ action: "pause_game", game_id: localStorage.getItem('gameId')}));

    }
});

// Resume game
document.getElementById("resumeGame").addEventListener("click", () => {
    if (gameInProgress && gamePaused) {
        websocket.send(JSON.stringify({ action: "resume_game", game_id: localStorage.getItem('gameId')}));
    }
});

// Example: Restart Game button functionality
document.getElementById("restartGame").addEventListener("click", () => {
    if (gameInProgress) {
        websocket.send(JSON.stringify({ action: "restart_game", game_id: localStorage.getItem('gameId')}));
        // gameInProgress = false;
		resetGameState();
        document.getElementById("buttons").style.display = "block";
    }
});


// Key event listeners
window.addEventListener("keydown", (e) => {
    keys[e.key] = true;
});
window.addEventListener("keyup", (e) => {
    keys[e.key] = false;
});

//101162

function resetGameState() {
    // Reset player scores and positions
	if (gameInProgress) {
		// game_id = '';
		player1.score = 0;
		player2.score = 0;
		player1 = { x: 0, y: canvas.height / 2 - paddleHeight / 2, score: 0 };
		player2 = { x: canvas.width - paddleWidth, y: canvas.height / 2 - paddleHeight / 2, score: 0 };
		ball = { x: canvas.width / 2, y: canvas.height / 2, dx: 4, dy: 4 };
		// if (websocket)
		// 	websocket.close();
		// clearInterval(updateGame);
	}
	gameInProgress = false;
    player1.score = 0;
    player2.score = 0;
}
