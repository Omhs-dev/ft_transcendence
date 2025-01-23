import { appSection } from "./utils/domUtils.js";
import { sideNavSection } from "./utils/sideNavUtil.js";
import { UpdateUserName } from "./utils/loginCheck.js";
import { getCookie } from "./login.js";

const token = localStorage.getItem("access_token");
const baseUrl = "http://localhost:8000"

const getOnlineUsers = async () => {
	try {
		if (!token) {
			throw new Error("No access token found. Please log in.");
		}

		const response = await fetch(`${baseUrl}/chat/api/online-users/`, {
			method: "GET",
			headers: {
				"X-CSRFToken": getCookie('csrftoken'),
				"Content-Type": "application/json"
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
		const response = await fetch(`${baseUrl}/chat/api/send-friend-request/${userId}/`, {
			method: "POST",
			headers: {
				"X-CSRFToken": getCookie('csrftoken'),
				"Content-Type": "application/json"
			},
			credentials: 'include',
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
		const response = await fetch(`${baseUrl}/chat/api/friend-requests/`, {
			method: "GET",
			headers: {
				"X-CSRFToken": getCookie('csrftoken'),
				"Content-Type": "application/json"
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
		const response = await fetch(`${baseUrl}/chat/api/accept-friend-request/${userId}/`, {
			method: "POST",
			headers: {
				"X-CSRFToken": getCookie('csrftoken'),
				"Content-Type": "application/json"
			},
			credentials: 'include',
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
		const response = await fetch(`${baseUrl}/chat/api/friends/`, {
			method: "GET",
			headers: {
				"X-CSRFToken": getCookie('csrftoken'),
				"Content-Type": "application/json"
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
		const response = await fetch(`${baseUrl}/chat/api/block-user/${userId}/`, {
			method: "POST",
			headers: {
				"X-CSRFToken": getCookie('csrftoken'),
				"X-CFRSToken": getCookie('crfstoken')
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

const fetchProfileInfos = async () => {
	try {
		const response = await fetch(`${baseUrl}/auth/api/profile/`, {
			method: 'GET',
			credentials: 'include',
		});

		if(!response.ok) {
			throw new Error(`Failed to upload profile picture: ${response.statusText}`);
		}

		const data = await response.json();
		console.log("User Information: ", data);
		console.log("image: ", data.profile_picture);

		const userImage = document.getElementById("userPicture");
		console.log("User Pic: ", userImage);
		if (data.profile_picture) {
			userImage.src = baseUrl + data.profile_picture;
			userImage.style.height = "200px";
			userImage.style.width = "200px";
			console.log("user image2: ", userImage.src);
		} else {
			userImage.src = "../assets/user1.png";
			console.log("user image3: ", userImage.src);
		}
	} catch(error) {
		console.log(error.message);
	}
};

const updateProfilePicture = async (formData) => {
	try {
		const response = await fetch(`${baseUrl}/auth/api/profile/`, {
			method: 'POST',
			headers: {
				"X-CSRFToken": getCookie('csrftoken'),
				'X-CSRFToken': getCookie('csrftoken'),
			},
			credentials: 'include',
			body: formData,
		});

		console.log("csrf token: ", getCookie("csrftoken"));

		console.log("response: ", response);

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
		fetchProfileInfos();
		fetchFriendList();
	}
});

appSection.addEventListener("change", (e) => {
    const file = e.target.files[0];
	console.log("file infos: ", file);
	
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
		pic.src = event.target.result;
		// pic.style.height = "200px";
		// pic.style.width = "200px";
	};

	reader.readAsDataURL(file);

	const formData = new FormData();
	const userImage = document.getElementById("selectPicture").files[0];
	console.log("user image: ", userImage);
	formData.append("profile_picture", userImage);
	updateProfilePicture(formData);
});
