import { appSection } from "./utils/domUtils.js";
import { getCookie } from "./login.js";
import { showMatchResultPopup } from "./utils/generalUtils.js";

export function initGame(canvas, ctx) {
	console.log("pongCanvas: ", canvas);
	console.log("Context: ", ctx);

	const paddleWidth = 10;
	const paddleHeight = 100;
	const ballSize = 10;

	let game_id ='';
	let winnerName = '';
	let winnerID = '';
	let loserName = '';
	let loserID = '';
	let user1_id = '';
	let user2_id = '';
	let user1_name = '';
	let user2_name = '';
	let player1 = { x: 0, y: canvas.height / 2 - paddleHeight / 2, score: 0, name: '' };
	let player2 = { x: canvas.width - paddleWidth, y: canvas.height / 2 - paddleHeight / 2, score: 0, name: '' };
	let ball = { x: canvas.width / 2, y: canvas.height / 2, dx: 4, dy: 4};

	let keys = {};
	let websocket;
	let gameInProgress = false; // Track if the game is in progress
	let gamePaused = false; // Track if the game is paused
	let gameStatue = null;
	let intervalId;

	// pong theme
	let storedTheme = localStorage.getItem("pongTheme");
	const parsedTheme = JSON.parse(storedTheme);

	console.log("ball color: ", parsedTheme.ballColor);

	const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
	const wsUrl = `${protocol}:${window.location.hostname}/${protocol}/localGame/`;

	const baseUrl = window.location.origin;

	document.addEventListener("DOMContentLoaded", () => {
		if (websocket)
			websocket.close();
			close.log("game websocket closed");
		// resetGameState();
		fetchProfile();
		console.debug("user2_name and user_id: ", user2_name, user2_id);

	})

	function sleep(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	// Fetch Profile
	async function fetchProfile() {
		try {
			const response = await fetch(`${baseUrl}/auth/api/profile`, {
				method: 'GET',
					headers: {
						'X-CSRFToken': getCookie('csrftoken'),
						'Content-Type': 'application/json',
					},
					credentials: 'include',
				});

			console.debug("response in fetchprofile: ", response);
			if (response.ok) {
				const profile = await response.json();

				console.log("profile in fetchprofile: ", profile);
				user2_id = profile.id;
				user2_name = profile.username;
				console.debug("username and user_id in fetchprofile: ", user2_name, user2_id);
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

		// draw line in the middle
		drawMiddleLine(ctx, canvas);
		// Draw paddles
		ctx.fillStyle = parsedTheme.paddleColor || "#000";
		ctx.fillRect(player1.x, player1.y, paddleWidth, paddleHeight);
		ctx.fillRect(player2.x, player2.y, paddleWidth, paddleHeight);

		// Draw ball
		ctx.beginPath();
		ctx.arc(ball.x, ball.y, ballSize, 0, Math.PI * 2);
		ctx.fillStyle = parsedTheme.ballColor || "#000";
		ctx.fill();
		ctx.closePath();

		// Draw scores
		ctx.font = "20px Arial";
		ctx.fillText(`${localStorage.getItem('player1Name')}: ${player1.score}`, 50, 20);
		ctx.fillText(`${localStorage.getItem('player2Name')}: ${player2.score}`, canvas.width - 150, 20);
	}

	function drawText(text, x, y) {
		ctx.fillStyle = parsedTheme.ballColor || "#000";
		ctx.font = "20px Arial";
		ctx.fillText(text, x, y);
	}

	function drawMiddleLine(ctx, canvas) {
		ctx.setLineDash([5, 5]); // Dashed line
		ctx.strokeStyle = parsedTheme.ballColor || "#000";
		ctx.lineWidth = 2; // Line thickness
	
		ctx.beginPath();
		ctx.moveTo(canvas.width / 2, 0); // Start at the top middle
		ctx.lineTo(canvas.width / 2, canvas.height); // End at the bottom middle
		ctx.stroke();
	}
	

	// Move paddles based on keys pressed
	function movePaddles() {
		const paddleSpeed = 5;

		if (keys.w && player1.y > 0) {
			player1.y -= paddleSpeed;
			// sendPaddlePosition(player1.y, "player1");
		}
		if (keys.s && player1.y < canvas.height - paddleHeight) {
			player1.y += paddleSpeed;
			// sendPaddlePosition(player1.y, "player1");
		}

		if (keys.ArrowUp && player2.y > 0) {
			player2.y -= paddleSpeed;
			// sendPaddlePosition(player2.y, "player2");
		}
		if (keys.ArrowDown && player2.y < canvas.height - paddleHeight) {
			player2.y += paddleSpeed;
			// sendPaddlePosition(player2.y, "player2");
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
			ball.dx *= -1; // Reverse horizontal direction
	
			// 🎯 Add randomness: Modify dy slightly
			let angleChange = (Math.random() - 0.5) * 2;
			ball.dy += angleChange;
	
			// Prevent ball from going too slow
			if (Math.abs(ball.dy) < 2) {
				ball.dy = ball.dy < 0 ? -2 : 2;
			}
	
			// Increase ball speed after paddle collision
			ball.dx *= 1.1; // Increase horizontal speed by 10%
			ball.dy *= 1.1; // Increase vertical speed by 10%
	
			// Cap the maximum speed
			const maxSpeed = 10; // Maximum speed for the ball
			if (Math.abs(ball.dx) > maxSpeed) ball.dx = maxSpeed * Math.sign(ball.dx);
			if (Math.abs(ball.dy) > maxSpeed) ball.dy = maxSpeed * Math.sign(ball.dy);
		}
	
		// Ball goes out of bounds
		if (ball.x < 0) {
			player2.score++;
			resetBall();
			sendScoreUpdate();
			sleep(3000);
		} else if (ball.x > canvas.width) {
			player1.score++;
			resetBall();
			sendScoreUpdate();
			sleep(3000);
		}
	}

	function resetPaddles() {
		player1 = { x: 0, y: canvas.height / 2 - paddleHeight / 2, score: 0, name: '' };
		player2 = { x: canvas.width - paddleWidth, y: canvas.height / 2 - paddleHeight / 2, score: 0, name: '' };
	}

	// Reset ball to center
	// function resetBall() {
	// 	ball.x = canvas.width / 2;
	// 	ball.y = canvas.height / 2;
	// 	ball.dx = 4 * (Math.random() > 0.5 ? 1 : -1);
	// 	ball.dy = 4 * (Math.random() > 0.5 ? 1 : -1);
	// }
	
	function resetBall() {
		ball.x = canvas.width / 2;
		ball.y = canvas.height / 2;
		ball.dx = 6 * (Math.random() > 0.5 ? 1 : -1); // Increase initial horizontal speed
		ball.dy = 6 * (Math.random() > 0.5 ? 1 : -1); // Increase initial vertical speed
	}

	// Update and draw the game
	function updateGame() {
		if (!gamePaused && gameInProgress) {
			movePaddles();
			moveBall();
		}
		draw();
	}

	async function startGame() {
		console.log("gameStatue in startGame: ", gameStatue);
		if (gameStatue === 'started')
			return;
		resetGameState();
		showGameSatuts('started');
		await fetchProfile();
		document.getElementById("startGame").disabled = true;
		if (!websocket || websocket.readyState !== WebSocket.OPEN) {
			console.log("WebSocket not connected. Reconnecting...");
			setupWebSocket();
			
			websocket.onopen = function () {

				const tournamentList = localStorage.getItem('tournamentList');
				console.log("tournamentList in startGame: ", tournamentList);
				user1_id = localStorage.getItem('correspondantId') || '';

				console.log("WebSocket connected");
				console.log("user_id: ", user2_id);
				console.log("user1_id: ", user1_id);
				websocket.send(JSON.stringify({ action: "start_game", user2_id: user2_id, user1_id: user1_id }));
				gameStatue = 'started';

				console.log("gameStatue in startGame: ", gameStatue);
				startGameLoop();
			};
		} else if (!gameInProgress) {
			websocket.send(JSON.stringify({ action: "start_game", user2_id: user2_id, user1_id: user1_id }));
			startGameLoop();
		}
	}

	function setupWebSocket() {
		websocket = new WebSocket(wsUrl);

		websocket.onmessage = function (e) {
			const data = JSON.parse(e.data);
			console.log("Message from server: ", data);

			console.log("data.type: ", data.type);

			if (data.type === "game_update") {
				console.debug("received data in game_update: ", data);
				if (data.player1) {
					player1 = data.player1;
				}
				if (data.player2) {
					player2 = data.player2;
				}
				if (data.ball) {
					ball = data.ball;
				}
				if (data.player1_score !== undefined) {
					player1.score = data.player1_score;
				}
				if (data.player2_score !== undefined) {
					player2.score = data.player2_score;
				}
			}

			if (data.type === "game_started") {
				console.debug("received data in game_started: ", data);
				game_id = localStorage.setItem("gameId", data.game_id);
				user1_id = localStorage.setItem("player1Id", data.user1_id);
				user1_name = localStorage.setItem("player1Name", data.player1);
				user2_id = localStorage.setItem("player2Id", data.user2_id);
				user2_name = localStorage.setItem("player2Name", data.player2);
				console.debug("received data in game_started: ", data);
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
				clearInterval(intervalId);
				console.log("Game restarted");
			}

			if (data.type === "game_ended") {
				winnerID = data.winner;
				gameInProgress = false; // Prevent game updates
				
				showMatchResultPopup(winnerName, player1.score, player2.score); // Call the new popup function
				drawText(`${winnerName} Wins!`, canvas.width / 2 - 50, canvas.height / 2);
				document.getElementById("restartGame").disabled = false;

				resetPaddles();
				document.getElementById("restartGame").style.display = "block";
				// document.getElementById("startGame").disable = true;
				websocket.close();  // Close the WebSocket connection
				gameStatue = 'ended';
				resetGameState();
				localStorage.setItem('secondPlayer', '');
				clearInterval(intervalId);  // Stop the game loop
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
			intervalId = setInterval(updateGame, 1000 / 60); // 60 FPS
		}
	}

	// Send score update to server
	function sendScoreUpdate() {
		console.log("score update");
		if (player1.score >= 3 || player2.score >= 3) {
			console.log("Game ended");
			sendGameEnd();
			return;
		}
		const gID = localStorage.getItem('gameId');
		console.log("Sending score update");
		if (websocket.readyState === WebSocket.OPEN) {
			websocket.send(
				JSON.stringify({
					action: "update_score",
					player1_score: player1.score,
					player2_score: player2.score,
					game_id: gID,
				})
				);
		}
	}
		
		
	function sendGameEnd() {
		winnerID = player1.score >= 3 ? localStorage.getItem("player1Id") : localStorage.getItem("player2Id");
		loserID = player1.score >= 3 ? localStorage.getItem("player2Id") : localStorage.getItem("player1Id");
		winnerName = player1.score >= 3 ? localStorage.getItem("player1Name") : localStorage.getItem("player2Name");
		loserName = player1.score >= 3 ? localStorage.getItem("player2Name") : localStorage.getItem("player1Name");
		const player1_score = player1.score;
		const player2_score = player2.score;

		console.log("winnerID : %s, loserID: %s ,\
			winner: %s, loser: %s, player1_score: %s,\
			player2_score: %s", winnerID, loserID, winnerName, loserName, player1_score, player2_score);
		if (websocket.readyState === WebSocket.OPEN) {
			websocket.send(
				JSON.stringify({
					action: "end_game",
					game_id: localStorage.getItem('gameId'),
					winner_id: winnerID,
					winner: winnerName,
					loser_id: loserID,
					loser: loserName,
					result:`${player1_score} - ${player2_score}`,
					player1_score: player1.score,
					player2_score: player2.score,
				})
			);
		}
	}

	function pauseGame() {
		if (gameInProgress) {
			websocket.send(JSON.stringify({ action: "pause_game", game_id: localStorage.getItem('gameId')}));

		}
	}

	function resumeGame() {
		if (gameInProgress && gamePaused) {
			websocket.send(JSON.stringify({ action: "resume_game", game_id: localStorage.getItem('gameId')}));
		}
	}

	function restartGame() {
		document.getElementById("startGame").disabled = false;
		document.getElementById("restartGame").disabled = true;
		websocket.close();
		resetGameState();
		startGame();
		// if (gameInProgress || gameStatue === 'ended') {
		// 	// Send restart message to the server
		// 	websocket.send(JSON.stringify({ action: "restart_game", game_id: localStorage.getItem('gameId') }));
	
		// 	// Reset the game state
		// 	resetGameState();
	
		// 	// Start a new game with the same users
		// 	startGame();
	
		// 	// Update UI
		// 	document.getElementById("startGame").style.display = "block";
		// 	showGameSatuts('started');
		// }
	}

	function showGameSatuts(status) {
		const gameStatus = document.getElementById("gameStatus");

		if (status === 'started') {
			gameStatus.innerHTML = "Game in Progress";
		}
		else if (status === 'paused') {
			gameStatus.innerHTML = "Game Paused";
		}
		else if (status === 'ended') {
			gameStatus.innerHTML = "Game Ended";
		} else {
			gameStatus.innerHTML = "Game Not Started";
		}
	}

	// // Key event listeners
	// window.addEventListener("keydown", (e) => {
	// 	// console.log("Key pressed: ", e.key);
	// 	keys[e.key] = true;
	// });
	// window.addEventListener("keyup", (e) => {
	// 	// console.log("Key released: ", e.key);
	// 	keys[e.key] = false;
	// });

	document.addEventListener("keydown", (e) => {
		keys[e.key] = true;
	});
	document.addEventListener("keyup", (e) => {
		keys[e.key] = false;
	});

	function resetGameState() {
		// Reset player scores and positions
		// if (gameInProgress) {
		// 	game_id = localStorage.setItem("gameId", '');'';
		// 	player1.score = 0;
		// 	player2.score = 0;
		// 	player1 = { x: 0, y: canvas.height / 2 - paddleHeight / 2, score: 0 };
		// 	player2 = { x: canvas.width - paddleWidth, y: canvas.height / 2 - paddleHeight / 2, score: 0 };
		// 	ball = { x: canvas.width / 2, y: canvas.height / 2, dx: 4, dy: 4 };
		// 	// if (websocket)
		// 	// 	websocket.close();
		// 	// clearInterval(intervalId);
		// }
		// game_id = localStorage.setItem("gameId", '');'';
		// user1_id = localStorage.setItem("player1Id", '');
		// user1_name = localStorage.setItem("player1Name", '');
		// user2_id = localStorage.setItem("player2Id", '');
		// user2_name = localStorage.setItem("player2Name", '');
		// gameInProgress = false;
		// player1.score = 0;
		// player2.score = 0;
		// gameStatue = null;
		player1.score = 0;
		player2.score = 0;
		player1 = { x: 0, y: canvas.height / 2 - paddleHeight / 2, score: 0, name: user1_name };
		player2 = { x: canvas.width - paddleWidth, y: canvas.height / 2 - paddleHeight / 2, score: 0, name: user2_name };
		ball = { x: canvas.width / 2, y: canvas.height / 2, dx: 6 * (Math.random() > 0.5 ? 1 : -1), dy: 6 * (Math.random() > 0.5 ? 1 : -1) };
	
		// Reset game status
		gameInProgress = false;
		gameStatue = null;
	}

	appSection.addEventListener("click", (e) => {
		// Start Game Button
		if (e.target.id === "startGame") {
			console.log("Start Game clicked");
			startGame();
			showGameSatuts('started');
		}

		// Pause Game Button
		if (e.target.id === "pauseGame") {
			console.log("Pause Game clicked");
			pauseGame();
			showGameSatuts('paused');
		}

		// Resume Game Button
		if (e.target.id === "resumeGame") {
			console.log("Resume Game clicked");
			resumeGame();
			showGameSatuts('started');
		}

		// Restart Game Button
		if (e.target.id === "restartGame") {
			restartGame();
			showGameSatuts('ended');
		}
	}
	);
}
