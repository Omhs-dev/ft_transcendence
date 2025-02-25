import { appSection } from "./domUtils.js";

let themes = {
    classic: { ballColor: "#ffffff", paddleColor: "#ff9900", bgColor: "#000000" },
    dark: { ballColor: "#ff0000", paddleColor: "#444444", bgColor: "#222222" },
    neon: { ballColor: "#00ffcc", paddleColor: "#ff00ff", bgColor: "#000033" }
};

let settingsClassic = themes.classic; // Default theme
let settingsDark = themes.dark;
let settingsNeon = themes.neon;

// Store the default theme as a stringified JSON
const asJson = JSON.stringify(settingsClassic);
console.log("asJson: ", asJson);

localStorage.setItem("pongTheme", asJson);
console.log("themes: ", settingsClassic);

// Ensure appSection exists before adding an event listener
if (appSection) {
    appSection.addEventListener("click", (e) => {
        if (e.target.id === "classic") {
            localStorage.setItem("pongTheme", JSON.stringify(settingsClassic));
        } else if (e.target.id === "dark") {
            localStorage.setItem("pongTheme", JSON.stringify(settingsDark));
        } else if (e.target.id === "neon") {
            localStorage.setItem("pongTheme", JSON.stringify(settingsNeon));
        }
    });
} else {
    console.log("appSection is null. Make sure it's correctly selected.");
}
