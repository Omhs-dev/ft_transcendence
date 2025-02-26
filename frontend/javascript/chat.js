import { appSection } from "./utils/domUtils.js";
import { sideNavSection } from "./utils/sideNavUtil.js";
import { loadUserProfile, viewUserProfile } from "./utils/generalUtils.js";
import { loadUserFriendsList } from "./utils/generalUtils.js";
import { getCookie } from "./login.js";

const chatIcon = document.getElementById('chatIcon');
const chatBox = document.getElementById('chatBox');
const closeChat = document.getElementById('closeChat');
// const chatInput = document.getElementById('chatInput');
const messageContainer = document.getElementById('messages');
const sendButton = document.getElementById('sendButton');
const notificationNbr = document.getElementById('notificationNbr');

// let userId = null;
let chatSocket = null;
let chatRoomId = null;
let onlineUsers = {};
let notificationCount = 0;

// the base url for the backend
const baseUrl = window.location.origin;

const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
const wsUrl = `${protocol}:${window.location.hostname}/${protocol}/chat/`;

document.addEventListener('DOMContentLoaded', () => {
	console.log("DOM fully loaded and parsed");

	const userId = localStorage.getItem('userId');
	const username = localStorage.getItem('username');
	console.log("userId: ", userId);
	
	if (userId && username) {
		// console.log("loaded connecting to websocket");
		startTokenRefreshTimer();
		// connectWebSocket();
		updateOnlineUsers();
	}
});

window.addEventListener('load', () => {
	const userId = localStorage.getItem('userId');
	const username = localStorage.getItem('username');
	const isAuthenticated = localStorage.getItem('isAuthenticated');
	// console.log("userId: ", userId);
	const wsConnected = localStorage.getItem("wsConnected");
	console.log("wsConnected: ", wsConnected);

	if (wsConnected === "false" && chatSocket !== null) {
		console.log("closing websocket in load event listener");
		chatSocket.close();
	} else if (wsConnected === "false" && isAuthenticated) {
		console.log("reconnecting to websocket user is authenticated");
		connectWebSocket();
	}
	console.log("user is logged in connecting to websocket");
	if (userId && username) {
		if (wsConnected === "true") {
				console.log("user is logged in connecting to websocket");
			// 	console.log("user is logged in connecting to websocket");
				connectWebSocket();
			// 	updateOnlineUsers();
			}
		// connectWebSocket();
		updateOnlineUsers();
	}
});

sideNavSection.addEventListener("click", (e) => {
	e.preventDefault();

	if (e.target.classList.contains("users")) {
		setTimeout(() => {
			// connectWebSocket();
			updateOnlineUsers();
		}, 100);
	}
});

// ----------------- Display a random user friendlist -----------------
// appSection.addEventListener("click", (e) => {
// 	e.preventDefault();

// 	// this if for correspondant user profile
// 	if (e.target.id === "eachUserfriendListBtn") {
// 		const correspondantId = localStorage.getItem("correspondantId");
// 		const userFriendsList = document.querySelector("#userFriendList");
// 		loadUserFriendsList(correspondantId, userFriendsList);
// 	} else if (e.target.id === "sendMessage") {
// 		chatBox.style.display = 'block';
// 	}
// });

