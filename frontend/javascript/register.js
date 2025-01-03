import { appSection } from "./utils/domUtils.js"

console.log("this is the registration page");

const registerUser = async () => {
    const username = document.getElementById('registerUsername').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value.trim();
	const confirmPassword = document.getElementById('confirmPassword').value.trim();

	if (!username || !email || !password) {
		console.log("Username, email, or password is empty!");
		alert("Please fill out all required fields.");
		return;
	}
	console.log("password length: ", password.length)
	if (password.length < 8) {
		console.log("Password too short!");
		alert("Password must be at least 8 characters long.");
		return;
	}
	
	if (password !== confirmPassword) {
		console.log("Passwords do not match!");
		alert("Passwords do not match. Please confirm your password.");
		return;
	}	

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

		if (!response.ok) {
			let message = "Registration failed:\n";
		
			if (data.username) message += `- Username: ${data.username[0]}\n`;
			if (data.password) message += `- Password: ${data.password[0]}\n`;
			if (data.email) message += `- Email: ${data.email[0]}\n`;
		
			alert(message.trim());
			throw new Error(message.trim());
		}		
		
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
	if (e.target.id === "registerForm"
		&& e.target.className === "registerClass") {
		console.log("register button found !");
		registerUser();
		console.log("after login");
	} else {
		console.error("Not found !");
	}
});
