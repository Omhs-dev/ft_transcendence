import AbsractView from "./AbsractView.js";

export default class extends AbsractView {
	constructor(params) {
		super(params);
		this.setTitle("Dashboard");
	}

	async getHtml() {
		return `
			<h1>This is the Dashboard page</h1>
		`;
	}
}
