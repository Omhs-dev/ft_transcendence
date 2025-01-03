import AbsractView from "./AbsractView.js";

export default class extends AbsractView {
	constructor(params) {
		super(params);
		this.setTitle("Dashboard");
	}

	async loadHtml() {
		return `
			<h1>This is the Dashboard page</h1>
		`;
	}
}
