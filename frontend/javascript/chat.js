document.addEventListener('DOMContentLoaded', () => {
    const chatIcon = document.getElementById('chatIcon');
    const chatBox = document.getElementById('chatBox');
    const closeChat = document.getElementById('closeChat');
    const chatInput = document.getElementById('chatInput');
    const messageContainer = document.getElementById('messages');
    const sendButton = document.getElementById('sendButton');
    
    let chatSocket;
    const roomName = 'general';

    const protocol = 'wss://';
	const wsUrl = `${protocol}${window.location.hostname}/ws/chat/${roomName}/`;


    // Show or Hide Chatbox on Icon Click
    chatIcon.addEventListener('click', () => {
        chatBox.style.display = chatBox.style.display === 'none' ? 'block' : 'none';
        if (chatBox.style.display === 'block' && !chatSocket) {
            connectWebSocket();  // Connect to WebSocket when the chat box opens
        }
    });

    // Close Chatbox
    closeChat.addEventListener('click', () => {
        chatBox.style.display = 'none';
        if (chatSocket) {
            chatSocket.close();  // Close WebSocket when chat box is closed
        }
    });

    // Connect WebSocket
    function connectWebSocket() {
        chatSocket = new WebSocket(wsUrl);

        chatSocket.onopen = () => {
            console.log('Connected to chat WebSocket');
        };

        chatSocket.onmessage = (e) => {
            const data = JSON.parse(e.data);
            const messageElement = document.createElement('div');
            messageElement.textContent = `${data.username}: ${data.message}`;
            messageContainer.appendChild(messageElement);
        };

        chatSocket.onerror = (e) => {
            console.error('WebSocket error:', e);
        };

        chatSocket.onclose = () => {
            console.log('WebSocket closed');
            chatSocket = null; // Clear reference to WebSocket
        };
    }

    // Handle message sending
    sendButton.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    function sendMessage() {
        const message = chatInput.value.trim();
        if (message && chatSocket) {
            chatSocket.send(JSON.stringify({ message: message }));
            chatInput.value = '';
        }
    }
});
