import AbsractView from "./AbsractView.js";

export default class extends AbsractView {
	constructor(params) {
		super(params);
		this.setTitle("Profile");
	}

	async loadHtml() {
		try {
			// Fetch the external HTML file
			const response = await fetch("./pages/requests.html");

			if (!response.ok) {
				throw new Error(`Failed to fetch profile.html: ${response.statusText}`);
			}

			// Return the fetched HTML content as a string
			const htmlContent =  await response.text();
			return htmlContent;
		} catch (error) {
			console.error(error);
			return "<p>Error loading profile view. Please try again later.</p>";
		}
	}
}
