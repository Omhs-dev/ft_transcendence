import { appSection } from "./utils/domUtils.js";
import { initPongGame } from "./game.js";

console.log("tournament.js");

let players = [];
let matchQueue = [];
let currentMatch = null;

const registerPlayer = () => {
    console.log("registerPlayer");
    const alias = document.querySelector("#playerAlias").value.trim();
    console.log("alias:", alias);

    if (alias && players.length < 4) {
        console.log("register one player");
        players.push(alias);

        document.querySelector("#playersList").textContent = `Players: ${players.join(", ")}`;

        console.log("players:", players);

		document.querySelector("#playerAlias").value = "";
    }

    if (players.length === 4) {
        setupTournament();
    }
};

const setupTournament = () => {
    document.querySelector("#registration").style.display = "none";
    document.querySelector("#tournament").style.display = "block";

    matchQueue = shuffleArray([...players]); // Randomize order
    generateBracket();
    announceNextMatch();
};

const generateBracket = () => {
    document.querySelector("#bracket").innerHTML = `<p>${matchQueue.join(" vs ")}</p>`;
};

const announceNextMatch = () => {
    const currentMatchText = document.querySelector("#currentMatch");

    if (matchQueue.length >= 2) {
        currentMatch = [matchQueue.shift(), matchQueue.shift()];
        currentMatchText.textContent = `${currentMatch[0]} vs ${currentMatch[1]}`;
    } else {
        currentMatchText.textContent = `🏆 ${matchQueue[0]} is the Champion! 🏆`;
    }
};

const startGame = () => {
    console.log("startGame");
    if (currentMatch) {
        // document.getElementById("pongCanvas").style.display = "block"; // Make sure canvas is visible
        initPongGame(currentMatch[0], currentMatch[1]);
    }
};


const declareWinner = (winner) => {
    matchQueue.push(winner);
    announceNextMatch();
};

const resetTournament = () => {
    players = [];
    matchQueue = [];
    currentMatch = null;

    document.querySelector("#registration").style.display = "block";
    document.querySelector("#tournament").style.display = "none";
    document.querySelector("#playersList").textContent = "";
    document.querySelector("#bracket").innerHTML = "";
    document.querySelector("#pongCanvas").style.display = "none";
};

const shuffleArray = (array) => array.sort(() => Math.random() - 0.5);

appSection.addEventListener("click", (e) => {
    console.log("e.target.id:", e.target.id);

    const actions = {
        registerPlayer,
        startTournament: startGame,
        resetTournament
    };

    if (actions[e.target.id]) {
        actions[e.target.id]();
    }
});
