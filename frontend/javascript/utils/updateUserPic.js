

const changeProfilePicture = document.getElementById("userPicture");
console.log("user picture: ", changeProfilePicture);

changeProfilePicture.addEventListener("change", (e) => {
	console.log("event target: ", e.target);
});
