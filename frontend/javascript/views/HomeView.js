import AbsractView from "./AbsractView.js";

export default class extends AbsractView {
	constructor(params) {
		super(params);
		this.setTitle("Home");
	}

	async loadHtml() {
		try {
			console.log("before fetching");
			const response = await fetch("./pages/home.html");
			if (!response.ok) {
				throw new Error(`Error fetching page: ${response.statusText}`);
			}
			console.log("fetching informations");
			const htmlContent = await response.text();
			return htmlContent;
		} catch(error) {
			console.log(error.message);
		}
	}
}
