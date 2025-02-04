import { check2FaStatus } from "../utils/loginCheck.js";

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

			const loginHtml = await response.text();

			const parser = new DOMParser();
			const doc = parser.parseFromString(loginHtml, "text/html");

			// console.log("dom doc: ", doc);
			
			// const enable2Fa = localStorage.getItem("enable2Fa");
			// console.log("2fa status: ", enable2Fa);

			// const loginCardBody = doc.getElementById("loginCardBody");
			// console.log("loginCardBody: ", loginCardBody);

			// if (enable2Fa === "true") {
			// 	console.log("2fa is enabled in login card");
			// 	check2FaStatus(loginCardBody);
			// 	this.innerHTML = doc.body.innerHTML;
			// } else {
			// 	console.log("2fa is disabled in login card");
			// 	console.log("2fa is disabled in login card");
			// 	this.innerHTML = doc.body.innerHTML;
			// }
			this.innerHTML = doc.body.innerHTML;
		} catch (error) {
			console.error("Failed to load loginCard content: ", error.message);
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
