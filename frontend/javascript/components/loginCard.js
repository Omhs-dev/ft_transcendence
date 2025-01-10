class LoginCard extends HTMLElement {
	constructor() {
		super();
		console.log("Constructed: ", this);
		this.loadLoginCard();
	}

	async loadLoginCard()
	{
		try {
			const response = await fetch("./pages/login.html");

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
	customElements.define('login-card', LoginCard);
}
