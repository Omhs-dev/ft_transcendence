import AbsractView from "./AbsractView.js";

export default class extends AbsractView {
	constructor(params) {
		super(params);
		this.setTitle("Tournaments");
	}

	async loadHtml() {
		return `
			<div class="container d-flex flex-column align-items-center mt-5">

			<!-- Title -->
			<h1 class="text-center fw-bold">Pong Game</h1>

			<!-- Game Canvas -->
			<div class="border border-3 rounded p-3 shadow bg-light">
				<canvas id="pongCanvas" width="800" height="400" class="d-block mx-auto"></canvas>
			</div>

			<!-- Game Controls -->
			<div class="d-flex flex-wrap gap-3 justify-content-center mt-4">
				<button id="startGame" class="btn btn-primary">
					<i class="bi bi-play-fill"></i> Start Game
				</button>
				<button id="pauseGame" class="btn btn-warning">
					<i class="bi bi-pause-fill"></i> Pause Game
				</button>
				<button id="resumeGame" class="btn btn-success">
					<i class="bi bi-play-circle-fill"></i> Resume Game
				</button>
				<button id="restartGame" class="btn btn-danger">
					<i class="bi bi-arrow-clockwise"></i> Restart Game
				</button>
			</div>

			<!-- Game Status -->
			<div id="gameStatus" class="alert alert-info text-center mt-4 w-50">
				<!-- Game status updates here -->
			</div>
		</div>

		`;
	}
}
