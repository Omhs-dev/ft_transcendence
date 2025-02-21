import { appSection } from "./utils/domUtils.js";
import { sideNavSection } from "./utils/sideNavUtil.js";
import { getCookie } from "./login.js";

const token = localStorage.getItem("access_token");
const baseUrl = "http://localhost:8000"

const getOnlineUsers = async () => {
	try {
		const response = await fetch(`${baseUrl}/chat/api/online-users/`, {
			method: 'GET',
			headers: {
				'X-CSRFToken': getCookie('csrftoken'),
				'Content-Type': 'application/json',
			},
			credentials: 'include',
		});

		if (!response.ok) {
			alert("could not fetch api");
			throw new Error("Error fetching api: ", response.status);
		}

		const data = await response.json();
		console.log("Online Users: ",data);

		const userList = document.getElementById("userList");
		console.log("user list: ", userList);

		data.forEach((user, index) => {
			// Create a new <tr> element
			const tr = document.createElement("tr");
		
			// Create <th> for the index
			const th = document.createElement("th");
			th.setAttribute("scope", "row");
			th.textContent = index + 1; // Row number
		
			// Create <td> for username
			const tdUsername = document.createElement("td");
			tdUsername.textContent = user.username;
		
			// Create <td> for button
			const tdButton = document.createElement("td");
			const addButton = document.createElement("button");
			const messageButton = document.createElement("button");
			addButton.classList.add("btn", "btn-primary", "rounded-pill");
			addButton.id = "addFriend";
			addButton.textContent = "Add +";

			addButton.addEventListener("click", () => sendFriendRequest(user.id));
		
			// Append button inside <td>
			tdButton.appendChild(button);
		
			// Append all elements to the <tr>
			tr.appendChild(th);
			tr.appendChild(tdUsername);
			tr.appendChild(tdButton);
		
			// Append <tr> to the <tbody> (userList)
			userList.appendChild(tr);
		});

	} catch(error) {
		console.log(error.message);
	}
};

//send Friend Request
const sendFriendRequest = async (userId) => {
	try {
		const response = await fetch(`${baseUrl}/chat/api/send-friend-request/${userId}/`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRFToken': getCookie('csrftoken'),
			},
			credentials: 'include',
		});

		if (!response.ok) {
			throw new Error(`Failed to send request: ${response.statusText}`);
		}

		const data = await response.json();

		const btn = document.getElementById("addFriend");
		console.log("Button: ", btn);

		btn.textContent = "Request Sent";
		btn.disabled = true;
		alert(data.message || "Friend request sent");
	} catch(error) {
		console.log("Error: ", error);
	}
};

// Fetch Friend Request
const fetchFriendRequests = async () => {
	try {
		const response = await fetch(`${baseUrl}/chat/api/friend-requests/`, {
			method: 'GET',
			headers: {
				'X-CSRFToken': getCookie('csrftoken'),
			},
			credentials: 'include',
		});

		if (!response.ok) {
			throw new Error(`Failed to fetch friend requests: ${response.statusText}`);
		}

		const data = await response.json();

		const userList = document.getElementById("requestList");

		data.forEach((user, index) => {
			console.log("User: ", user.from_user);
			console.log("Index: ", index);
			// Create a new <tr> element
			const tr = document.createElement("tr");
		
			// Create <th> for the index
			const th = document.createElement("th");
			th.setAttribute("scope", "row");
			th.textContent = index + 1; // Row number
		
			// Create <td> for username
			const tdUsername = document.createElement("td");
			tdUsername.textContent = user.from_user;
			
			// Create <td> for button
			const tdButton = document.createElement("td");
			const button = document.createElement("button");
			button.classList.add("btn", "btn-primary", "rounded-pill");
			button.textContent = "Accept";

			button.addEventListener("click", () => {
				acceptFriendRequest(user.id, tr);
				// create an alert to show that the request has been accepted
				const acceptAlert = document.createElement("div");
				acceptAlert.classList.add("alert", "alert-success", "position-absolute", "top-0", "end-0");
				acceptAlert.setAttribute("role", "alert");
				acceptAlert.textContent = "Friend request accepted!";
				appSection.appendChild(acceptAlert);
				setTimeout(() => {
					acceptAlert.remove();
				}, 3000);
			});
		
			// Append button inside <td>
			tdButton.appendChild(button);
		
			// Append all elements to the <tr>
			tr.appendChild(th);
			tr.appendChild(tdUsername);
			tr.appendChild(tdButton);
		
			// Append <tr> to the <tbody> (userList)
			userList.appendChild(tr);
		});

		console.log("Friend Requests: ", data);
	} catch(error) {
		console.log("Error: ", error);
	}
};