// ----------------- connect to websocket -----------------
function connectWebSocket() {
	chatSocket = new WebSocket(wsUrl);

	chatSocket.onopen = () => {
		console.log('Connected to chat WebSocket');
		localStorage.setItem("wsConnected", "true");
	};

	chatSocket.onmessage = (e) => {
		console.log("message received");
		const data = JSON.parse(e.data);

		const currentUserId = localStorage.getItem('userId');
		const correspondantId = localStorage.getItem('correspondantId');
		
		// console.log('Data:', data);

		if (data.type === "online_status") {
			// console.log("type: online status");
			onlineUsers[data.user_id] = data;
			if (!data.is_online) {
				delete onlineUsers[data.user_id];
			}
			updateOnlineUsers();
		} else if (data.type === "user.status") {
			// console.log("type: user status");
			onlineUsers = data.online_users;
			updateOnlineUsers();
			console.log("online users: ", onlineUsers);
		} else if (data.type === "chat_request") {
			chatRoomId = data.chat_room_id;
			if (data.target_id === currentUserId) {
				localStorage.setItem("senderName", data.creator_username);
				localStorage.setItem("senderMessage", data.message);
				showIncomingMessagePopup(data.creator_id, data.creator_username, data.message, chatRoomId);
			}
		} else if (data.type === "chat_message") {
			const currentUserId = localStorage.getItem('userId');

			if (data.sender_id !== Number(data.receiver_id)) {
				displayMessageInChat(Number(currentUserId), data.sender, data.message)
				.then(() => console.log("Message displayed successfully!"))
				.catch(error => console.error("Error displaying message:", error));
			} else if (data.sender_id === Number(data.receiver_id)) {
				displayMessageInChat(Number(correspondantId), data.sender, data.message)
				.then(() => console.log("Message displayed successfully!"))
					.catch(error => console.error("Error displaying message:", error));
			}

			updateOnlineUsers();
		} else if (data.type === "game_invite_received") {
			const senderId = data.sender_id;
			const senderUsername = data.target_username;
			const targetUsername = data.sender_username;
			const message = data.message;
			const chatRoomId = data.chat_room_id;
			const correspondantName = localStorage.getItem("senderName");

			console.log("senderId: ", senderId);
			console.log("currentUserId: ", currentUserId);
			if (senderId !== currentUserId) {
				console.log("showing confirm game popup senderid !== currentUserId");
				showConfirmGamePopup(senderId, correspondantName, message, chatRoomId);
			}
		} else if (data.type === "game_invite_accepted") {
			const player1_id = data.sender_id;
			const player2_id = data.target_id;
			const message = data.message;
			const targetUsername = data.target_username;
			const senderUsername = data.sender_username;
			const correspondantName = localStorage.getItem("senderName");

			if (player1_id === currentUserId) {
				displayMessageInChat(player2_id, correspondantName, message)
					.then(() => console.log("Message displayed successfully!"))
					.catch(error => console.error("Error displaying message:", error));
				// startGame(player1_id, player2_id);
			}
		} else if (data.type === "game_invite_declined") {
			const player1_id = data.sender_id;
			const player2_id = data.target_id;
			const message = data.message;
			displayMessageInChat(player2_id, onlineUsers[player2_id].username, message, null, false, 'invite_declined')
				.then(() => console.log("Message displayed successfully!"))
				.catch(error => console.error("Error displaying message:", error));
		}
	};

	chatSocket.onerror = (e) => {
		console.error('WebSocket error:', e);
	};

	chatSocket.onclose = () => {
		console.log('WebSocket closed');
		chatSocket = null; // Clear reference to WebSocket
		localStorage.setItem("wsConnected", "false");
		if (localStorage.getItem("isAuthenticated")) {
			console.log("reconnecting to websocket user is authenticated");
			connectWebSocket();
		}
	};
}

// ----------------- Open Chatbox -----------------
chatIcon.addEventListener('click', () => {
	const senderMessage = localStorage.getItem("senderMessage");
	const senderName = localStorage.getItem("senderName");
	const correspondantId = localStorage.getItem("correspondantId");

	chatBox.style.display = 'block';


	if (notificationCount > 0) {
		decrementNotificationCount();
	}
	if (senderMessage) {
		displayMessageInChat(correspondantId, senderName, senderMessage)
			.then(() => console.log("Message displayed successfully!"))
			.catch(error => console.error("Error displaying message:", error));
		localStorage.removeItem("senderMessage");
	}
});

// ------------------ Close Chat ------------------
closeChat.addEventListener('click', () => {
	chatBox.style.display = 'none';

	const sendMsgBtn = document.querySelectorAll(".send-message-btn")
	sendMsgBtn.forEach((btn) => {
		btn.disabled = false;
	});
});


const eachUserfriendListBtn = document.querySelector("#eachUserfriendListBtn");

console.log("eachUserfriendListBtn: ", eachUserfriendListBtn);

