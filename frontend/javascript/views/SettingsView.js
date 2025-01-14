import AbsractView from "./AbsractView.js";

export default class extends AbsractView {
	constructor(params) {
		super(params);
		this.setTitle("Settings");
	}

	async loadHtml() {
		return `
			<h1>This is the settings page</h1>
		`;
	}
}