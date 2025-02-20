import { getCookie } from "../login.js";

export async function getOnlineUsers() {
	try {
		const response = await fetch(`http://localhost:8000/chat/api/online-users/`, {
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
		console.log("Online users: ", data);
		return data;
	} catch (error) {
		console.error("Error fetching online users: ", error);
	}
};