if (eachUserfriendListBtn) {
	console.log("this exists !");
	eachUserfriendListBtn.addEventListener("click", async () => {
		console.log("eachUserfriendListBtn clicked !");
		const friendsList = await loadUserFriendsList(correspondantId);	
		const userFriendList = document.querySelector("#userFriendList");
		console.log("friendsList: ", friendsList);
		if (friendsList) {
			userFriendList.innerHTML = "";
			friendsList.forEach(friend => {
				console.log("friend: ", friend);
				const friendLi = document.createElement("li");
				friendLi.textContent = friend.username;
				userFriendList.appendChild(friendLi);
			});
		}
	});
}


// const updateOnlineUsers = () => {
// 	const userList = document.getElementById("userList");
// 	const userId = localStorage.getItem("userId");
// 	const username = localStorage.getItem("username");

// 	if (!userList) {
// 		return;
// 	}
// 	userList.innerHTML = "";
	
// 	let index = 0;
// 	let friendOrAdd = "";
// 	// const addBtn = `<button class="btn btn-outline-success add-user-btn">Add</button>`;
// 	// const friendBadge = `<span class="badge bg-primary">Friend</span>`;

// 	let friendsList = JSON.parse(localStorage.getItem("friendsList")) || [];
// 	console.log("friendsList: ", friendsList);
// 	if (!Array.isArray(friendsList)) {
// 		friendsList = [];
// 	}

// 	for (const user of Object.values(onlineUsers)) {
// 		if (user.user_id !== Number(userId) && user.username !== username) {
// 			console.log("users online found");
// 			console.log("user id ", user.user_id);
// 			const userTr = document.createElement("tr");

// 			if (friendsList.includes(user.user_id)) {
// 				friendOrAdd = `<span class="badge bg-light text-dark p-3">Friend</span>`;
// 			} else {
// 				friendOrAdd = `<button class="btn btn-outline-success add-user-btn">Add</button>`;
// 			}

// 			userTr.innerHTML = `
// 				<th scope="row">${index + 1}</th>
// 				<td>
// 					<a href="#" class="user-link" data-link>${user.username}</a>
// 				</td>
// 				<td>
// 					<button class="btn btn-primary send-message-btn" data-user-id="${user.user_id}" data-username="${user.username}">Message</button>
// 					${friendOrAdd}
// 				</td>
// 			`;

// 			userList.appendChild(userTr);
// 		} else {
// 			console.log("no users online");
// 		}
// 	}

// 	// Attach event listeners AFTER all elements are added
// 	document.querySelectorAll(".send-message-btn").forEach((btn) => {
// 		const userId = btn.getAttribute("data-user-id");
// 		const username = btn.getAttribute("data-username");
// 		onpenChatBoxToSend(btn, username, userId);
// 	});

// 	document.querySelectorAll(".add-user-btn").forEach((btn) => {
// 		btn.addEventListener("click", async () => {
// 			console.log("Add button clicked");
// 			const userId = user.user_id;
// 			console.log("userId: ", userId);
// 			await sendFriendRequest(userId);
// 		});
// 	}
// 	);
// };

