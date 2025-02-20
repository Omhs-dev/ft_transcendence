export function initPongGame(player1, player2) {
    let canvas = document.getElementById("pongCanvas");
    canvas.width = 400; // Set canvas width
    canvas.height = 300; // Set canvas height

    console.log("canvas: ", canvas);

    let ctx = canvas.getContext("2d");
    if (!ctx) {
        console.error("Failed to get canvas context");
        return;
    }

    let paddleHeight = 80, paddleWidth = 10;
    let ball = { x: 200, y: 150, dx: 2, dy: 2, radius: 5 };
    let paddles = [
        { x: 0, y: canvas.height / 2 - paddleHeight / 2, dy: 0, score: 0 },  // Player 1
        { x: 380, y: canvas.height / 2 - paddleHeight / 2, dy: 0, score: 0 } // Player 2
    ];

    canvas.style.display = "block";
    ball.x = 200; ball.y = 150;
    paddles[0].score = 0; paddles[1].score = 0;

    let interval = setInterval(() => {
        update();
        draw(); // Ensure draw() is called in the interval

        if (paddles[0].score >= 3) {
            clearInterval(interval);
            declareWinner(player1);
        } else if (paddles[1].score >= 3) {
            clearInterval(interval);
            declareWinner(player2);
        }
    }, 16);

    function update() {
        ball.x += ball.dx;
        ball.y += ball.dy;

        if (ball.y < 0 || ball.y > canvas.height) ball.dy *= -1;
        if (collision(paddles[0]) || collision(paddles[1])) ball.dx *= -1;

        // Update paddles' vertical position based on 'dy'
        paddles[0].y += paddles[0].dy;
        paddles[1].y += paddles[1].dy;

        // Prevent paddles from going out of bounds
        paddles[0].y = Math.max(0, Math.min(canvas.height - paddleHeight, paddles[0].y));
        paddles[1].y = Math.max(0, Math.min(canvas.height - paddleHeight, paddles[1].y));

        // Check for scoring
        if (ball.x < 0) paddles[1].score++;
        if (ball.x > canvas.width) paddles[0].score++;
    }

    function collision(paddle) {
        return (ball.x - ball.radius < paddle.x + paddleWidth &&
                ball.x + ball.radius > paddle.x &&
                ball.y > paddle.y && ball.y < paddle.y + paddleHeight);
    }

    document.addEventListener("keydown", (e) => {
        if (e.key === "w") {
            paddles[0].dy = -2;
            console.log("Player 1 paddle moving up");
        }
        if (e.key === "s") {
            paddles[0].dy = 2;
            console.log("Player 1 paddle moving down");
        }
        if (e.key === "ArrowUp") {
            paddles[1].dy = -2;
            console.log("Player 2 paddle moving up");
        }
        if (e.key === "ArrowDown") {
            paddles[1].dy = 2;
            console.log("Player 2 paddle moving down");
        }
    });

    document.addEventListener("keyup", () => {
        paddles[0].dy = 0;
        paddles[1].dy = 0;
        console.log("Paddles stopped moving");
    });

    function draw() {
        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw paddles
        ctx.fillStyle = "white";
        ctx.fillRect(paddles[0].x, paddles[0].y, paddleWidth, paddleHeight); // Player 1
        ctx.fillRect(paddles[1].x, paddles[1].y, paddleWidth, paddleHeight); // Player 2

        // Draw ball
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = "white";
        ctx.fill();

        // Draw scores
        ctx.font = "20px Arial";
        ctx.fillText(paddles[0].score, 50, 30);
        ctx.fillText(paddles[1].score, canvas.width - 70, 30);
    }
}

function declareWinner(player) {
    document.getElementById("currentMatch").innerText = `${player} wins the tournament!`;
}
