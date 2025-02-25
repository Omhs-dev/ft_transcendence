import { getCookie } from "../login.js";
import { appSection } from "./domUtils.js";

const baseUrl = window.location.origin;

export async function loadUserProfile(userId) {
	try {
		const response = await fetch(`${baseUrl}/auth/api/profile/?id=${userId}`, {
			method: 'GET',
			headers: {
				'X-CSRFToken': getCookie('csrftoken'),
				'Content-Type': 'application/json',
			},
			credentials: 'include',
		});

		if (!response.ok) {
			throw new Error(`Error fetching API: ${response.status} - ${response.statusText}`);
		}

		const data = await response.json();
		// console.log("Data: ", data);
		return data;
	} catch (error) {
		console.error("Error fetching online users: ", error);
	}
};

export async function loadProfilePic(userId) {
	const profileInfo = await loadUserProfile(userId);
	const profilePic = profileInfo.profile_picture ? baseUrl + profileInfo.profile_picture : null;
	return profilePic;
}

export async function loadUserFriendsList(userId, userFriendsList) {
	const profileInfo = await loadUserProfile(userId);
	const friendsList = profileInfo.friends;

	userFriendsList.innerHTML = "";

	friendsList.forEach((friend, index) => {
		const friendId = friend.id;
		const friendName = friend.username;
		const tr = document.createElement("tr");
		const th = document.createElement("th");
		th.setAttribute("scope", "row");
		th.textContent = index + 1;
		const tdUsername = document.createElement("td");
		tdUsername.textContent = friendName;
		tr.appendChild(th);
		tr.appendChild(tdUsername)
		userFriendsList.appendChild(tr);
	});
}

export async function loadUserFriendsNbr(userId) {
	const profileInfo = await loadUserProfile(userId);
	const friendsNbr = profileInfo.friends.length;
	return friendsNbr;
}

export function viewUserProfile(userProfileLink, sender, currentUserName) {
	userProfileLink.addEventListener('click', (e) => {
		e.preventDefault();

		console.log("view user profile clicked");
		
		if (sender === currentUserName) {
			console.log("sender is current user");
			console.log("sender: ", sender);
			console.log("current user: ", currentUserName);
			history.pushState({}, "", `/profile`);
		} else {
			console.log("sender is not current user");
			history.pushState({}, "", `/userprofile`);
		}
	});
}


// pop alert for winner
export function showMatchResultPopup(winnerName, player1Score, player2Score) {
    // Remove existing modal if present
    const existingModal = document.getElementById("matchResultModal");
    if (existingModal) {
        existingModal.remove();
    }

    // Create modal container
    const modal = document.createElement("div");
    modal.id = "matchResultModal";
    modal.className = "modal fade";
    modal.tabIndex = "-1";
	modal.style.marginLeft = "130px";
    modal.setAttribute("aria-hidden", "true");

    // Modal content
    modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content bg-dark text-white border-0">
                <div class="modal-header border-0">
                    <h5 class="modal-title fw-bold">MATCH RESULT</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body text-center">
					<p class="text-success fw-bolder">
						WINNER 🏆:
					</p>
					<span class="text-success fw-bolder">${winnerName}</span>
                    <p class="fs-4">
						SCORE: 
                    </p>
					<h4>${player1Score} - ${player2Score}</h4>
                </div>
                <div class="modal-footer border-0 d-flex justify-content-center">
                    <button type="button" class="btn btn-primary px-4 py-2" data-bs-dismiss="modal">OK</button>
                </div>
            </div>
        </div>
    `;

    // Append modal to body
    appSection.appendChild(modal);

    // Initialize Bootstrap modal
    const bootstrapModal = new bootstrap.Modal(modal);
    bootstrapModal.show();
}

export function showNextGamePopup(resumeGame) {
    // Create popup container
    let popup = document.createElement("div");
    popup.id = "nextGamePopup";
	popup.style.position = "fixed";
	popup.style.top = "50%";
	popup.style.left = "55%"; // Moves it slightly to the right
	popup.style.transform = "translate(-40%, -50%)"; // Moves it right by reducing the negative X offset
    popup.style.background = "#333";
    popup.style.color = "white";
    popup.style.padding = "20px";
    popup.style.borderRadius = "10px";
    popup.style.boxShadow = "0 0 10px rgba(0,0,0,0.5)";
    popup.style.textAlign = "center";
    popup.style.zIndex = "1000";

    // Add text
    let message = document.createElement("p");
    message.innerText = "Next Game Starting Soon!";
    popup.appendChild(message);

    // Add Next Game button
    let nextGameButton = document.createElement("button");
    nextGameButton.innerText = "Start Next Game";
    nextGameButton.style.marginTop = "10px";
    nextGameButton.style.padding = "10px 15px";
    nextGameButton.style.border = "none";
    nextGameButton.style.cursor = "pointer";
    nextGameButton.style.background = "#ffcc00";
    nextGameButton.style.color = "black";
    nextGameButton.style.fontSize = "16px";
    nextGameButton.style.borderRadius = "5px";

    // Close popup and start new game
    nextGameButton.onclick = function () {
		if (typeof resumeGame === "function")
		{
			resumeGame();
		}
        appSection.removeChild(popup);
    };

    popup.appendChild(nextGameButton);

    // Append popup to body
    appSection.appendChild(popup);
}