const updateOnlineUsers = () => {
    const userList = document.getElementById("userList");
    const userId = localStorage.getItem("userId");
    const username = localStorage.getItem("username");

    if (!userList) {
        return;
    }

    // Clear the user list
    userList.innerHTML = "";

    let index = 0;
    let friendsList = JSON.parse(localStorage.getItem("friendsList")) || [];
    console.log("friendsList: ", friendsList);

    if (!Array.isArray(friendsList)) {
        friendsList = [];
    }

    // Loop through online users
    for (const user of Object.values(onlineUsers)) {
        if (user.user_id !== Number(userId) && user.username !== username) {
            console.log("users online found");
            console.log("user id ", user.user_id);

            // Create a new row for the user
            const userTr = document.createElement("tr");

            // Create table cells
            const th = document.createElement("th");
            th.setAttribute("scope", "row");
            th.textContent = index + 1;

            const tdUsername = document.createElement("td");
            const userLink = document.createElement("a");
            userLink.href = "#";
            userLink.classList.add("user-link");
            userLink.textContent = user.username;
            tdUsername.appendChild(userLink);

            const tdActions = document.createElement("td");
            const messageButton = document.createElement("button");
            messageButton.classList.add("btn", "btn-primary", "send-message-btn");
            messageButton.setAttribute("data-user-id", user.user_id);
            messageButton.setAttribute("data-username", user.username);
            messageButton.textContent = "Message";

            // Add event listener for the message button
            messageButton.addEventListener("click", () => {
                onpenChatBoxToSend(messageButton, user.username, user.user_id);
            });

            // Check if the user is a friend
            if (friendsList.includes(user.user_id)) {
                const friendBadge = document.createElement("span");
                friendBadge.classList.add("badge", "bg-light", "text-dark", "p-3");
                friendBadge.textContent = "Friend";
                tdActions.appendChild(friendBadge);
            } else {
                const addButton = document.createElement("button");
                addButton.classList.add("btn", "btn-outline-success", "add-user-btn");
                addButton.textContent = "Add";

                // Add event listener for the add button
                addButton.addEventListener("click", async () => {
                    console.log("Add button clicked");
                    console.log("userId: ", user.user_id);
                    await sendFriendRequest(user.user_id);
                });

                tdActions.appendChild(addButton);
            }

            tdActions.appendChild(messageButton);

            // Append cells to the row
            userTr.appendChild(th);
            userTr.appendChild(tdUsername);
            userTr.appendChild(tdActions);

            // Append the row to the user list
            userList.appendChild(userTr);

            index++;
        } else {
            console.log("no users online");
        }
    }
};

const sendFriendRequest = async (userId) => {
	console.log("sending friend request to: ", userId);
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
	} catch(error) {
		console.log("Error: ", error);
	}
};

// Send Message Event Listener
const onpenChatBoxToSend = (sendMessageBtn, userName, userId) => {
	const chatMessages = document.getElementById('chatMessages');
	const messageTo = document.querySelector("#messageTo");

	sendMessageBtn.addEventListener("click", (e) => {
		e.preventDefault();

		if (chatMessages !== null) {
			chatMessages.innerHTML = '';
		}
		chatBox.style.display = 'block';

		chatRoomId = null;
		messageTo.textContent = `# ${userName}`;

		sendMessageBtn.disabled = true;

		localStorage.setItem("chatRequest", "true");
		localStorage.setItem("correspondantId", userId);
	});
}

// Display Message in Chat
async function displayMessageInChat(senderId, sender, message) {
	const chatMessages = document.getElementById('chatMessages');
	const noMessage = document.getElementById('noMessages');
	const messageElement = document.createElement('div');
	const currentUserName = localStorage.getItem('username');

	if (noMessage !== null) {
		noMessage.innerHTML = '';
	}

	const date = new Date();
	const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
	let userPic = './assets/user.png';

	// Get online users
	const userProfile = await loadUserProfile(senderId);

	if (userProfile.profile_picture) {
		userPic = baseUrl + userProfile.profile_picture;
	} else {
		console.log("No user profile found.");
	}

	messageElement.classList.add('chat-message', 'd-flex', 'me-2');
	messageElement.style.borderBottom = '1px solid #344b5b';
	messageElement.innerHTML += `
		<img src=${userPic} alt="profile" class="chat-avatar">
		<div class="chat-content">
			<span class="chat-username">
				<a href="" class="user-link" id="userProfileLink" data-link>${sender}</a>
			</span>
			<span class="chat-timestamp">${time}</span>
			<p class="chat-text">${message}</p>
		</div>
	`;

	chatMessages.prepend(messageElement);
	chatMessages.scrollTop = chatMessages.scrollHeight;
	viewUserProfile(document.getElementById("userProfileLink"), sender, currentUserName);
}

