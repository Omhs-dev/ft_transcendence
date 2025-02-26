import { appSection } from "./utils/domUtils.js"
import { backToREgister} from "./utils/generalUtils.js";

const baseUrl = window.location.origin;

appSection.addEventListener('submit', (e) => {
	console.log("submit button clicked");
    e.preventDefault();
	if (e.target.id === "registerForm"
		&& e.target.className === "registerClass") {
		console.log("register button found !");
		registerUser();
		console.log("after login");
	} else {
		console.error("Not found !");
	}
});

const registerUser = async () => {
	const username = document.getElementById('registerUsername').value.trim();
	const email = document.getElementById('registerEmail').value.trim();
	const password = document.getElementById('registerPassword').value.trim();
	const confirmPassword = document.getElementById('confirmPassword').value.trim();
	const registerBtn = document.getElementById("registerBtn");

	if (!username || !email || !password) {
		console.log("Empty fields !");
		return;
	}
	if (password.length < 8) {
		registerError("password");
		return;
	}
	
	if (password !== confirmPassword) {
		registerError("passwordMismatch");
		return;
	}	

    try {
        const response = await fetch(`${baseUrl}/auth/api/register/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password }),
        });

        const data = await response.json();

		console.log("data: ", data);
		if (response.status === 400 && (data.email[0] === "A user with this email already exists."
			|| data.username[0] === "A user with that username already exists."
		)) {
			registerError("alreadyRegistered");
			return;
		}
		if (!response.ok) {
			throw new Error(`Could not fetch api ${response.status}`);
		}
		
		registerBtn.disabled = true;

		closeModal();
		// alert('User registered successfully!');
		console.log('User registered successfully!');
    } catch (error) {
        console.error('Error:', error);
    }
};

function closeModal() {
	const registerCard = document.querySelector("#registerCard");
	const closeBtn = document.getElementById("closeBtn");
	console.log("closeBtn: ", closeBtn);
	successfullyRegistered();
	setTimeout(() => {
		closeBtn.click();
		backToREgister(registerCard);
	}, 2000);

}

function registerError(type) {
	//register form fields
	const password = document.getElementById('registerPassword')
	const confirmPassword = document.getElementById('confirmPassword')
	const registerBtn = document.getElementById("registerBtn");
	const errorBox = document.querySelector("#errorBox1");

	errorBox.innerHTML = "";

	const errorMessage = document.createElement("p");
	const small = document.createElement("small");

	password.classList.add('shake');
	confirmPassword.classList.add('shake');


	if (type === "password") {
		small.textContent = "Password must be at least 8 characters long.";
	} else if ("alreadyRegistered") {
		small.textContent = "Username or email already registered!";
	} else if ("passwordMismatch") {
		small.textContent = "Passwords do not match!";
	}

	errorMessage.classList.add('text-danger', 'fw-light', 'text-center');
	errorMessage.appendChild(small);
	errorBox.appendChild(errorMessage);

	setInterval(() => {
		registerBtn.disabled = false;
		
		password.classList.remove('shake');
		confirmPassword.classList.remove('shake');

		errorBox.innerHTML = "";
	}, 3000);
}

function successfullyRegistered() {
	const registerCard = document.querySelector("#registerCard");
	console.log("reg: ", registerCard);
	
	registerCard.innerHTML = `
		<div class="card text-center shadow-lg p-4">
			<div class="card-body p-4">
				<div class="mb-3">
					<div class="bg-success text-white rounded-circle d-flex justify-content-center
						align-items-center mx-auto" style="width: 80px; height: 80px;">
						<i class="fa-solid fa-check fa-2x"></i>
					</div>
				</div>
				<h4 class="fw-bold">Thank You for Registration</h4>
				<p class="text-muted">Congratulations, your account has been successfully created.</p>
			</div>
		</div>
	`;
}
