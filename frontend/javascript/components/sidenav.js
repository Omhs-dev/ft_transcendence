class Sidenav extends HTMLElement {
	constructor() {
		super();
		console.log("Constructed: ", this);
		this.loadSidenav();
	}

	async loadSidenav()
	{
		try {
			const response = await fetch("./pages/sidenav.html");

			if (!response.ok) {
				const errorMessage = document.createElement("p");
				errorMessage.innerText = "Could not fetch sidenav file";
				this.appendChild(errorMessage);
				throw new Error(`Error: could not fetch: ${response.status}`);
			}

			this.innerHTML = await response.text();
		} catch (error) {
			console.error("Failed to load sidenav content: ", error.message);
		}
	}

	connectedCallback() {
		console.log("connected", this);
	}

	disconnectedCallback() {
		console.log("disconnected", this);
	}
}

if ('customElements' in window) {
	customElements.define('side-nav', Sidenav);
}