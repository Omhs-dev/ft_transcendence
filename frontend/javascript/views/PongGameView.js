import AbsractView from "./AbsractView.js";
import { initGame } from "../game.js";

export default class extends AbsractView {
	constructor(params) {
		super(params);
		this.setTitle("Tournaments");
	}

	async loadHtml() {
        try {
            // Fetch the external HTML file
            const response = await fetch("./pages/ponggame.html");

            if (!response.ok) {
                throw new Error(`Failed to fetch profile.html: ${response.statusText}`);
            }

            // Return the fetched HTML content as a string
			const htmlContent =  await response.text();

			const parser = new DOMParser();
			const doc = parser.parseFromString(htmlContent, "text/html");

			// ********************** Draw the game **********************

			const canvas = doc.getElementById("pongCanvas");
            if (!canvas) {
                console.error("Canvas element not found!");
                return;
            }
            const ctx = canvas.getContext("2d");

            console.log("Canvas initialized:", canvas);
            console.log("Context initialized:", ctx);

            // Initialize the game by passing canvas and ctx
            initGame(canvas, ctx);
			
			// ***********************************************************

            const content = doc.body.innerHTML;
			return content;
        } catch (error) {
            console.error(error);
            return "<p>Error loading profile view. Please try again later.</p>";
        }
    }
}



// const canvas = doc.getElementById("pongCanvas");
// 			const ctx = canvas.getContext("2d");

// 			console.log("pongCanvas: ", canvas);

// 			const paddleWidth = 10;
// 			const paddleHeight = 100;
// 			const ballSize = 10;

// 			let player1 = { x: 0, y: canvas.height / 2 - paddleHeight / 2, score: 0, name: '' };
// 			let player2 = { x: canvas.width - paddleWidth, y: canvas.height / 2 - paddleHeight / 2, score: 0, name: '' };
// 			let ball = { x: canvas.width / 2, y: canvas.height / 2, dx: 4, dy: 4 };

// 			function sleep(ms) {
// 				return new Promise(resolve => setTimeout(resolve, ms));
// 			}

// 			function draw() {
// 				ctx.clearRect(0, 0, canvas.width, canvas.height);

// 				// Draw paddles
// 				ctx.fillStyle = "#000";
// 				ctx.fillRect(player1.x, player1.y, paddleWidth, paddleHeight);
// 				ctx.fillRect(player2.x, player2.y, paddleWidth, paddleHeight);

// 				// Draw ball
// 				ctx.beginPath();
// 				ctx.arc(ball.x, ball.y, ballSize, 0, Math.PI * 2);
// 				ctx.fillStyle = "#000";
// 				ctx.fill();
// 				ctx.closePath();

// 				// Draw scores
// 				ctx.font = "20px Arial";
// 				ctx.fillText(`${localStorage.getItem('player1Name')}: ${player1.score}`, 50, 20);
// 				ctx.fillText(`${localStorage.getItem('player2Name')}: ${player2.score}`, canvas.width - 150, 20);
// 			}

// 			function movePaddles() {
// 				const paddleSpeed = 5;
			
// 				if (keys.w && player1.y > 0) {
// 					player1.y -= paddleSpeed;
// 					// sendPaddlePosition(player1.y, "player1");
// 				}
// 				if (keys.s && player1.y < canvas.height - paddleHeight) {
// 					player1.y += paddleSpeed;
// 					// sendPaddlePosition(player1.y, "player1");
// 				}
			
// 				if (keys.ArrowUp && player2.y > 0) {
// 					player2.y -= paddleSpeed;
// 					// sendPaddlePosition(player2.y, "player2");
// 				}
// 				if (keys.ArrowDown && player2.y < canvas.height - paddleHeight) {
// 					player2.y += paddleSpeed;
// 					// sendPaddlePosition(player2.y, "player2");
// 				}
// 			}


// 			// Move ball locally (optional if handled by server)
// 			function moveBall() {
// 				ball.x += ball.dx;
// 				ball.y += ball.dy;

// 				// Ball collision with top and bottom
// 				if (ball.y <= 0 || ball.y >= canvas.height) ball.dy *= -1;

// 				// Ball collision with paddles
// 				if (
// 					(ball.x <= paddleWidth && ball.y >= player1.y && ball.y <= player1.y + paddleHeight) ||
// 					(ball.x >= canvas.width - paddleWidth && ball.y >= player2.y && ball.y <= player2.y + paddleHeight)
// 				) {
// 					ball.dx *= -1;
// 					// sendBallPosition(ball.x, ball.y, ball.dx, ball.dy);
// 				}

// 				// Ball goes out of bounds
// 				if (ball.x < 0) {
// 					player2.score++;
// 					resetBall();
// 					// checkGameStatus();
// 					sendScoreUpdate();
// 					sleep(3000);
// 				} else if (ball.x > canvas.width) {
// 					player1.score++;
// 					resetBall();
// 					// checkGameStatus();
// 					sendScoreUpdate();
// 					sleep(3000);
// 				}
// 			}

// 			// Reset ball to center
// 			function resetBall() {
// 				ball.x = canvas.width / 2;
// 				ball.y = canvas.height / 2;
// 				ball.dx = 4 * (Math.random() > 0.5 ? 1 : -1);
// 				ball.dy = 4 * (Math.random() > 0.5 ? 1 : -1);
// 				// sendBallPosition(ball.x, ball.y, ball.dx, ball.dy);
// 			}

// 			// Update and draw the game
// 			function updateGame() {
// 				if (!gamePaused && gameInProgress) {
// 					movePaddles();
// 					moveBall();
// 				}
// 				draw();
// 			}

// 			function startGameLoop() {
// 				if (!gameInProgress) {
// 					gameInProgress = true;
// 					intervalId = setInterval(updateGame, 1000 / 60); // 60 FPS
					
// 				}
// 			}
			
// 			function resetGameState() {
// 				// Reset player scores and positions
// 				if (gameInProgress) {
// 					game_id = localStorage.setItem("gameId", '');'';
// 					player1.score = 0;
// 					player2.score = 0;
// 					player1 = { x: 0, y: canvas.height / 2 - paddleHeight / 2, score: 0 };
// 					player2 = { x: canvas.width - paddleWidth, y: canvas.height / 2 - paddleHeight / 2, score: 0 };
// 					ball = { x: canvas.width / 2, y: canvas.height / 2, dx: 4, dy: 4 };
// 					// if (websocket)
// 					// 	websocket.close();
// 					// clearInterval(intervalId);
// 				}
// 				game_id = localStorage.setItem("gameId", '');'';
// 				user1_id = localStorage.setItem("player1Id", '');
// 				user1_name = localStorage.setItem("player1Name", '');
// 				user2_id = localStorage.setItem("player2Id", '');
// 				user2_name = localStorage.setItem("player2Name", '');
// 				gameInProgress = false;
// 				player1.score = 0;
// 				player2.score = 0;
// 				gameStatue = null;
// 			}