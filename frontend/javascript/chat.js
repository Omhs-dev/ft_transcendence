// const chatIcon = document.getElementById('chatIcon');
// const chatBox = document.getElementById('chatBox');
// const closeChat = document.getElementById('closeChat');
// const chatInput = document.getElementById('chatInput');

// // Show Chatbox on Icon Click
// chatIcon.addEventListener('click', () => {
// 	console.log("chatIcon clicked");
// 	chatBox.style.display = chatBox.style.display === 'none' ? 'block' : 'none';
// });

// // Close Chatbox
// closeChat.addEventListener('click', () => {
// 	chatBox.style.display = 'none';
// });

// const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
// const roomName = 'general';
// const wsUrl = `${protocol}${window.location.hostname}:8000/ws/chat/${roomName}/`;

// // Create WebSocket connection
// const chatSocket = new WebSocket(wsUrl);

// // Listen for WebSocket connection events
// chatSocket.onopen = function () {
// 	console.log('Connected to chat WebSocket');
// };

// // Display received messages
// chatSocket.onmessage = function (e) {
// 	const data = JSON.parse(e.data);
// 	const messageElement = document.createElement('div');
// 	messageElement.textContent = `${data.username}: ${data.message}`;
// 	document.getElementById('messages').appendChild(messageElement);
// };

// // Handle WebSocket errors
// chatSocket.onerror = function (e) {
// 	console.error('WebSocket error:', e);
// };

// // Close WebSocket
// chatSocket.onclose = function () {
// 	console.log('WebSocket closed');
// };

// // Handle message sending
// document.getElementById('sendButton').onclick = function () {
// 	const inputElement = document.getElementById('chatInput');
// 	const message = inputElement.value.trim();

// 	if (message) {
// 		chatSocket.send(JSON.stringify({
// 			message: message
// 		}));
// 		inputElement.value = '';
// 	}
// };