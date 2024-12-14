console.log("this is the registration page");


document.getElementById('registerForm').addEventListener('submit', async function (event) {
	event.preventDefault(); // Prevent default form submission

	// Get form data
	const username = document.getElementById('username').value;
	const email = document.getElementById('email').value;
	const password = document.getElementById('password').value;

	try {
		// Send POST request to Django backend
		const response = await fetch('api/register/', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				username: username,
				email: email,
				password: password,
			}),
		});

		const data = await response.json();

		// Handle response
		if (response.ok) {
			alert('Registration Successful!');
			console.log(data);
		} else {
			alert('Registration Failed: ' + (data.error || 'Unknown error'));
			console.error(data);
		}
	} catch (error) {
		console.error('Error:', error);
		alert('Something went wrong. Please try again.');
	}
});