// Accept Friend Request
const acceptFriendRequest = async (userId, userTr) => {
	try {
		const response = await fetch(`${baseUrl}/chat/api/accept-friend-request/${userId}/`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRFToken': getCookie('csrftoken'),
			},
			credentials: 'include',
		});

		if (!response.ok) {
			throw new Error(`Failed to accept request: ${response.statusText}`);
		}

		const data = await response.json();

		userTr.remove();
	}
	catch(error) {
		console.log("Error: ", error);
	}
}

// Fetch friend List
const fetchFriendList = async () => {
	try {
		const response = await fetch(`${baseUrl}/chat/api/friends/`, {
			method: 'GET',
			headers: {
				'X-CSRFToken': getCookie('csrftoken'),
			},
			credentials: 'include',
		});

		console.log("response status: ", response.status);

		if (!response.ok) {
			if (response.status == 401) {
				return;
			} else {
				throw new Error(`Failed to fetch friend list: ${response.statusText}`);
			}
		}

		const data = await response.json();

		const friendList = document.getElementById("friendList");
		const friendNumber = document.querySelector(".friendNumber");
		let blockedUsersId = JSON.parse(localStorage.getItem("blockedUser")) || [];

		// Ensure it's an array (in case of a bad value in localStorage)
		if (!Array.isArray(blockedUsersId)) {
			blockedUsersId = [];
		}

		if (data.length >= 0) {
			data.forEach((user, index) => {
				console.log("User: ", user.from_user);
				console.log("Index: ", index);
				// Create a new <tr> element
				const tr = document.createElement("tr");

				friendNumber.textContent = data.length > 0 ? data.length : "0";
				// Create <th> for the index
				const th = document.createElement("th");
				th.setAttribute("scope", "row");
				th.textContent = index + 1; // Row number
			
				// Create <td> for username
				const tdUsername = document.createElement("td");
				tdUsername.textContent = user.username;
			
				// Create <td> for button
				const tdButton = document.createElement("td");
				const button = document.createElement("button");
				button.classList.add("btn", "btn-primary", "rounded-pill");
				button.textContent = "block";

				// Check if user is blocked
				if (blockedUsersId.includes(user.id)) {
					console.log("this user is blocked");
					console.log("user id: ", user.id);
					button.textContent = "Blocked";
					button.disabled = true;
				} else {
					console.log("this user is not blocked");
				}

				// Handle button click to block user
				button.addEventListener("click", () => {
					blockFriend(user.id);
					button.textContent = "Blocked";
					button.disabled = true;
					blockedUsersId.push(user.id);
					localStorage.setItem("blockedUser", JSON.stringify(blockedUsersId));
				});

				// Append button inside <td>
				tdButton.appendChild(button);
			
				// Append all elements to the <tr>
				tr.appendChild(th);
				tr.appendChild(tdUsername);
				tr.appendChild(tdButton);
			
				// Append <tr> to the <tbody> (userList)
				friendList.appendChild(tr);
			});
		}

		console.log("Friend List: ", data);
	}
	catch(error) {
		console.log("Error: ", error);
	}
}

