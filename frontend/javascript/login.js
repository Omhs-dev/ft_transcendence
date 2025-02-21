import { appSection } from "./utils/domUtils.js"
import { sideNavSection } from "./utils/sideNavUtil.js";

let refreshTimer;

// Add event listener to the login form
appSection.addEventListener('submit', (e) => {
    e.preventDefault();
	console.log(e);
	if (e.target.id === "loginForm"
		&& e.target.className === "loginClass") {
		console.log("login button found !");
		loginUser();
	} else if (e.target.id === "42Login"
		&& e.target.className === "btn-42") {
		console.log("login button found !");
	}
});

appSection.addEventListener('click', (e) => {
	if (e.target.id === "42Login") {
		console.log("login with 42 button found !");
		loginWith42();
		// loadToMainPage();
		console.log("after redirect 2");
	}
});

const loginWith42 = () => {
	console.log("login with 42 button found !");
	localStorage.setItem("isOauthLogged", "true");
	localStorage.setItem("loadPageOnce", "true");
	window.location.href = "http://localhost:8000/auth/api/42/login";
}

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const loadToMainPage = async () => {
	await wait(600);
	// console.log("after countdown");
	window.location.href = "/";
}

const checkOauth2Login = async () => {
	try {
		const response = await fetch('http://localhost:8000/auth/api/profile', {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRFToken': getCookie('csrftoken'),
			},
			credentials: 'include',
		});

		if (!response.ok) {
			console.error('Could not fetch api', response.status);
			throw new Error('Could not fetch api');
		}

		const data = await response.json();
		// console.log('Data:', data);

		localStorage.setItem("userId", data.id);
		localStorage.setItem("username", data.username);
		localStorage.setItem("isAuthenticated", "true");

		// window.location.href = "/";

	} catch (error) {
		console.error('Error:', error.message);
	}
}

sideNavSection.addEventListener("click", (e) => {
    e.preventDefault();

    if (e.target.classList.contains("logoutbtn")) {
        console.log("we hit the logout button");
        logoutUser();
    }
});

document.addEventListener('DOMContentLoaded', () => {
	const username = localStorage.getItem("username");
	const enable2Fa = localStorage.getItem("enable2Fa");
	const isOauthLogged = localStorage.getItem("isOauthLogged");
	const isAuthenticated = localStorage.getItem("isAuthenticated");
	const loadPageOnce = localStorage.getItem("loadPageOnce");

	if (isOauthLogged) {
		// console.log("user is logged in with oauth");
		checkOauth2Login();
	}

	if (loadPageOnce) {
		// console.log("load page once");
		loadToMainPage();
		localStorage.removeItem("loadPageOnce");
	}
	
	if ((isAuthenticated || isOauthLogged) && username) {
		startTokenRefreshTimer();
	}
});

// Login functionality
const loginUser = async () => {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
	const otpCode = document.getElementById("otpCode").value.trim();
	const otpLabel = document.getElementById("otpLabel");
	const loginBtn = document.querySelector('.btn-login');
	const twoFaDiv = document.getElementById("twoFaDiv");
	const twoFaMethod = localStorage.getItem("twoFaMethod");

	const playload = { username, password };
	if (twoFaMethod) {
		console.log("2fa is enabled");
		playload.method = twoFaMethod;
		playload.otp_code = otpCode;
	}

    try {
        const response = await fetch('http://localhost:8000/auth/api/login/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(playload),
			credentials: 'include',
        });

        const data = await response.json();

		if (response.status === 401 && data.error === "Invalid username or password") {
			console.log("error here: ", data.error);
			invalidCredential("logins");
		}
		if (response.status === 401 && data.message === "2FA verification required. A new code has been sent.") {
			console.log("2fa is required");
			twoFaDiv.style.display = "block";
			if (data.method === "totp") {
				otpLabel.textContent = `A new code has been generated by ${data.method}`;
			} else {
				otpLabel.textContent = `A new code has been sent by ${data.method}`;
			}
			localStorage.setItem("enable2Fa", "true");
			localStorage.setItem("twoFaMethod", data.method);
			return;
		}
		if (response.status === 401 && data.error === "Invalid OTP code.") {
			setTimeout(() => {
				invalidCredential("otp");
			}, 3000);

			console.log("invalid otp code");
		}
        if (!response.ok) {
			throw new Error(`Could not fetch api ${response.status}`);
		}

		loginBtn.disabled = true;

		localStorage.removeItem("twoFaMethod");
		localStorage.setItem("username", username);
		localStorage.setItem("userId", data.user_id);
		localStorage.setItem("isAuthenticated", "true");

		window.location.href = "/";

		// alert("Login successful!");
		console.log("Login successful!");
    } catch (error) {
        console.error('Error:', error.message);
    }
};

// verify 2fa


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

		if (!response.ok) {
			console.log("can not fetch api !!!");
			throw new Error("could not fetch api...", response.statusText);
		}

		localStorage.removeItem("userId");
		localStorage.removeItem("senderId");
		localStorage.removeItem("username");
		localStorage.removeItem("isOauthLogged");
		localStorage.removeItem("isAuthenticated");

		window.location.href = "/";

		console.log('User registered successfully!');
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

const renewToken = async () => {
	const apiUrl = 'http://localhost:8000/auth/api/renew-access/';

	try {
		const response = await fetch(apiUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRFToken': getCookie('csrftoken'),
			},
			credentials: 'include',
		});

		if (!response.ok) {
			logoutUser();
			console.log("User logged out due to token refresh failure");
			throw new Error('Token refresh failed');
		}

		const data = response.json();

		console.log('Token refreshed successfully');
	} catch (error) {
		console.log('Error:', error.message);
	}
};

const startTokenRefreshTimer = async () => {
	const refreshInterval = 2 * 60 * 1000; 

	console.log('Starting token refresh timer');
	refreshTimer = setInterval(() => {
		renewToken();
		console.log('Token refreshed');
	}, refreshInterval);
}

export function getCookie(name) {
	let cookieValue = null;
	if (document.cookie && document.cookie !== '') {
		const cookies = document.cookie.split(';');
		for (let i = 0; i < cookies.length; i++) {
			const cookie = cookies[i].trim();
			// console.log("cookie: ", cookie);
			if (cookie.substring(0, name.length + 1) === (name + '=')) {
				cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
				break;
			}
		}
	}
	return cookieValue;
}

function invalidCredential(errorType) {
	const loginBtn = document.querySelector('.btn-login');
	const inputs = document.querySelectorAll(".form-control");
	const errorBox = document.querySelector("#errorBox");

	errorBox.innerHTML = "";

	const errorMessage = document.createElement("p");
	const small = document.createElement("small");

	inputs.forEach(input => input.classList.add('shake'));

	if (errorType === "logins") {
		small.textContent = "Username or password is incorrect. Please try again.";
	} else if (errorType === "otp") {
		small.textContent = "Invalid OTP code. Please try again.";
	}

	errorMessage.classList.add('text-danger', 'fw-light', 'text-center');
	errorMessage.appendChild(small);
	errorBox.appendChild(errorMessage);

	setTimeout(() => {
		loginBtn.disabled = false;
		
		inputs.forEach(input => {
			input.classList.remove('shake');
		});

		errorBox.innerHTML = "";
	}, 3000);
}
