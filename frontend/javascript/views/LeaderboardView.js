import AbsractView from "./AbsractView.js";

export default class extends AbsractView {
	constructor(params) {
		super(params);
		this.setTitle("Leaderboard");
	}

	async loadHtml() {
		try {
			const response = await fetch("./pages/leaderbord.html");

			if (!response.ok)
			{
				throw new Error(`Error Fetching page: ${response.status}`);
			}

			const htmlContent = await response.text();
			return htmlContent;
		} catch(error) {
			console.error(`Error: could not fetch page: `, error.message);
		}
	}
}