import { unloggedSideNav } from "../utils/loginCheck.js";
import { UpdateUserName } from "../utils/loginCheck.js";
import { loadDefaultPic } from "../utils/loginCheck.js";

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

			const sideNavHtml = await response.text();
			
			const username = localStorage.getItem("username");
			const isAuthenticated = localStorage.getItem("isAuthenticated");
			const isOauthLogged = localStorage.getItem("isOauthLogged");
			
			// Parse the HTML string into a document
			const parser = new DOMParser();
			const doc = parser.parseFromString(sideNavHtml, "text/html");
			// Get the sidenav element
			const sideNav = doc.querySelector(".sidenav");
			
			// const userPicture = doc.getElementById("userPicture");
			const userPicSideNav = doc.getElementById("userImageSnav");
			// console.log("side nave pic: ", userPicSideNav);
			userPicSideNav.src = "../assets/user.png";

			// Check if user is logged in
			if ((isAuthenticated || isOauthLogged) && username) {
				console.log("User is logged in side nav");
				this.innerHTML = doc.body.innerHTML;
				UpdateUserName();
			} else {
				unloggedSideNav(sideNav);
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