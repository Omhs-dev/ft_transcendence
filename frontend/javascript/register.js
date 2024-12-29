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

    try {
        const response = await fetch('http://localhost:8000/backend/api/register/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password }),
        });

        const data = await response.json();

        if (response.ok) {
            alert('User registered successfully!');
			usernameField.value = "";
			emailField.value = "";
			passwordField.value = "";
			confirmPasswordField.value = "";
        } else {
            alert('Error: ' + (data.error || JSON.stringify(data)));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Something went wrong. Please try again.');
    }
	console.log("Empty the forms !");
};

document.getElementById('registerForm').addEventListener('submit', (e) => {
	console.log("register button clicked !!!");
    e.preventDefault();
    registerUser();
});
