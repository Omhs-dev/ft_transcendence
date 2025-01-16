import AbsractView from "./AbsractView.js";
import { UpdateUserName } from "../utils/loginCheck.js";

export default class extends AbsractView {
	constructor(params) {
		super(params);
		this.setTitle("Profile");
	}

	async loadHtml() {
        try {
            // Fetch the external HTML file
            const response = await fetch("./pages/profile.html");

            if (!response.ok) {
                throw new Error(`Failed to fetch profile.html: ${response.statusText}`);
            }

			const htmlContent =  await response.text();
			
			const parse = new DOMParser();
			const doc = parse.parseFromString(htmlContent, "text/html");

			const loggedUserName1 = doc.getElementById("loggedUserName1");

			const changeProfilePicture = doc.getElementById("userPicture");
			const selectPicture = doc.getElementById("selectPicture");

			console.log("profile pic: ", changeProfilePicture.src);
			console.log("selectPicture pic: ", selectPicture);
			
			selectPicture.addEventListener("change", (e) => {
				console.log("event target: ", e.target);
			});

			UpdateUserName(loggedUserName1);

            return doc.body.innerHTML;
        } catch (error) {
            console.error(error);
            return "<p>Error loading profile view. Please try again later.</p>";
        }
    }
}