function showIncomingMessagePopup(creatorId, creatorUsername, received_message, chatRoomId) {
	localStorage.setItem('correspondantId', creatorId);
	
	// Remove existing popup if it exists
	const existingPopup = document.querySelector('.incoming-message-popup');
	if (existingPopup) {
		existingPopup.remove();
	}

	// Create the popup container
	const popup = document.createElement('div');
	popup.classList.add('incoming-message-popup', 'alert', 'alert-dark', 'shadow-lg', 'fade', 'show');

	// Create the popup message
	const message = document.createElement('p');
	message.innerHTML = `<strong>${creatorUsername}</strong> sent you a message.`;

	// Create the "Reply" button
	const replyButton = document.createElement('button');
	replyButton.textContent = "Reply";
	replyButton.classList.add('btn', 'btn-success', 'btn-sm', 'me-2');

	// Event listener for reply
	replyButton.addEventListener('click', async () => {
		chatBox.style.display = 'block';
		localStorage.removeItem('senderMessage');
		localStorage.setItem('chatRequest', 'false');
		localStorage.setItem('chatRoomId', chatRoomId);

		const senderMessage = localStorage.getItem("senderMessage");
		if (senderMessage) {
			localStorage.removeItem("senderMessage");
		}
		await displayMessageInChat(creatorId, creatorUsername, received_message);
		popup.remove();
	});

	// Create a "Close" button
	const closeButton = document.createElement('button');
	closeButton.textContent = "Close";
	closeButton.classList.add('btn', 'btn-outline-secondary', 'btn-sm');

	// Event listener for closing the popup
	closeButton.addEventListener('click', () => {
		popup.remove();
	});

	setTimeout(() => {
		popup.remove();
	}, 4000);
	// Append elements to the popup
	popup.appendChild(message);
	popup.appendChild(replyButton);
	popup.appendChild(closeButton);

	// Append to body
	document.body.appendChild(popup);

	notifyUserIcon();
}

function showConfirmGamePopup(creatorId, creatorUsername, received_message, chatRoomId) {
	const chatMessages = document.getElementById('chatMessages');
	const currentUserId = localStorage.getItem('userId');
	const username = localStorage.getItem('username');
	// Remove existing popup if it exists
	const existingPopup = document.querySelector('.game-invitation-popup');
	if (existingPopup) {
		existingPopup.remove();
	}

	// Create the popup container
	const popup = document.createElement('div');
	popup.classList.add('game-invitation-message', 'alert', 'alert-primary', 'shadow-sm', 'fade', 'show', 'p-2', 'mb-2', 'rounded');

	// Create the popup message
	const message = document.createElement('p');
	message.innerHTML = `<strong>${creatorUsername}</strong> invited you to a game.`;

	// Create the "Accept" button
	const acceptButton = document.createElement('button');
	acceptButton.textContent = "Accept";
	acceptButton.classList.add('btn', 'btn-success', 'btn-sm', 'me-2');

	// Event listener for Accept
	acceptButton.addEventListener('click', async () => {
		console.log("Accept button clicked");
		acceptButton.disabled = true;
		declineButton.disabled = true;
		acceptButton.style.backgroundColor = '#5b636b';
		chatSocket.send(JSON.stringify({
			type: 'game_invite_accepted',
			chat_room_id: chatRoomId,
			target_id: creatorId,
			sender_id: currentUserId,
		}));

		popup.classList.remove('alert-primary');
		popup.classList.add('alert-success');
		acceptButton.remove();
		declineButton.remove();

		popup.appendChild(msg);
		chatMessages.prepend(popup);

		await displayMessageInChat(currentUserId, username, "Game invite accepted!");
	});

	// Create a "Decline" button
	const declineButton = document.createElement('button');
	declineButton.textContent = "Decline";
	declineButton.classList.add('btn', 'btn-outline-danger', 'btn-sm');

	// Event listener for Decline
	declineButton.addEventListener('click', async () => {
		console.log("Decline button clicked");
		acceptButton.disabled = true;
		declineButton.disabled = true;
		declineButton.style.backgroundColor = '#5b636b';
		chatSocket.send(JSON.stringify({
			type: 'game_invite_declined',
			chat_room_id: chatRoomId,
			target_id: creatorId,
			sender_id: localStorage.getItem('userId'),
		}));

		popup.classList.remove('alert-primary');
		popup.classList.add('alert-success');
		acceptButton.remove();
		declineButton.remove();

		popup.appendChild(msg);
		chatMessages.prepend(popup);

		await displayMessageInChat(currentUserId, username, "Game invite declined!");
	});

	// Append elements to the popup
	popup.appendChild(message);
	popup.appendChild(acceptButton);
	popup.appendChild(declineButton);

	// Append to body
	chatMessages.prepend(popup);
}

