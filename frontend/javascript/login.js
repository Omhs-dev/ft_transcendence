console.log("this is the login page");
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
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('http://localhost:8000/api/token/', {
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

            // Decode the access token to check if the user is an admin
            const decodedToken = parseJwt(data.access);
            if (decodedToken.is_admin) {
				alert('The type of this user is admin!!!!');
            }
            // Redirect to the home/dashboard page
            window.location.href = '../index1.html';
        } else {
            alert('Error: ' + (data.detail || 'Invalid credentials.'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Something went wrong. Please try again.');
    }
};


// // Login functionality
// const loginUser = async () => {
//     const username = document.getElementById('username').value;
//     const password = document.getElementById('password').value;

//     try {
//         const response = await fetch('http://localhost:8000/api/token/', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//             body: JSON.stringify({ username, password }),
//         });

//         const data = await response.json();

// 		console.log("before response");
		
//         if (response.ok) {
//             // Save tokens in localStorage
//             localStorage.setItem('access_token', data.access);
//             localStorage.setItem('refresh_token', data.refresh);

//             alert('Login successful!');
//             console.log('Access Token:', data.access);
//             console.log('Refresh Token:', data.refresh);

// 			usernameField.value = "";
// 			passwordField.value = "";
//             // Optionally redirect to another page after login
//             window.location.href = '../index1.html'; // Change to your home/dashboard page
//         } else {
//             alert('Error: ' + (data.detail || 'Invalid credentials.'));
//         }
// 		console.log("after response");
// 		usernameField.value = "";
// 		passwordField.value = "";
//     } catch (error) {
//         console.error('Error:', error);
//         alert('Something went wrong. Please try again.');
//     }
// };

// Add event listener to the login form
document.getElementById('loginForm').addEventListener('submit', (e) => {
	console.log("submit button clicked");
	
    e.preventDefault(); // Prevent form submission
    loginUser();
});
