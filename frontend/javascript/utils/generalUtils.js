import { getCookie } from "../login.js";

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
