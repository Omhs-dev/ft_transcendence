import AbsractView from "./AbsractView.js";
import { loadUserProfile } from "../utils/generalUtils.js";
import { loadProfilePic } from "../utils/generalUtils.js";
import { loadUserFriendsNbr } from "../utils/generalUtils.js";

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

			// Get the elements from the external HTML file
			const eachUserName = doc.getElementById("eachUserName");
			const eachUserPicture = doc.getElementById("eachUserPicture");
			const eachUserFriendsNbr = doc.querySelector(".eachUserFriendsNbr");
			const eachUserName2 = doc.getElementById("eachUserName2");
			const eachUserName3 = doc.getElementById("eachUserName3");
			const eachUserEmail = doc.getElementById("eachUserEmail");
			// Get the correspondant name and id from the local storage
			const correspondantName = localStorage.getItem("senderName");
			const correspondantId = localStorage.getItem("correspondantId");

			console.log("eachUserFriendsNbr: ", eachUserFriendsNbr);

			if (eachUserName) {
				eachUserName.textContent = correspondantName;
			}
			if (eachUserPicture) {
				const profilePic = await loadProfilePic(correspondantId);
				eachUserPicture.src = profilePic;
				eachUserPicture.style.width = "200px";
				eachUserPicture.style.height = "200px";
			}
			if (eachUserFriendsNbr) {
				const friendsNbr = await loadUserFriendsNbr(correspondantId);
				eachUserFriendsNbr.textContent = friendsNbr;
			}
			if (eachUserName2 && eachUserName3 && eachUserEmail) {
				const profileInfo = await loadUserProfile(correspondantId);
				eachUserName2.textContent = profileInfo.username;
				eachUserName3.textContent = profileInfo.username;
				eachUserEmail.textContent = profileInfo.email;
				console.log("eachUserName2: ", eachUserName2.textContent);
				console.log("eachUserName3: ", eachUserName3.textContent);
				console.log("eachUserEmail: ", eachUserEmail.textContent);
			}

            return doc.body.innerHTML;
        } catch (error) {
            console.error(error);
            return "<p>Error loading profile view. Please try again later.</p>";
        }
    }
}
