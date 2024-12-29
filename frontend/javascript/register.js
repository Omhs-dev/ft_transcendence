import { appSection } from "./utils/domUtils.js"

let usernameField = document.getElementById('username');
let emailField = document.getElementById('email');
let passwordField = document.getElementById('password');
let confirmPasswordField = document.getElementById('confirmPassword');
console.log("this is the registration page");

const registerUser = async () => {
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
	const confirmPassword = document.getElementById('confirmPassword').value;

	console.log("username: ", username);
	console.log("email: ", email);
	console.log("password: ", password);

    try {
        const response = await fetch('http://localhost:8000/backend/api/register/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password }),
        });

		console.log("username: ", username);
		console.log("email: ", email);
		console.log("password: ", password);

        const data = await response.json();

        // if (!response.ok) {
		// 	alert('Error: ' + (data.error || JSON.stringify(data)));
		// 	throw new Error(`error fetching api: ${response.statusText}`);
        // }

		alert('User registered successfully!');
    } catch (error) {
        console.error('Error:', error);
        alert('Something went wrong. Please try again.');
    }
	console.log("Empty the forms !");
};

appSection.addEventListener('submit', (e) => {
	console.log("submit button clicked");
    e.preventDefault();
	console.log(e);
	if (e.target.id === "registerForm") {
		console.log("register button found !");
		registerUser();
		console.log("after login");
	} else {
		console.error("Not found !");
	}
});
