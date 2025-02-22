import AbsractView from "./AbsractView.js";
// import { loadDefaultPic } from "../utils/loginCheck.js";

export default class extends AbsractView {
	constructor(params) {
		super(params);
		this.setTitle("Profile");
	}

	async loadHtml() {
        try {
            // Fetch the external HTML file
            const response = await fetch("./pages/userprofile.html");

            if (!response.ok) {
                throw new Error(`Failed to fetch profile.html: ${response.statusText}`);
            }

			const htmlContent =  await response.text();

			const parse = new DOMParser();
			const doc = parse.parseFromString(htmlContent, "text/html");

			// const loggedUserName1 = doc.getElementById("loggedUserName1");
			// const userPicture = doc.getElementById("userPicture");
			// const userPicSideNav = doc.getElementById("userImageSnav");
			// const userName = localStorage.getItem("username");

			// if (loggedUserName1) {
			// 	console.log("loggedUserName1 is valid 1");
			// 	loggedUserName1.textContent = userName;
			// }

			// // Load default user pic
			// loadDefaultPic(userPicSideNav, userPicture);

            return doc.body.innerHTML;
        } catch (error) {
            console.error(error);
            return "<p>Error loading profile view. Please try again later.</p>";
        }
    }
}
