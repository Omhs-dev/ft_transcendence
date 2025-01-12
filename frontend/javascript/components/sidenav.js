import { sideNavLoad } from "../utils/loginCheck.js";

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
			const token = localStorage.getItem("access_token");

			const sideNavHtml = await response.text();

			// Parse the HTML string into a document
			const parser = new DOMParser();
			const doc = parser.parseFromString(sideNavHtml, "text/html");
			// Get the sidenav element
			const sideNav = doc.querySelector(".sidenav");

			// Check if user is logged in
			if (token) {
				this.innerHTML = sideNavHtml;
			} else {
				sideNavLoad(sideNav);
				this.innerHTML = doc.body.innerHTML;
			}
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