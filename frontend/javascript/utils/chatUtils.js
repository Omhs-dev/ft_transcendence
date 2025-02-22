import { getCookie } from "../login.js";

export async function loadUserProfile(userId) {
	try {
		const response = await fetch(`http://localhost:8000/auth/api/profile/?id=${userId}`, {
			method: 'GET',
			headers: {
				'X-CSRFToken': getCookie('csrftoken'),
				'Content-Type': 'application/json',
			},
			credentials: 'include',
		});

		if (!response.ok) {
			throw new Error(`Error fetching API: ${response.status} - ${response.statusText}`);
		}

		const data = await response.json();
		console.log("Data: ", data);
		return data;
	} catch (error) {
		console.error("Error fetching online users: ", error);
	}
};
