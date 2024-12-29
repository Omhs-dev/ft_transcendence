const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const paddleWidth = 10;
const paddleHeight = 100;
const ballSize = 10;

let player1 = { x: 0, y: canvas.height / 2 - paddleHeight / 2, score: 0 };
let player2 = { x: canvas.width - paddleWidth, y: canvas.height / 2 - paddleHeight / 2, score: 0 };
let ball = { x: canvas.width / 2, y: canvas.height / 2, dx: 4, dy: 4 };

let keys = {};
let websocket;

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
  ctx.fillText(`Player 1: ${player1.score}`, 50, 20);
  ctx.fillText(`Player 2: ${player2.score}`, canvas.width - 150, 20);
}

// Move paddles
function movePaddles() {
  const paddleSpeed = 5;

  if (keys.w && player1.y > 0) player1.y -= paddleSpeed;
  if (keys.s && player1.y < canvas.height - paddleHeight) player1.y += paddleSpeed;

  if (keys.ArrowUp && player2.y > 0) player2.y -= paddleSpeed;
  if (keys.ArrowDown && player2.y < canvas.height - paddleHeight) player2.y += paddleSpeed;
}

// Move ball
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
  }

  // Ball goes out of bounds
  if (ball.x < 0) {
    player2.score++;
    resetBall();
  } else if (ball.x > canvas.width) {
    player1.score++;
    resetBall();
  }
}

// Reset ball position
function resetBall() {
  ball.x = canvas.width / 2;
  ball.y = canvas.height / 2;
  ball.dx = 4 * (Math.random() > 0.5 ? 1 : -1);
  ball.dy = 4 * (Math.random() > 0.5 ? 1 : -1);
}

// Update game state
function updateGame() {
  movePaddles();
  moveBall();
  draw();
}

// WebSocket connection
function setupWebSocket() {
  websocket = new WebSocket("ws://localhost:8000/ws/game/");
  
  websocket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === "game_update") {
      player1 = data.player1;
      player2 = data.player2;
      ball = data.ball;
    }
  };

  websocket.onopen = () => {
    console.log("WebSocket connected");
  };

  websocket.onclose = () => {
    console.log("WebSocket disconnected");
  };
}

// Start game loop
document.getElementById("startGame").addEventListener("click", () => {
  setupWebSocket();
  setInterval(updateGame, 1000 / 60);
});

// Key event listeners
window.addEventListener("keydown", (e) => keys[e.key] = true);
window.addEventListener("keyup", (e) => keys[e.key] = false);
