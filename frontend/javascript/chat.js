import { appSection } from "./utils/domUtils.js";
import { sideNavSection } from "./utils/sideNavUtil.js";

const chatIcon = document.getElementById('chatIcon');
const chatBox = document.getElementById('chatBox');
const closeChat = document.getElementById('closeChat');
const chatInput = document.getElementById('chatInput');
const messageContainer = document.getElementById('messages');
const sendButton = document.getElementById('sendButton');
const notificationNbr = document.getElementById('notificationNbr');

// let userId = null;
let chatSocket;
let chatRoomId = null;
let onlineUsers = {};
let notificationCount = 0;

const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const wsUrl = `${protocol}${window.location.hostname}:8000/ws/chat/`;

document.addEventListener('DOMContentLoaded', () => {
	const userId = localStorage.getItem('userId');
	const username = localStorage.getItem('username');
	console.log("userId: ", userId);

	if (userId && username) {
		console.log("loaded connecting to websocket");
		connectWebSocket();
		updateOnlineUsers();
	}
});

window.addEventListener('load', () => {
	const userId = localStorage.getItem('userId');
	const username = localStorage.getItem('username');
	console.log("userId: ", userId);

	if (userId && username
		&& localStorage.getItem("wsConnected") === "true") {
		console.log("user is logged in connecting to websocket");
		connectWebSocket();
		updateOnlineUsers();
	}
});

sideNavSection.addEventListener("click", (e) => {
	e.preventDefault();

	if (e.target.classList.contains("users")) {
		setTimeout(() => {
			updateOnlineUsers();
		}, 100);
	}
});

// Connect WebSocket
function connectWebSocket() {
	chatSocket = new WebSocket(`ws://${window.location.host}:8000/ws/chat/`);

	chatSocket.onopen = () => {
		console.log('Connected to chat WebSocket');
		localStorage.setItem("wsConnected", "true");
	};

	chatSocket.onmessage = (e) => {
		console.log("message received");
		const data = JSON.parse(e.data);

		const currentUserId = localStorage.getItem('userId');
		// console.log('Data:', data);
		console.log('userId:', currentUserId);
		// console.log("online status", data.type);

		if (data.type === "online_status") {
			console.log("type: online status");
			onlineUsers[data.user_id] = data;
			if (!data.is_online) {
				delete onlineUsers[data.user_id];
			}
			updateOnlineUsers();
		} else if (data.type === "user.status") {
			console.log("type: user status");
			onlineUsers = data.online_users;
			updateOnlineUsers();
			console.log("online users: ", onlineUsers);
		} else if (data.type === "chat_request") {
			chatRoomId = data.chat_room_id;
			console.log("type: chat_request");
			console.log("chat request data: ", data);
			if (data.creator_id === Number(currentUserId)) {
				console.log("sening message to: ", data.receiver_id);
				// startChat(data.receiver_id, data.receiver_username, chatRoomId);
			}
			if (data.target_id === currentUserId) {
				showIncomingMessagePopup(data.creator_id, data.creator_username, data.message, chatRoomId);
			}
		}
	};

	chatSocket.onerror = (e) => {
		console.error('WebSocket error:', e);
	};
	
	chatSocket.onclose = () => {
		console.log('WebSocket closed');
		chatSocket = null; // Clear reference to WebSocket
		localStorage.removeItem("wsConnected"); // Remove flag on disconnect
	};
}

// Show or Hide Chatbox on Icon Click
chatIcon.addEventListener('click', () => {
	chatBox.style.display = chatBox.style.display === 'none' ? 'block' : 'none';
	decrementNotificationCount();
});

// Close Chatbox
closeChat.addEventListener('click', () => {
	chatBox.style.display = 'none';
});

const updateOnlineUsers = () => {
	const userList = document.getElementById("userList");
	const userId = localStorage.getItem("userId");
	const username = localStorage.getItem("username");
	console.log("online user list: ", onlineUsers);
	// console.log("user id: ", Number(userId));

	if (!userList) {
		console.log("user list not found");
		return;
	}
	userList.innerHTML = "";
	
	let index = 0;

	console.log("before for loop");
	for (const user of Object.values(onlineUsers)) {
		if (user.user_id !== Number(userId) && user.username !== username) {
			console.log("users online found");
			const userTr = document.createElement("tr");
			userTr.innerHTML = `
				<th scope="row">${index + 1}</th>
				<td>
					<a href="" class="user-link" id="userLink"  data-link>${user.username}</a>
				</td>
				<td>
					<button class="btn btn-primary" id="sendMessage">Message</button>
					<button class="btn btn-outline-success" id="addUser">add</button>
				</td>
			`;

			userList.appendChild(userTr);

			const sendMessageBtn = document.querySelector("#sendMessage");
			seendMsgEventListenner(sendMessageBtn, user.username);
		} else {
			console.log("no users online");
		}
	}
};

const seendMsgEventListenner = (sendMessageBtn, userName) => {
	sendMessageBtn.addEventListener("click", (e) => {
		e.preventDefault();
		chatBox.style.display = 'block';

		const messageTo = document.querySelector("#messageTo");
		console.log("message to: ", messageTo);
		messageTo.textContent = `# ${userName}`;
	});
}

function showIncomingMessagePopup(creatorId, creatorUsername, received_message, chatRoomId) {
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
	replyButton.addEventListener('click', () => {
		startChat(creatorId, creatorUsername, chatRoomId);
		displayMessageInChat(creatorId, creatorUsername, received_message);
		popup.remove(); // Remove the popup after clicking reply
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

function notifyUserIcon() {
	notificationCount++;
	notificationNbr.style.background = '#ed2f2f';
	notificationNbr.style.border = '3px solid #1C3644;';
	notificationNbr.textContent = notificationCount;
}

function decrementNotificationCount() {
	notificationCount--;
	notificationNbr.textContent = notificationCount;

	if (notificationCount === 0) {
		notificationNbr.style.background = 'none';
		notificationNbr.style.border = 'none';
		notificationNbr.textContent = '';
	}
}

function startChat(receiverId, receiverUsername, chatRoomId) {
	const chatArea = document.getElementById('chatArea');
	const chatWith = document.getElementById('chatWith');
	const chatMessages = document.getElementById('chatMessages');

	chatArea.style.display = 'block';
	chatWith.textContent = `Chat with: ${receiverUsername}`;
	chatArea.dataset.userId = receiverId;
	chatMessages.innerHTML = ''; // Clear previous messages

	console.debug("chatRoomId in startChat: ", chatRoomId);
	if (!chatRoomId)
		chatRoomId = globalChatRoomId;

	document.getElementById('sendMessage').onclick = () => sendMessage(receiverId, receiverUsername, globalChatRoomId);
}
