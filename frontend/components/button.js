class Button extends HTMLElement {
	constructor() {
		super();

		this.innerHTML = 
		`
			<style>
				button {
					height: 80px;
					width: 400px;
					background-color: #28a745 !important;
					color: white;
					border: none;
					border-radius: 10px !important;
					font-weight: bold;
					line-height: 80px;
					transition: transform 0.3s ease, box-shadow 0.3s ease;
					cursor: pointer;
					box-shadow: 2px 4px 6px rgba(0, 0, 0, 0.2);
				}

				button:hover {
					transform: translateY(-5px);
					box-shadow: 2px 8px 12px rgba(0, 0, 0, 0.3);
				}
			</style>
			<button type="button" class="btn btn-success mybtn mb-3">
				<div class="d-flex flex-column">
					<span class="fs-2">Start Game</span>
					<small class="fw-light">Play with a training AI</small>
				</div>
			</button>
		`;
	}
	
	connectedCallback () {
		console.log("connected: ", this);
	}

	disconnectedCallback () {
		console.log("disconnected: ", this);
	}
}

if ("customElements" in window) {
	customElements.define("my-btn", Button);
}