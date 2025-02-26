import { appSection } from "./utils/domUtils.js";
import { getCookie } from "./login.js";
import { showMatchResultPopup } from "./utils/generalUtils.js";
import { showNextGamePopup } from "./utils/generalUtils.js";

console.log("tournament js file loaded");

export function initTournamentGame(canvas, ctx) {
	console.log("initTournamentGame function called");
	const grid = 15;
	const paddleHeight = grid * 5;
	const maxPaddleY = canvas.height - grid - paddleHeight;
	const paddleSpeed = 6;
	const ballSpeed = 5;
	const winningScore = 1;

	let leftPaddle, rightPaddle, ball;
	let leftScore = 0;
	let rightScore = 0;
	let gameOver = false;
	let players = [];
	let currentMatch = [];
	let tournamentBracket = [];
	let currentRound = [];
	let currentMatchIndex = 0;

	let isPaused = false;
	let animationFrameId = null;

	let storedTheme = localStorage.getItem("pongTheme");
	const parsedTheme = JSON.parse(storedTheme);

	const gameControls = document.getElementById("gameControls");

	// Initialize objects
	function initGame() {
		leftPaddle = { x: 0, y: canvas.height / 2 - paddleHeight / 2, width: grid, height: paddleHeight, dy: 0 };
		rightPaddle = { x: canvas.width - grid, y: canvas.height / 2 - paddleHeight / 2, width: grid, height: paddleHeight, dy: 0 };
		ball = { 
			x: canvas.width / 2, 
			y: canvas.height / 2, 
			width: grid, 
			height: grid, 
			dx: ballSpeed * (Math.random() > 0.5 ? 1 : -1), // Random initial direction
			dy: ballSpeed * (Math.random() > 0.5 ? 1 : -1)  // But consistent speed
		};
		leftScore = 0;
		rightScore = 0;
		gameOver = false;
	}

	// Reset ball position (modified)
	function resetBall() {
		ball.x = canvas.width / 2;
		ball.y = canvas.height / 2;
		// Keep original ball speed without score-based increases
		ball.dx = ballSpeed * (Math.random() > 0.5 ? 1 : -1);
		ball.dy = ballSpeed * (Math.random() > 0.5 ? 1 : -1);
	}

	// Detect collision
	function collides(obj1, obj2) {
		return obj1.x < obj2.x + obj2.width && obj1.x + obj1.width > obj2.x && obj1.y < obj2.y + obj2.height && obj1.y + obj1.height > obj2.y;
	}

	// Update score and check for game over
	function updateScore() {
		if (ball.x < 0) {
			rightScore++;
			resetBall();
		} else if (ball.x > canvas.width) {
			leftScore++;
			resetBall();
		}
		if (leftScore >= winningScore || rightScore >= winningScore) {
			gameOver = true;
			setTimeout(endMatch, 1000);
		}
	}

	// Display text on canvas
	function drawText(text, x, y) {
		ctx.fillStyle = parsedTheme.paddleColor || "white";
		ctx.font = "20px Arial";
		ctx.fillText(text, x, y);
	}

	function increaseBallSpeed() {
		const speedFactor = 1.05; // 5% speed increase per collision
		ball.dx *= speedFactor;
		ball.dy *= speedFactor;
		
		// Optional: Clamp speed so it doesn't become unmanageable.
		const maxSpeed = 15;
		const currentSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
		if (currentSpeed > maxSpeed) {
			const angle = Math.atan2(ball.dy, ball.dx);
			ball.dx = maxSpeed * Math.cos(angle);
			ball.dy = maxSpeed * Math.sin(angle);
		}
	}

	// Main game loop
	function loop() {
		if (isPaused) return;

		animationFrameId = requestAnimationFrame(loop);
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		if (gameOver) {
			let winner = leftScore >= winningScore ? currentMatch[0] : currentMatch[1];
			// showMatchResultPopup(winner, leftScore, rightScore);
			drawText(`${winner} Wins!`, canvas.width / 2 - 50, canvas.height / 2);
			pauseGame();
			console.log("tournament barangay: ", tournamentBracket.length);
			if (tournamentBracket.length > 1) {
				console.log("show next game popup - bracket bigger than 1");
				showNextGamePopup(resumeGame);
				return;
			} else {
				console.log("show match result popup - bracket less than 1");
				showMatchResultPopup(winner, leftScore, rightScore);
				return;
			}
		}
		
		leftPaddle.y += leftPaddle.dy;
		rightPaddle.y += rightPaddle.dy;
		leftPaddle.y = Math.max(grid, Math.min(leftPaddle.y, maxPaddleY));
		rightPaddle.y = Math.max(grid, Math.min(rightPaddle.y, maxPaddleY));

		// draw middle line
		drawMiddleLine(ctx, canvas);

		// draw paddles
		ctx.fillStyle = parsedTheme.paddleColor || "white";
		ctx.fillRect(leftPaddle.x, leftPaddle.y, leftPaddle.width, leftPaddle.height);
		ctx.fillRect(rightPaddle.x, rightPaddle.y, rightPaddle.width, rightPaddle.height);

		ball.x += ball.dx;
		ball.y += ball.dy;

		if (ball.y < grid || ball.y + grid > canvas.height - grid) {
			ball.dy *= -1;
		}

		// Visual feedback
		if (collides(ball, leftPaddle) || collides(ball, rightPaddle)) {
			// Add paddle "hit" effect
			ctx.fillStyle = "red";
			setTimeout(() => ctx.fillStyle = "orange", 50);
		}

		// In the collision detection (keep this as simple version)
		if (collides(ball, leftPaddle)) {
			ball.dx *= -1;
			ball.x = leftPaddle.x + leftPaddle.width;

			increaseBallSpeed();
		} else if (collides(ball, rightPaddle)) {
			ball.dx *= -1;
			ball.x = rightPaddle.x - ball.width;

			increaseBallSpeed();
		}

		ctx.fillRect(ball.x, ball.y, ball.width, ball.height);

		updateScore();
		drawText(`${currentMatch[0]}: ${leftScore}`, 40, 30);
		drawText(`${currentMatch[1]}: ${rightScore}`, canvas.width - 120, 30);
	}

	function drawMiddleLine(ctx, canvas) {
		ctx.setLineDash([5, 5]); // Dashed line
		ctx.strokeStyle = parsedTheme.paddleColor || "white";
		ctx.lineWidth = 2;

		ctx.beginPath();
		ctx.moveTo(canvas.width / 2, 0); // Start at the top middle
		ctx.lineTo(canvas.width / 2, canvas.height); // End at the bottom middle
		ctx.stroke();
	}

	// Handle player movement
	document.addEventListener("keydown", (e) => {
		if (e.key === "ArrowUp") rightPaddle.dy = -paddleSpeed;
		else if (e.key === "ArrowDown") rightPaddle.dy = paddleSpeed;
		if (e.key === "w") leftPaddle.dy = -paddleSpeed;
		else if (e.key === "s") leftPaddle.dy = paddleSpeed;
	});

	document.addEventListener("keyup", (e) => {
		if (e.key === "ArrowUp" || e.key === "ArrowDown") rightPaddle.dy = 0;
		if (e.key === "w" || e.key === "s") leftPaddle.dy = 0;
	});

	const maxPlayers = 4;

	function registerPlayer() {
		const playerAliasInput = document.getElementById("playerAlias");
		const playerAliasInput2 = document.querySelector("#playerAlias");
		const alias = playerAliasInput.value.trim();

		console.log("players input: ", players);
		console.log("alias 2 input: ", playerAliasInput2);
		console.log("alias: ", alias);

		if (!alias) {
			playerAliasError("empty");
			return;
		}
		if (players.includes(alias)) {
			playerAliasError("duplicate");
			return;
		}

		if (players.length >= maxPlayers) {
			playerAliasError("maxplayers", maxPlayers);
			return;
		}

		if (alias && players.length < maxPlayers) {
			players.push(alias);
			const listItem = document.createElement("li");
			listItem.classList.add("list-group-item");
			listItem.textContent = alias;
			document.getElementById("playersList").appendChild(listItem);
			playerAliasInput.value = "";

			if (players.length === maxPlayers) {
				document.getElementById("tournament").style.display = "block";
				document.getElementById("lunchTournament").style.display = "block";
			}

			document.getElementById("lunchTournament").addEventListener("click", () => {
				document.getElementById("registration").style.display = "none";
				document.getElementById("gameSection").style.display = "block";
				gameControls.style.display = "block";
				gameControls.classList.add("d-flex", "justify-content-center", "flex-wrap", "gap-3");
			});
		}
	}

	function playerAliasError(type) {
		const playerAliasError = document.getElementById("playerAliasError");
		playerAliasError.textContent = "";
		playerAliasError.style.color = "red";

		console.log("playerAliasError: ", playerAliasError);
		
		if (type === "empty") {
			playerAliasError.textContent = "Please enter a valid alias!";
		} else if (type === "duplicate") {
			playerAliasError.textContent = "Player already registered!";
		} else if (type === "maxplayers") {
			playerAliasError.textContent = `Maximum of 4 players allowed!`;
		}

		setTimeout(() => {
			playerAliasError.textContent = "";
		}, 3000);
	}

	// Start tournament
	document.getElementById("startTournament").addEventListener("click", () => {
		startTournament();
	});

	function startTournament() {
		if (players.length < 2) {
			playerAliasError("maxplayers");
			return;
		}
		if (players.length % 2 !== 0) { // Add check for odd number of players
			alert("Odd number of players - adding computer player");
			players.push("Computer");
		}

		tournamentBracket = shuffle([...players]);
		generateNextRound();
		document.getElementById("startTournament").disabled = true;
		document.getElementById("resetTournament").disabled = true;
		document.getElementById("registration").style.display = "none";
		document.getElementById("tournament").style.display = "block";
		document.getElementById("gameSection").style.display = "block";
	}

	// Restart tournament
	function restartTournament() {
		// Stop the game loop if it's running
		if (animationFrameId) {
			cancelAnimationFrame(animationFrameId);
			animationFrameId = null;
		}
	
		// Reset tournament state
		players = [];
		tournamentBracket = [];
		currentRound = [];
		currentMatchIndex = 0;
		leftScore = 0;
		rightScore = 0;
		gameOver = false;
		isPaused = false;

		// Clear the canvas
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Display message on canvas
		drawText("Tournament Restarted", canvas.width / 2, canvas.height / 2);
		// Clear the DOM
		document.getElementById("playersList").innerHTML = "";
		document.getElementById("currentMatch").innerText = "";
		document.getElementById("registration").style.display = "block";
		document.getElementById("tournament").style.display = "none";
		document.getElementById("lunchTournament").style.display = "none";
		document.getElementById("gameSection").style.display = "none";
		document.getElementById("gameControls").style.display = "none";
		document.getElementById("gameControls").classList.remove("d-flex", "justify-content-center", "flex-wrap", "gap-3");
	
		// Re-enable buttons
		document.getElementById("startTournament").disabled = false;
		document.getElementById("resetTournament").disabled = false;
	
		console.log("Tournament restarted");
	}

	// Shuffle players for matchmaking
	// Replace existing shuffle with Fisher-Yates shuffle
	function shuffle(array) {
		for (let i = array.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[array[i], array[j]] = [array[j], array[i]];
		}
		return array;
	}

	// Generate next round
	function generateNextRound() {
		currentRound = [];
		for (let i = 0; i < tournamentBracket.length; i += 2) {
			if (i + 1 < tournamentBracket.length) {
				currentRound.push([tournamentBracket[i], tournamentBracket[i + 1]]);
			} else {
				currentRound.push([tournamentBracket[i], "BYE"]);
			}
		}
		tournamentBracket = currentRound.map(match => match[1] === "BYE" ? match[0] : match);
		currentMatchIndex = 0;
		startNextMatch();
	}

	// Start next match
	// Modify startNextMatch to use iteration instead of recursion
	function startNextMatch() {
		if (animationFrameId) {
			cancelAnimationFrame(animationFrameId);
			animationFrameId = null;
		}
		while (currentMatchIndex < currentRound.length) {
			currentMatch = currentRound[currentMatchIndex];
			if (currentMatch.includes("BYE")) {
				tournamentBracket[currentMatchIndex] = currentMatch[0];
				currentMatchIndex++;
			} else {
				break;
			}
		}
		
		if (currentMatchIndex < currentRound.length) {
			document.getElementById("currentMatch").innerText = `${currentMatch[0]} vs ${currentMatch[1]}`;
			initGame();
			resetBall();
			gameOver = false;
			requestAnimationFrame(loop);
		} else if (tournamentBracket.length === 1) {
			document.getElementById("resetTournament").disabled = false;
			// showMatchResultPopup(tournamentBracket[0], leftScore, rightScore);
			document.getElementById("currentMatch").innerText = `🏆 ${tournamentBracket[0]} is the Champion!`;
		} else {
			generateNextRound();
		}
	}

	function pauseGame() {
		isPaused = true;
		cancelAnimationFrame(animationFrameId); // Stop animation
	}

	function resumeGame() {
		if (isPaused) {
			isPaused = false;
			loop(); // Resume animation
		}
	}

	// End match
	const MATCH_DELAY = 2000; // 1.5 seconds between matches

	// Modify endMatch function
	function endMatch() {
		tournamentBracket[currentMatchIndex] = leftScore >= winningScore ? currentMatch[0] : currentMatch[1];
		currentMatchIndex++;
		setTimeout(startNextMatch, MATCH_DELAY); // Add delay between matches
	}


	// Register player
	document.getElementById("registerPlayer").addEventListener("click", () => {
		registerPlayer();
	});

	document.getElementById("pauseTournament").addEventListener("click", pauseGame);

	document.getElementById("resumeTournament").addEventListener("click", resumeGame);

	document.getElementById("resetTournament").addEventListener("click", () => {
		restartTournament();
	});

	// appSection.addEventListener("click", (e) => {
	// 	// Start Game Button
	// 	console.log("click to start game");
	// 	console.log("e.target.id: ", e.target.id);
	// 	if (e.target.id === "registerPlayer") {
	// 		console.log("Start Game clicked");
	// 		registerPlayer();
	// 		// showGameSatuts('started');
	// 	}

	// }
	// );

}