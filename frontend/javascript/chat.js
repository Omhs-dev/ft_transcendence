import { appSection } from "./utils/domUtils.js";
import { sideNavSection } from "./utils/sideNavUtil.js";

const chatIcon = document.getElementById('chatIcon');
const chatBox = document.getElementById('chatBox');
const closeChat = document.getElementById('closeChat');
const chatInput = document.getElementById('chatInput');
const messageContainer = document.getElementById('messages');
const sendButton = document.getElementById('sendButton');

// let userId = null;
let chatSocket;
let chatRoom = null;
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
	};

	chatSocket.onmessage = (e) => {
		console.log("message received");
		const data = JSON.parse(e.data);

		const userId = localStorage.getItem('userId');
		// console.log('Data:', data);
		// console.log('userId:', userId);
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

			console.log("online users: ", onlineUsers);
		} else if (data.type === "chat_request") {
			console.log("type: chat_request");
			console.log("chat request data: ", data);
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