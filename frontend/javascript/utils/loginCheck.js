function hideElements() {
	Array.from(sideNavSection.children).forEach(child => {
		console.log(child);
		child.style.display = "none";
	});
}

export const loginCheck = (bool) => {
	if (bool === true) {
		hideElements();
		console.log("user is logged in");
	} else if (bool === false) {
		hideElements()
		console.log("user is not logged in");
	}
};