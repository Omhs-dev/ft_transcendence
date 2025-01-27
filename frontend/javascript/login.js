import { appSection } from "./utils/domUtils.js"
import { sideNavSection } from "./utils/sideNavUtil.js";

let refreshTimer;

// Add event listener to the login form
appSection.addEventListener('submit', (e) => {
	console.log("submit button clicked");
    e.preventDefault();
	console.log(e);
	if (e.target.id === "loginForm"
		&& e.target.className === "loginClass") {
		console.log("login button found !");
		loginUser();
	}
});

sideNavSection.addEventListener("click", (e) => {
    e.preventDefault();
    
    if (e.target.classList.contains("logoutbtn")) {
        console.log("we hit the logout button");
        logoutUser();
    } else {
        console.log("not found");
		return;
    }
});

// Login functionality
const loginUser = async () => {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
	const loginBtn = document.querySelector('.btn-login');

	console.log("login button: ", loginBtn);
    try {
        const response = await fetch('http://localhost:8000/auth/api/login/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
			credentials: 'include',
        });

        const data = await response.json();
		console.log(data);

		loginBtn.disabled = true;
		// implement logic to check user credentials
		// check if token is valid
		if (response.status === 401) {
			console.log("error: ", data.error);
			invalidCredential();
		}
        if (!response.ok) {
			throw new Error("Login failed with : ", response.status);
		}
		console.log("data: ", data);
		localStorage.setItem("username", username);
		localStorage.setItem("isAuthenticated", "true");
		console.log("username: ", username);

		window.location.href = "/";

		// alert("Login successful!");
		console.log("Login successful!");
    } catch (error) {
        console.error('Error:', error.message);
    }
};

// Logout functionality
const logoutUser = async () => {
	stopTokenRefreshTimer();
	try {
		const response = await fetch('http://localhost:8000/auth/api/logout/', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRFToken': getCookie('csrftoken'),
			},
			credentials: 'include',
		});
		console.log("response: ", response);
		if (!response.ok) {
			console.log("can not fetch api !!!");
			throw new Error("could not fetch api...", response.statusText);
		}

		localStorage.removeItem("username");
		localStorage.removeItem("isAuthenticated");

		window.location.href = "/";

		console.log('User registered successfully!');
		// alert('You have been logged out.');
	} catch(error) {
		console.log(error.message);
	}
};

function stopTokenRefreshTimer() {
	if (refreshTimer) {
		clearInterval(refreshTimer);
		console.log('Token refresh timer stopped');
	}
}

function startTokenRefreshTimer() {
	const refreshInterval = 4 * 60 * 1000; // 1 minute in milliseconds

	console.log('Starting token refresh timer');
	refreshTimer = setInterval(() => {
		// Use absolute path to avoid relative path issues
		const apiUrl = '/auth/api/renew-access/';
		console.log(`API URL being called: ${apiUrl}`);

		fetch(apiUrl, {
			method: 'POST',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRFToken': getCookie('csrftoken'), // Include the CSRF token in the header
			},
		})
		.then(response => {
			if (response.ok) {
				console.log('Token refreshed successfully');
			} else {
				console.error('Failed to refresh token. Logging out.');
				logoutUser(); // Call the logout logic
			}
		})
		.catch(error => {
			console.error('Error refreshing token:', error);
		});
	}, refreshInterval);
}

export function getCookie(name) {
	let cookieValue = null;
	if (document.cookie && document.cookie !== '') {
		const cookies = document.cookie.split(';');
		for (let i = 0; i < cookies.length; i++) {
			const cookie = cookies[i].trim();
			console.log("cookie: ", cookie);
			// Does this cookie string begin with the name we want?
			if (cookie.substring(0, name.length + 1) === (name + '=')) {
				cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
				break;
			}
		}
	}
	return cookieValue;
}

function invalidCredential() {
	// Shake the login form
	const loginBtn = document.querySelector('.btn-login');
	const inputs = document.querySelectorAll(".form-control");
	// Display error message
	const errorBox = document.querySelector("#errorBox");
	const errorMessage = document.createElement("p");
	const small = document.createElement("small");

	inputs.forEach(input => {
		input.classList.add('shake');
	});

	small.textContent = "Username or password is incorrect. Please try again.";

	errorMessage.classList.add('text-danger', 'fw-light', 'text-center');
	errorMessage.appendChild(small);
	errorBox.appendChild(errorMessage);

	setInterval(() => {
		loginBtn.disabled = false;
		
		inputs.forEach(input => {
			input.classList.remove('shake');
		});

		errorBox.innerHTML = "";
	}, 3000);
}
