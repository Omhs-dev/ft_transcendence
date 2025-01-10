import { appSection } from "./utils/domUtils.js"
import { sideNavSection } from "./utils/sideNavUtil.js";

const logoutBtn = sideNavSection.querySelector(".logoutbtn");

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
        const response = await fetch('http://localhost:8000/backend/api/login/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
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

		localStorage.setItem("access_token", data.access_token);
		localStorage.setItem("refresh_token", data.refresh_token);

		window.location.href = "/";

		// alert("Login successful!");
		console.log("Login successful!");
    } catch (error) {
        console.error('Error:', error.message);
    }
};

// Logout functionality
const logoutUser = async () => {
	try {
		const refreshToken = localStorage.getItem('refresh_token');
		const accessToken = localStorage.getItem('access_token');

		const response = await fetch('http://localhost:8000/backend/api/logout/', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${accessToken}`,
			},
			body: JSON.stringify({ refresh_token: refreshToken }),
		});
		console.log("response: ", response);
		if (!response.ok) {
			console.log("can not fetch api !!!");
			throw new Error("could not fetch api...", response.statusText);
		}

		localStorage.removeItem("access_token");
		localStorage.removeItem("refresh_token");

		window.location.href = "/";

		console.log('User registered successfully!');
		// alert('You have been logged out.');
	} catch(error) {
		console.log(error.message);
	}
};

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