// Block Friend
const blockFriend = async (userId) => {
	try {
		const response = await fetch(`${baseUrl}/chat/api/block-user/${userId}/`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRFToken': getCookie('csrftoken'),
			},
			credentials: 'include',
			body: JSON.stringify({ user_id: userId }),
		});

		const data = await response.json();

		console.log("response status: ", response.status);
		console.log("Data: ", data);

		if (!response.ok) {
			throw new Error(`Failed to block friend: ${response.statusText}`);
		}

		// const data = await response.json();
		// console.log("Data: ", data);
		console.log("Friend blocked");
	}

	catch(error) {
		console.log("Error: ", error);
	}
}

// Profile Picture
const fetchProfileInfo = async () => {
	try {
		const response = await fetch(`${baseUrl}/auth/api/profile/`, {
			method: 'GET',
			headers: {
				'X-CSRFToken': getCookie('csrftoken'),
			},
			credentials: 'include',
		});

		if(!response.ok) {
			throw new Error(`Failed to upload profile picture: ${response.statusText}`);
		}

		const data = await response.json();

		const userPicture = document.getElementById("userPicture");
		const userPicSideNav = document.getElementById("userImageSnav");

		if (data.profile_picture) {
			userPicSideNav.src = baseUrl + data.profile_picture;
			console.log("pic 2: ", userPicSideNav.src);
			if (userPicture) {

				userPicture.src = baseUrl + data.profile_picture;
				userPicture.style.height = "200px";
				userPicture.style.width = "200px";
			}
		}

		const twoFa = data.is_2fa_enabled;
		localStorage.setItem("twoFa", twoFa);
		localStorage.setItem("username", data.username);
		// console.log("profile information: ", data);
	} catch(error) {
		console.log(error.message);
	}
};

const updateProfilePicture = async (formData) => {
	try {
		const response = await fetch(`${baseUrl}/auth/api/profile/`, {
			method: 'POST',
			headers: {
				'X-CSRFToken': getCookie('csrftoken'),
			},
			credentials: 'include',
			body: formData,
		});

		if (!response.ok) {
			throw new Error(`Failed to upload profile picture: ${response.statusText}`);
		}

		const data = await response.json();

		console.log("file uploaded");
		console.log("Data: ", data);
	} catch(error) {
		console.log("Error: ", error);
	}
};

const isAuthenticated = localStorage.getItem("isAuthenticated");
const userName = localStorage.getItem("username");


document.addEventListener("DOMContentLoaded", () => {
	if (isAuthenticated && userName) {
		fetchProfileInfo();

		if (window.location.pathname === "/profile") {
			fetchFriendList();
		} else if (window.location.pathname === "/requests") {
			fetchFriendRequests();
		}
	}
});

sideNavSection.addEventListener("click", (e) => {
	e.preventDefault();
	
	if (e.target.classList.contains("users")) {
		console.log("users online found");
		// getOnlineUsers();
	} else if (e.target.classList.contains("requests")) {
		console.log("friend requests found");
		fetchFriendRequests();
	} else if (e.target.classList.contains("profile")) {
		fetchProfileInfo();
		fetchFriendList();
	}
});

appSection.addEventListener("change", (e) => {
	if (e.target.id === "selectPicture") {
		console.log("file selected");
		const file = e.target.files[0];

		if (!file)
			return;

		if (!file.type.startsWith("image/"))
			return;

		if (file.size > 2 * 1024 * 1024)
			return;

		const reader = new FileReader();
		reader.onload = (event) => {
			console.log("this is the event: ");
			const pic = document.getElementById("userPicture");
			const picSideNav = document.getElementById("userImageSnav");
			pic.src = event.target.result;
			picSideNav.src = event.target.result;
			// pic.style.height = "200px";
			// pic.style.width = "200px";
		};

		reader.readAsDataURL(file);

		const formData = new FormData();
		const userImage = document.getElementById("selectPicture").files[0];
		// console.log("user image: ", userImage);
		formData.append("profile_picture", userImage);
		updateProfilePicture(formData);
	}
});
