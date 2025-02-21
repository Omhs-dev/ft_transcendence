import { initGame, resetBall, loop } from "./game.js";
import { appSection } from "./utils/domUtils.js";

let players = [];
let currentMatch = [];
let tournamentBracket = [];
let currentRound = [];
let currentMatchIndex = 0;
const maxPlayers = 4;

// Register players

function registerPlayer() {
	const playerAliasInput = document.querySelector("playerAlias");
	const alias = playerAliasInput.value.trim();

	if (alias && players.length < maxPlayers) {
		players.push(alias);
		const listItem = document.createElement("li");
		listItem.classList.add("list-group-item");
		listItem.textContent = alias;
		document.querySelector("playersList").appendChild(listItem);
		playerAliasInput.value = "";

		if (players.length === maxPlayers) {
			document.querySelector("tournament").style.display = "block";
			document.querySelector("startTournament").style.display = "block";
		}
	}
}

// Start tournament

function startTournament() {
	if (players.length < 2) {
        alert("At least 2 players are required!");
        return;
    }
    tournamentBracket = shuffle([...players]);
    generateNextRound();
    document.querySelector("registration").style.display = "none";
    document.querySelector("tournament").style.display = "block";
}

function declareWinner(winner) {
	const winnerText = document.createElement("p");
	winnerText.textContent = `${winner} wins!`;
	document.querySelector("winner").appendChild(winnerText);
}

// Shuffle players for matchmaking
function shuffle(array) {
    return array.sort(() => Math.random() - 0.5);
}

// Generate next round
function generateNextRound() {
    currentRound = [];
    for (let i = 0; i < tournamentBracket.length; i += 2) {
        if (i + 1 < tournamentBracket.length) {
            currentRound.push([tournamentBracket[i], tournamentBracket[i + 1]]);
        } else {
            currentRound.push([tournamentBracket[i], "BYE"]);
        }
    }
    tournamentBracket = currentRound.map(match => match[1] === "BYE" ? match[0] : match);
    currentMatchIndex = 0;
    startNextMatch();
}

// Start next match
function startNextMatch() {
    if (currentMatchIndex < currentRound.length) {
        currentMatch = currentRound[currentMatchIndex];
        if (currentMatch.includes("BYE")) {
            currentMatchIndex++;
            startNextMatch();
        } else {
            document.querySelector("currentMatch").innerText = `${currentMatch[0]} vs ${currentMatch[1]}`;
            initGame();
            resetBall();
            gameOver = false;
            requestAnimationFrame(loop);
        }
    } else if (tournamentBracket.length === 1) {
        document.querySelector("currentMatch").innerText = `🏆 ${tournamentBracket[0]} is the Champion!`;
    } else {
        generateNextRound();
    }
}

// End match
export function endMatch(winnerSide) {
    tournamentBracket[currentMatchIndex] = winnerSide === "left" ? currentMatch[0] : currentMatch[1];
    currentMatchIndex++;
    startNextMatch();
}

appSection.addEventListener("click", (event) => {
	if (event.target.matches("registerPlayer")) {
		registerPlayer();
	} else if (event.target.matches("startTournament")) {
		startTournament();
	} else if (event.target.matches("resetTournament")) {
		location.reload();
	}
});