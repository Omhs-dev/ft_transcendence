import { appSection } from "./utils/domUtils.js"

console.log("this startgame file");

console.log("this is to confirm");

console.log("Section appSection: ", appSection);

appSection.addEventListener("click", (event) => {
	if (event.target.id === "startbtn") {
		console.log("button found\n");
	}
	// console.log("clicked here: \n", event.target);
});
