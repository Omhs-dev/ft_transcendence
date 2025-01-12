import AbsractView from "./AbsractView.js";
import { authSection } from "../utils/loginCheck.js";

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

			const htmlContent = await response.text();

			const parser = new DOMParser();
			const doc = parser.parseFromString(htmlContent, "text/html");

			const authSec = doc.querySelector(".homesection");
			authSection(authSec);

			const containt = doc.body.innerHTML;
			return containt;
		} catch(error) {
			console.log(error.message);
		}
	}
}
