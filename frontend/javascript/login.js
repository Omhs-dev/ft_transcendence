import { appSection } from "./utils/domUtils.js"

console.log("this is the login page");

// console.log("appsection: ", appSection);

let usernameField = document.getElementById('username');
let passwordField = document.getElementById('password');

// Function to decode JWT token
function parseJwt(token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
}

// Login functionality
const loginUser = async () => {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    try {
        const response = await fetch('http://localhost:8000/backend/api/login/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (response.ok) {
            // Save tokens in localStorage
            localStorage.setItem('access_token', data.access);
            localStorage.setItem('refresh_token', data.refresh);

            alert('Login successful!');
            console.log('Access Token:', data.access);
            console.log('Refresh Token:', data.refresh);

            // Redirect to the home/dashboard page
            // window.location.href = '../index1.html';
        } else {
            alert('Error: ' + (data.detail || 'Invalid credentials.'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Something went wrong. Please try again.');
    }
};

function one() {
	console.log("this is a test function \n");
}

// Add event listener to the login form
appSection.addEventListener('submit', (e) => {
	console.log("submit button clicked");
    e.preventDefault();
	console.log(e);
	if (e.target.id === "loginForm"
		&& e.target.className === "loginClass") {
		console.log("login button found !");
		one();
		loginUser();
		console.log("after login");
	} else {
		console.log("Not found !");
	}
});
