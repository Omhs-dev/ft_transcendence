import { appSection } from "./utils/domUtils.js";
import { sideNavSection } from "./utils/sideNavUtil.js";

const chatIcon = document.getElementById('chatIcon');
const chatBox = document.getElementById('chatBox');
const closeChat = document.getElementById('closeChat');
// const chatInput = document.getElementById('chatInput');
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
		// console.log("loaded connecting to websocket");
		connectWebSocket();
		updateOnlineUsers();
	}
});

window.addEventListener('load', () => {
	const userId = localStorage.getItem('userId');
	const username = localStorage.getItem('username');
	// console.log("userId: ", userId);

	if (userId && username
		&& localStorage.getItem("wsConnected") === "true") {
		// console.log("user is logged in connecting to websocket");
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
		// console.log('userId:', currentUserId);
		// console.log("online status", data.type);

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
				showIncomingMessagePopup(data.creator_id, data.creator_username, data.message, chatRoomId);
			}
		} else if (data.type === "chat_message") {
			displayMessageInChat(data.sender_id, data.sender, data.message);
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
			seendMsgEventListenner(sendMessageBtn, user.username, user.user_id);
		} else {
			console.log("no users online");
		}
	}
};

const seendMsgEventListenner = (sendMessageBtn, userName, userId) => {
	sendMessageBtn.addEventListener("click", (e) => {
		e.preventDefault();
		chatBox.style.display = 'block';

		const messageTo = document.querySelector("#messageTo");
		// console.log("message to: ", messageTo);
		messageTo.textContent = `# ${userName}`;

		localStorage.setItem("chatRequest", "true");
		localStorage.setItem("receiverId", userId);
	});
}

function displayMessageInChat(senderId, sender, message) {
	const chatMessages = document.getElementById('chatMessages');
	const noMessage = document.getElementById('noMessages');
	const messageElement = document.createElement('div');

	noMessage.innerHTML = '';

	messageElement.classList.add('chat-message', 'd-flex', 'me-2');
	messageElement.style.borderBottom = '1px solid #344b5b';
	messageElement.innerHTML += `
		<img src="./assets/user.png" alt="Helio" class="chat-avatar">
		<div class="chat-content">
			<span class="chat-username">${sender}</span>
			<span class="chat-timestamp">Today at 2:39 PM</span>
			<p class="chat-text">${message}</p>
		</div>
	`;

	chatMessages.prepend(messageElement);
	chatMessages.scrollTop = chatMessages.scrollHeight;
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
	notificationNbr.textContent = notificationCount;
	
	if (notificationCount === 0) {
		notificationNbr.style.background = 'none';
		notificationNbr.style.border = 'none';
		notificationNbr.textContent = '';
		return;
	}
	notificationCount--;
}

	function collectMessageToSend() {
		const chatInput = document.getElementById('chatInput');
		const message = chatInput.value;

		return message;
	}

	const chatSubmit = document.getElementById('chatForm');

	chatSubmit.addEventListener('submit', (e) => {
		e.preventDefault();

		const message = collectMessageToSend();
		const chatRequest = localStorage.getItem('chatRequest');
		const receiverId = localStorage.getItem('receiverId');

		if (chatRequest === "true") {
			sendChatRequest(message);
		}
		if (chatSocket && chatSocket.readyState === WebSocket.OPEN) {
			console.log('Sending message:', message);
			// sendMessageToSocket(message, "1", chatRoomId);
		} else {
			console.error('WebSocket is not open');
		}
		chatInput.value = '';
	});

// Send Chat Request
const sendChatRequest = (message) => {
	const currentUserId = localStorage.getItem('userId');
	const receiverId = localStorage.getItem('receiverId');
	const username = localStorage.getItem('username');

	const data = {
		type: 'chat_request',
		target_id: receiverId,
		message: message
	};

	chatSocket.send(JSON.stringify(data));
	localStorage.removeItem('chatRequest');
	localStorage.removeItem('receiverId');
	displayMessageInChat(Number(currentUserId), username, message);
}

function sendMessageToSocket(message, receiverId, receiverName, chatRoomId) {
	console.log("sending message to socket");
	console.log("name of receiver: ", receiverName);
	const username = localStorage.getItem('username');
	const currentUserId = localStorage.getItem('userId');

	let data = {};

	data = {
		type: 'chat_message',
		message: message,
		receiver_id: receiverId,
		chat_room_id: chatRoomId
	};
	chatSocket.send(JSON.stringify(data));
}

// function handleChatInputSubmit(chatInput, chatSubmit) {
	
// }