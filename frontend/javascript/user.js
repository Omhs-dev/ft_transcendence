import { appSection } from "./utils/domUtils.js";
import { sideNavSection } from "./utils/sideNavUtil.js";

const token = localStorage.getItem("access_token");

const getOnlineUsers = async () => {
	try {
		if (!token) {
			throw new Error("No access token found. Please log in.");
		}

		const response = await fetch('http://localhost:8000/chat/api/online-users/', {
			method: "GET",
			headers: {
				"Authorization": `Bearer ${token}`,
				"Content-Type": "application/json"
			},
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
			const button = document.createElement("button");
			button.classList.add("btn", "btn-primary", "rounded-pill");
			button.textContent = "Add +";

			button.addEventListener("click", () => sendFriendRequest(user.id));
		
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
		const response = await fetch(`http://localhost:8000/chat/api/send-friend-request/${userId}/`, {
			method: "POST",
			headers: {
				"Authorization": `Bearer ${token}`,
				"Content-Type": "application/json"
			},
		});

		if (!response.ok) {
			throw new Error(`Failed to send request: ${response.statusText}`);
		}

		const data = await response.json();
		alert(data.message || "Friend request sent");
	} catch(error) {
		console.log("Error: ", error);
	}
};

// Fetch Friend Request
const fetchFriendRequests = async () => {
	try {
		const response = await fetch("http://localhost:8000/chat/api/friend-requests/", {
			method: "GET",
			headers: {
				"Authorization": `Bearer ${token}`,
				"Content-Type": "application/json"
			},
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

			button.addEventListener("click", () => acceptFriendRequest(user.id));
		
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
const acceptFriendRequest = async (userId) => {
	try {
		const response = await fetch(`http://localhost:8000/chat/api/accept-friend-request/${userId}/`, {
			method: "POST",
			headers: {
				"Authorization": `Bearer ${token}`,
				"Content-Type": "application/json"
			},
		});

		if (!response.ok) {
			throw new Error(`Failed to accept request: ${response.statusText}`);
		}

		const data = await response.json();
		alert(data.message || "Friend request accepted");
		fetchFriendRequests();
	}
	catch(error) {
		console.log("Error: ", error);
	}
}

// Fetch friend List
const fetchFriendList = async () => {
	try {
		const response = await fetch("http://localhost:8000/chat/api/friends/", {
			method: "GET",
			headers: {
				"Authorization": `Bearer ${token}`,
				"Content-Type": "application/json"
			},
		});

		if (!response.ok) {
			throw new Error(`Failed to fetch friend list: ${response.statusText}`);
		}

		const data = await response.json();

		const friendList = document.getElementById("friendList");
		const friendNumber = document.querySelector(".friendNumber");

		if (data.length >= 0) {
			// friendNumber.textContent = data.length > 0 ? data.length : "0";
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

				button.addEventListener("click", () => blockFriend(user.id));
			
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
		const response = await fetch(`http://localhost:8000/chat/api/block-user/${userId}/`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${token}`
			},
			body: JSON.stringify({ user_id: userId }),
		});

		if (!response.ok) {
			throw new Error(`Failed to block friend: ${response.statusText}`);
		}

		const data = await response.json();
		console.log("Data: ", data);
		alert(data.message || "Friend blocked");
		fetchFriendList();
	}

	catch(error) {
		console.log("Error: ", error);
	}
}

// window.addEventListener("load", () => {
// 	if (!sideNavSection) {
//         console.error("Error: sideNavSection not found!");
//         return;
//     }

// 	if (token) {
// 		// authSection(token);
// 		getOnlineUsers();
// 	} else {
// 		console.error("No access token found. Please log in.");
// 	}
// });

sideNavSection.addEventListener("click", (e) => {
	e.preventDefault();
	
	if (e.target.classList.contains("users")) {
		console.log("users online found");
		getOnlineUsers();
	} else if (e.target.classList.contains("requests")) {
		console.log("friend requests found");
		fetchFriendRequests();
	} else if (e.target.classList.contains("profile")) {
		console.log("friends found");
		fetchFriendList();
	}
});

// appSection.addEventListener("click", (e) => {
// 	if (e.target.classList.contains("friends")) {
// 		console.log("friends found");
// 		fetchFriendList();
// 	}
// });
