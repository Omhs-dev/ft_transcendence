import { appSection } from "./utils/domUtils.js";

console.log("initgame.js loaded: show game action buttons ==============>");
console.log("appSection: ", appSection);
document.addEventListener("DOMContentLoaded", (e) => {
	// setTimeout(() => {
	// 	startGame();
	// }, 1000);
});

// function startGame() {
// 	console.log("start game clicked");
// 	const startbtn1 = document.querySelector("#startbtn");

// 	startbtn1.addEventListener("click", (e) => {
// 		console.log("start game clicked");
// 		history.pushState({}, "", `/ponggame`);
// 	});
// }

appSection.addEventListener("click", (e) => {
    // Start Game Button
    if (e.target.className === "fs-2" || e.target.className === "fw-light") {
        console.log("Start Game clicked");
        loadGameScript();
    }

	// console.log("event target: ", e.target);
	// const link = e.target.closest("[data-link]");
    // if (link) {
    //     console.log("link clicked");
    // }

    // // Pause Game Button
    // if (e.target.matches("#pauseGame")) {
    //     console.log("Pause Game clicked");
    //     pauseGame();
    // }

    // // Resume Game Button
    // if (e.target.matches("#resumeGame")) {
    //     console.log("Resume Game clicked");
    //     resumeGame();
    // }

    // // Restart Game Button
    // if (e.target.matches("#restartGame")) {
    //     console.log("Restart Game clicked");
    //     restartGame();
    // }
});

function loadGameScript() {
	let script = document.createElement("script");
	script.src = "javascript/game.js";
	document.body.appendChild(script);
}
