import { endMatch } from "./tournament.js";

// Canvas setup
const canvas = document.getElementById("pongCanvas");
canvas.width = 800;  // Set the width of the canvas
canvas.height = 600; // Set the height of the canvas
const ctx = canvas.getContext("2d");

// Game constants
const grid = 15;
const paddleHeight = grid * 5;
const maxPaddleY = canvas.height - grid - paddleHeight;
const paddleSpeed = 6;
const ballSpeed = 5;
const winningScore = 5;

// Game objects
let leftPaddle, rightPaddle, ball;
let leftScore = 0;
let rightScore = 0;
let gameOver = false;

// Initialize game objects
function initGame() {
    leftPaddle = { x: grid * 2, y: canvas.height / 2 - paddleHeight / 2, width: grid, height: paddleHeight, dy: 0 };
    rightPaddle = { x: canvas.width - grid * 3, y: canvas.height / 2 - paddleHeight / 2, width: grid, height: paddleHeight, dy: 0 };
    ball = { x: canvas.width / 2, y: canvas.height / 2, width: grid, height: grid, dx: ballSpeed, dy: -ballSpeed };
    leftScore = 0;
    rightScore = 0;
    gameOver = false;
}

// Reset ball position
function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
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
        setTimeout(() => endMatch(leftScore >= winningScore ? "left" : "right"), 1000);
    }
}

// Display text on canvas
function drawText(text, x, y) {
    ctx.fillStyle = "black";
    ctx.font = "20px Arial";
    ctx.fillText(text, x, y);
}

// Main game loop
function loop() {
    requestAnimationFrame(loop);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameOver) {
        let winner = leftScore >= winningScore ? currentMatch[0] : currentMatch[1];
        drawText(`${winner} Wins!`, canvas.width / 2 - 50, canvas.height / 2);
        return;
    }

    leftPaddle.y += leftPaddle.dy;
    rightPaddle.y += rightPaddle.dy;
    leftPaddle.y = Math.max(grid, Math.min(leftPaddle.y, maxPaddleY));
    rightPaddle.y = Math.max(grid, Math.min(rightPaddle.y, maxPaddleY));

    ctx.fillStyle = "black";
    ctx.fillRect(leftPaddle.x, leftPaddle.y, leftPaddle.width, leftPaddle.height);
    ctx.fillRect(rightPaddle.x, rightPaddle.y, rightPaddle.width, rightPaddle.height);

    ball.x += ball.dx;
    ball.y += ball.dy;

    if (ball.y < grid || ball.y + grid > canvas.height - grid) {
        ball.dy *= -1;
    }

    if (collides(ball, leftPaddle)) {
        ball.dx *= -1;
        ball.x = leftPaddle.x + leftPaddle.width;
    } else if (collides(ball, rightPaddle)) {
        ball.dx *= -1;
        ball.x = rightPaddle.x - ball.width;
    }

    ctx.fillRect(ball.x, ball.y, ball.width, ball.height);

    updateScore();
    drawText(`${currentMatch[0]}: ${leftScore}`, 20, 30);
    drawText(`${currentMatch[1]}: ${rightScore}`, canvas.width - 120, 30);
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

// Export functions for tournament.js
export { initGame, resetBall, loop };