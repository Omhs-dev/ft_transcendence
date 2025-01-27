import AbsractView from "./AbsractView.js";

export default class extends AbsractView {
	constructor(params) {
		super(params);
		this.setTitle("Settings");
	}

	async loadHtml() {
		try {
			const response = await fetch("./pages/settings.html");

			if (!response.ok) {
				throw new Error(`Could not fetch api ${response.status}`)
			}

			const htmlContent = await response.text();

			const parser = new DOMParser();
			const doc = parser.parseFromString(htmlContent, "text/html");
			console.log("dom doc: ", doc);

			return doc.body.innerHTML;
		} catch(error) {
			console.error(error.message)
		}
	}
}
