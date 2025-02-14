import { appSection } from "./utils/domUtils.js";
import { sideNavSection } from "./utils/sideNavUtil.js";

const chatIcon = document.getElementById('chatIcon');
const chatBox = document.getElementById('chatBox');
const closeChat = document.getElementById('closeChat');
const chatInput = document.getElementById('chatInput');
const messageContainer = document.getElementById('messages');
const sendButton = document.getElementById('sendButton');

let userId = null;
let chatSocket;
let onlineUsers = {};
const roomName = 'general';

const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const wsUrl = `${protocol}${window.location.hostname}:8000/ws/chat/`;

document.addEventListener('DOMContentLoaded', () => {
	connectWebSocket();
});

sideNavSection.addEventListener("click", (e) => {
	e.preventDefault();

	if (e.target.classList.contains("users")) {
		console.log("users online found");
		updateOnlineUsers();
	}
});

// Connect WebSocket
function connectWebSocket() {
	chatSocket = new WebSocket(`ws://${window.location.host}:8000/ws/chat/`);

	chatSocket.onopen = () => {
		console.log('Connected to chat WebSocket');
	};

	chatSocket.onmessage = (e) => {
		console.log("message received");
		const data = JSON.parse(e.data);
		
		console.log('Data:', data);
		// const messageElement = document.createElement('div');
		// messageElement.innerText = `${data.username}: ${data.message}`;
		// messageContainer.appendChild(messageElement);
		console.log("online status", data.type);

		if (data.type === 'online_status') {
			console.log("online status");
			onlineUsers[data.user_id] = data;
			console.log("online users: ", onlineUsers);
			updateOnlineUsers(Object.values(onlineUsers));
		}
	};

	chatSocket.onerror = (e) => {
		console.error('WebSocket error:', e);
	};
	
	chatSocket.onclose = () => {
		console.log('WebSocket closed');
		chatSocket = null; // Clear reference to WebSocket
	};
}

// Show or Hide Chatbox on Icon Click
chatIcon.addEventListener('click', () => {
	chatBox.style.display = chatBox.style.display === 'none' ? 'block' : 'none';
});

// Close Chatbox
closeChat.addEventListener('click', () => {
	chatBox.style.display = 'none';
});

const updateOnlineUsers = (onlineUsers) => {
	const userList = appSection.getElementById("userList");
	console.log("user list: ", userList);

	userList.innerHTML = "";

	onlineUsers.forEach((user, index) => {
		const userElement = document.createElement("div");
        userElement.innerHTML = `
            <tr>
				<th scope="row">${index + 1}</th>
				<td>${user.username}</td>
				<td>
					<button class="btn btn-primary">Message</button>
					<button class="btn btn-outline-success">add</button>
				</td>
			</tr>
        `;

        userList.appendChild(userElement);
	});
};