import AbsractView from "./AbsractView.js";

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


			// let canvas = doc.getElementById("pongCanvas");
			// let ctx = canvas.getContext("2d");

			// let paddleHeight = 80, paddleWidth = 10;
			// let ball = { x: 200, y: 150, dx: 2, dy: 2, radius: 5 };
			// let paddles = [
			// 	{ x: 10, y: 100, dy: 0, score: 0 },
			// 	{ x: 380, y: 100, dy: 0, score: 0 }
			// ];

			// function initPongGame(player1, player2) {
			// 	doc.getElementById("pongCanvas").style.display = "block";
			// 	ball.x = 200; ball.y = 150;
			// 	paddles[0].score = 0; paddles[1].score = 0;
				
			// 	let interval = setInterval(() => {
			// 		update();
			// 		draw();

			// 		if (paddles[0].score >= 3) {
			// 			clearInterval(interval);
			// 			declareWinner(player1);
			// 		} else if (paddles[1].score >= 3) {
			// 			clearInterval(interval);
			// 			declareWinner(player2);
			// 		}
			// 	}, 16);
			// }

			// function update() {
			// 	ball.x += ball.dx;
			// 	ball.y += ball.dy;

			// 	if (ball.y < 0 || ball.y > canvas.height) ball.dy *= -1;
			// 	if (collision(paddles[0]) || collision(paddles[1])) ball.dx *= -1;

			// 	if (ball.x < 0) paddles[1].score++;
			// 	if (ball.x > canvas.width) paddles[0].score++;
			// }

			// function draw() {
			// 	ctx.clearRect(0, 0, canvas.width, canvas.height);

			// 	ctx.fillRect(paddles[0].x, paddles[0].y, paddleWidth, paddleHeight);
			// 	ctx.fillRect(paddles[1].x, paddles[1].y, paddleWidth, paddleHeight);

			// 	ctx.beginPath();
			// 	ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
			// 	ctx.fill();
			// }

			// function collision(paddle) {
			// 	return (ball.x - ball.radius < paddle.x + paddleWidth && 
			// 			ball.x + ball.radius > paddle.x &&
			// 			ball.y > paddle.y && ball.y < paddle.y + paddleHeight);
			// }


			// ***********************************************************


			// ********************** Tournament **********************
			

            const content = doc.body.innerHTML;
			return content;
        } catch (error) {
            console.error(error);
            return "<p>Error loading profile view. Please try again later.</p>";
        }
    }
}