// Notification Icon
function notifyUserIcon() {
	notificationCount++;
	notificationNbr.style.background = '#ed2f2f';
	notificationNbr.style.border = '3px solid #1C3644;';
	notificationNbr.textContent = notificationCount;
}

// Decrement Notification Count
function decrementNotificationCount() {
	notificationCount--;

	notificationNbr.textContent = notificationCount;

	if (notificationCount === 0) {
		notificationNbr.style.background = 'none';
		notificationNbr.style.border = 'none';
		notificationNbr.textContent = '';
		return;
	}
}

// Send and invite to play game buttons event listeners
function collectMessageToSend() {
	const chatInput = document.getElementById('chatInput');
	const message = chatInput.value;
	
	return message;
}

// Click to send message
const chatSubmit = document.getElementById('chatForm');

chatSubmit.addEventListener('submit', (e) => {
	e.preventDefault();

	const message = collectMessageToSend();
	const chatRequest = localStorage.getItem('chatRequest');
	const correspondantId = localStorage.getItem('correspondantId');

	if (chatRequest === "true") {
		sendChatRequest(message);
	}
	if (chatSocket && chatSocket.readyState === WebSocket.OPEN) {
		sendMessageToSocket(message, correspondantId, chatRoomId);
	} else {
		console.error('WebSocket is not open');
	}
	chatInput.value = '';
});

// click to send game invite
const inviteToPlay = document.getElementById('inviteButton');

inviteToPlay.addEventListener('click', () => {
	const message = "Let's play a game!";

	sendGameInvite(message);
});

// Send Chat Request
const sendChatRequest = (message) => {
	const currentUserId = localStorage.getItem('userId');
	const correspondantId = localStorage.getItem('correspondantId');
	const username = localStorage.getItem('username');

	const data = {
		type: 'chat_request',
		target_id: correspondantId,
		message: message
	};

	chatSocket.send(JSON.stringify(data));
	localStorage.removeItem('chatRequest');
	displayMessageInChat(Number(currentUserId), username, message)
	.then(() => console.log("Message displayed successfully!"))
    .catch(error => console.error("Error displaying message:", error));
}

// send game invitation
function sendGameInvite(message) {
	const currentUserId = localStorage.getItem('userId');
	const correspondantId = localStorage.getItem('correspondantId');
	const username = localStorage.getItem('username');

	console.log("currentUserId: ", currentUserId);
	console.log("correspondantId: ", correspondantId);

	const data = {
		type: 'game_invite',
		target_id: correspondantId,
		sender_id: currentUserId,
		chat_room_id: chatRoomId
	};

	chatSocket.send(JSON.stringify(data));
	displayMessageInChat(Number(currentUserId), username, message)
		.then(() => console.log("Message displayed successfully!"))
		.catch(error => console.error("Error displaying message:", error));
}

function sendMessageToSocket(message, correspondantId, chatRoomId) {
	console.log("sending message to socket");
	const data = {
		type: 'chat_message',
		message: message,
		receiver_id: correspondantId,
		chat_room_id: chatRoomId
	};
	chatSocket.send(JSON.stringify(data));
}

let refreshTimer;

const startTokenRefreshTimer = async () => {
	const refreshInterval = 2 * 60 * 1000; // 2 minutes

	console.log('Starting token refresh timer for websocket');
	// Clear any existing interval before setting a new one
	if (refreshTimer) {
		clearInterval(refreshTimer);
	}

	refreshTimer = setInterval(() => {
		console.log("connecting to websocket");
		// Function to refresh the token (or make the request)
		if (localStorage.getItem("wsConnected") === "false") {
			console.log("user is logged in connecting to websocket");
			// connectWebSocket();
		} else {
			console.log("user is still connected to websocket");
		}
		console.log('Token refreshed');
	}, refreshInterval);
};

// If you need to stop the refresh timer at any point, you can call this:
const stopTokenRefreshTimer = () => {
	if (refreshTimer) {
		clearInterval(refreshTimer);
		console.log('Token refresh timer stopped');
	}
};

// function handleChatInputSubmit(chatInput, chatSubmit) {
	
// }
