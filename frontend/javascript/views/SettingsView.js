import AbsractView from "./AbsractView.js";
import { twoFaAlreadyEnabled } from "../utils/2faUtils.js";

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
			// console.log("dom doc: ", doc);

			const enable2Fa = localStorage.getItem("enable2Fa");
			const checkbox = doc.getElementById("enable2FA");
			const choose2FaMethod = doc.getElementById("choose2FaMethod");

			if (enable2Fa === "true") {
				checkbox.setAttribute('checked', '');
				choose2FaMethod.innerHTML = `
					<div class="mb-4">
						<p class="text-muted">2FA is <strong>enabled</strong></p>
					</div>
				`;
			}

			return doc.body.innerHTML;
		} catch(error) {
			console.error(error.message)
		}
	}
}
