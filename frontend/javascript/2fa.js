import { appSection } from "./utils/domUtils.js";
import { getCookie } from "./login.js";
import { closeModal } from "./utils/2faUtils.js";
import { twoFaDisabled } from "./utils/2faUtils.js";
import { sendOtpBySms } from "./utils/2faUtils.js";
import { loadSmsContainer } from "./utils/2faUtils.js";
import { twoFaAlreadyEnabled } from "./utils/2faUtils.js";
import { choose2FaMethodSection } from "./utils/2faUtils.js";

const baseUrl = window.location.protocol === "https:" ? "https://localhost" : "http://localhost:8000";
console.log("protocol: ", window.location.protocol);
const twoFa = localStorage.getItem('twoFa');

console.log("2fa: ", twoFa);

appSection.addEventListener("click", (e) => {
	
	if (e.target.id === 'save' ) {
		const method = document.getElementById('twoFaMethod').value;

		if (method === 'totp') {
			console.log("this is auth app method");
			handleAuthApp(method);
		} else if (method === 'email') {
			console.log("this is the email method");
			handleEmail(method);
		} else if (method === 'sms') {
			console.log("this is sms mehtod");
			handleSMS(method);
		}
	}

	if (e.target.id === 'verifyOTP') {
		const method = document.getElementById('twoFaMethod').value;
		if (method === 'sms') {
			console.log("verify with sms");
			verifyWithSms();
		} else if (method === 'totp') {
			console.log("verify with sms or totp");
			verifyWithTopt();
		} else if (method === 'email') {
			console.log("verify with email");
			verifyWithEmail();
		}
	}
});

appSection.addEventListener('change', (e) => {
	const chooseMethod = document.getElementById('choose2FaMethod');
	console.log("e.target id: ", e.target.id);

	if (e.target.id === 'enable2FA') {
		console.log("enable2FA clicked");
		if (e.target.checked) {
			console.log("checked");
			choose2FaMethodSection();
		} else {
			console.log("unchecked");
			disabled2FA();
		}
	}
});

const handleAuthApp = async (method) => {
	try {
		const response = await fetch(`${baseUrl}/auth/api/select-2fa-method/`, {
			method: 'POST',
			headers: {
				'X-CSRFToken': getCookie('csrftoken'),
				'Content-Type': 'application/json'
			},
			credentials: 'include',
			body: JSON.stringify({ method }),
		});

		if (!response.ok) {
			throw new Error(`Could ont fetch the api ${response.status}`);
		}

		const data = await response.json();

		const hex = data.qr_code;
		const binary = new Uint8Array(hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
		const base64 = btoa(String.fromCharCode.apply(null, binary));

		const totpContainer = document.getElementById('totpContainer');
		const otpInputLabel = document.getElementById('otpInputLabel');

		totpContainer.style.display = "block";
		
		totpContainer.innerHTML = `
			<p>Please use <strong>Google Athenticator</strong>.</p>
			<p><small>Scan the QR and verify</small></p>
			<img id="qrCodeImage" width="300" alt="QR Code to scan"/>
		`;
		
		const qrCodeImage = document.getElementById('qrCodeImage');
		qrCodeImage.src = `data:image/png;base64,${base64}`;

		otpInputLabel.textContent = "Enter the Code generated by your App";
		// console.log("data: ", data);
	} catch(error) {

	}
};

const handleEmail = async (method) => {
	const totpContainer = document.getElementById('totpContainer');
	const otpInputLabel = document.getElementById('otpInputLabel');
	const smsContainer = document.getElementById('smsContainer');

	smsContainer.innerHTML = "";
	totpContainer.innerHTML = "";
	otpInputLabel.textContent = "Enter the Code sent to you by email";

	try {
		const response = await fetch(`${baseUrl}/auth/api/select-2fa-method/`, {
			method: 'POST',
			headers: {
				'X-CSRFToken': getCookie('csrftoken'),
				'Content-Type': 'application/json',
			},
			credentials: 'include',
			body: JSON.stringify({ method }),
		});

		if (!response.ok) {
			throw new Error(`Could not fetch api ${response.status}`);
		}

		const data = response.json();

		console.log("data: ", data);
	} catch(error) {
		console.log(error.message);
	}
};

const handleSMS = async (method) => {
	const totpContainer = document.getElementById('totpContainer');
	const otpInputLabel = document.getElementById('otpInputLabel');

	try {
		const response = await fetch(`${baseUrl}/auth/api/profile/`, {
			method: 'GET',
			headers: {
				'X-CSRFToken': getCookie('csrftoken'),
			},
			credentials: 'include',
		});

		if(!response.ok) {
			throw new Error(`Failed to fetch api ${response.status}`);
		}

		const data = await response.json();

		if (data.phone_number !== null) {
			console.log("has a number");
			hasAnumber(method, data.phone_number);
		} else {
			console.log("has no number");
			hasNoNumber(method);
		}
		console.log("data: ", data);
	} catch(error) {
		console.log(error.message);
	}

	// totpContainer.innerHTML = "";
	// otpInputLabel.textContent = "Enter the Code sent to you by SMS";

};

const hasAnumber = async (method, userPhoneNumber) => {
	try {
		const response = await fetch(`${baseUrl}/auth/api/select-2fa-method/`, {
			method: 'POST',
			headers: {
				'X-CSRFToken': getCookie('csrftoken'),
				'Content-Type': 'application/json',
			},
			credentials: 'include',
			body: JSON.stringify({ method, phone_number: userPhoneNumber }),
		});

		console.log("response details: ", response);
		if (response.status === 400) {
			console.log("Invalid phone number");
			const errorData = response.json();
			console.log("errorData: ", errorData);
		}
		if (!response.ok) {
			throw new Error(`Could not fetch api ${response.status}`);
		}

		const data = await response.json();

		console.log("this is has a number");
		console.log("data: ", data);
	} catch(error) {
		console.log(error.message);
	}
};

// User does not have a phone number, so we need to get the phone number
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const hasNoNumber = async (method) => {
	const smsContainer = document.getElementById('smsContainer');
	loadSmsContainer(smsContainer);
	const updateNumber = document.getElementById('updateNumber');

	updateNumber.addEventListener('click', async () => {
		const enteredPhoneNumber = document.getElementById('phoneNumber');

		if (!isValidPhoneNumber(enteredPhoneNumber.value)) {
			console.log("Invalid phone number");
			enteredPhoneNumber.classList.add('shake');
			const errorBox = document.createElement('p');
			errorBox.classList.add('text-danger');
			errorBox.textContent = "Invalid phone number";
			smsContainer.appendChild(errorBox);
			setTimeout(() => {
				enteredPhoneNumber.classList.remove('shake');
				errorBox.remove();
			}, 1000);
		}

		console.log("valid phone number");
		updateUserNumber(method, enteredPhoneNumber.value);
		smsContainer.innerHTML = "<p class=\"text-success\">Number updated successfully</p>";

		await wait(1000);

		// send the code
		sendOtpBySms(smsContainer);
		// identify the send code button
		const sendCode = document.getElementById('sendCode');

		console.log("sendCode: ", sendCode);
		// add event listener to the send code button
		sendCode.addEventListener('click', async () => {
			smsContainer.innerHTML = "<p class=\"text-success\">Code sent successfully</p>";
			setTimeout(() => {
				smsContainer.innerHTML = "";
			}, 1000);
			handleSMS(method);
		});
	});
};

const updateUserNumber = async (method, number) => {
	try {
		const response = await fetch(`${baseUrl}/auth/api/profile/`, {
			method: 'POST',
			headers: {
				'X-CSRFToken': getCookie('csrftoken'),
				'Content-Type': 'application/json',
			},
			credentials: 'include',
			body: JSON.stringify({ phone_number: number }),
		});

		if (!response.ok) {
			throw new Error(`Could not fetch api ${response.status}`);
		}

		const data = response.json();
		
		console.log("your number has been updated successfully");
	} catch(error) {
		console.log(error.message);
	}
}

const verifyWithEmail = async () => {
	const otpCode = document.getElementById('otpCode').value;
	const otpInput = document.getElementById('otpInput');
	console.log("otpCode: ", otpCode);

	if (!isValidPhoneNumber(otpCode)) {
		console.log("Invalid code");
		const errorBox = document.createElement('p');
		errorBox.classList.add('text-danger');
		errorBox.textContent = "Invalid code";
		otpInput.appendChild(errorBox);
		setInterval(() => {
			errorBox.innerHTML = "";
		}, 1000);
		return;
	}

	try {
		const response = await fetch(`${baseUrl}/auth/api/verify-2fa-setup/`, {
			method: 'POST',
			headers: {
				'X-CSRFToken': getCookie('csrftoken'),
				'Content-Type': 'application/json',
			},
			credentials: 'include',
			body: JSON.stringify({ 
				method: 'email',
				code: otpCode }),
		});

		if (!response.ok) {
			throw new Error(`Could not fetch api ${response.status}`);
		}

		const data = response.json();

		localStorage.setItem('enable2Fa', 'true');
		console.log("enable2Fa: ", localStorage.getItem('enable2Fa'));
		closeModal();
		twoFaAlreadyEnabled();

		console.log("data: ", data);
		console.log("Email verified successfully");
	} catch(error) {
		console.log(error.message);
	}
}

const verifyWithTopt = async () => {
	const otpCode = document.getElementById('otpCode').value;
	const otpInput = document.getElementById('otpInput');
	console.log("otpCode: ", otpCode);

	if (!isValidPhoneNumber(otpCode)) {
		console.log("Invalid code");
		const errorBox = document.createElement('p');
		errorBox.classList.add('text-danger');
		errorBox.textContent = "Invalid code";
		otpInput.appendChild(errorBox);
		setInterval(() => {
			errorBox.innerHTML = "";
		}, 1000);
		return;
	}

	try {
		const response = await fetch(`${baseUrl}/auth/api/verify-2fa-setup/`, {
			method: 'POST',
			headers: {
				'X-CSRFToken': getCookie('csrftoken'),
				'Content-Type': 'application/json',
			},
			credentials: 'include',
			body: JSON.stringify({ 
				method: 'totp',
				code: otpCode }),
		});

		if (!response.ok) {
			throw new Error(`Could not fetch api ${response.status}`);
		}

		const data = response.json();

		localStorage.setItem('enable2Fa', 'true');
		console.log("enable2Fa: ", localStorage.getItem('enable2Fa'));
		closeModal();
		twoFaAlreadyEnabled();

		console.log("data: ", data);
		console.log("TOTP verified successfully");
	} catch(error) {
		console.log(error.message);
	}
}

const verifyWithSms = async () => {
	const otpCode = document.getElementById('otpCode').value;
	const otpInput = document.getElementById('otpInput');
	console.log("otpCode: ", otpCode);

	if (!isValidPhoneNumber(otpCode)) {
		console.log("Invalid code");
		const errorBox = document.createElement('p');
		errorBox.classList.add('text-danger');
		errorBox.textContent = "Invalid code";
		otpInput.appendChild(errorBox);
		setInterval(() => {
			errorBox.innerHTML = "";
		}, 1000);
		return;
	}

	try {
		const response = await fetch(`${baseUrl}/auth/api/verify-2fa-setup/`, {
			method: 'POST',
			headers: {
				'X-CSRFToken': getCookie('csrftoken'),
				'Content-Type': 'application/json',
			},
			credentials: 'include',
			body: JSON.stringify({ 
				method: 'sms',
				code: otpCode }),
		});

		if (!response.ok) {
			throw new Error(`Could not fetch api ${response.status}`);
		}

		const data = response.json();

		localStorage.setItem('enable2Fa', 'true');
		console.log("enable2Fa: ", localStorage.getItem('enable2Fa'));
		closeModal();
		twoFaAlreadyEnabled();

		console.log("data: ", data);
		console.log("TOTP verified successfully");
	} catch(error) {
		console.log(error.message);
	}
}

const disabled2FA = async () => {
	const enableLabel = document.querySelector('.form-check-label');

	enableLabel.textContent = "Disabled";

	try {
		const response = await fetch(`${baseUrl}/auth/api/disable-2fa/`, {
			method: 'POST',
			headers: {
				'X-CSRFToken': getCookie('csrftoken'),
				'Content-Type': 'application/json',
			},
			credentials: 'include',
		});

		if (!response.ok) {
			throw new Error(`Could not fetch api ${response.status}`);
		}

		const data = response.json();

		localStorage.removeItem('phone_number');
		localStorage.setItem('enable2Fa', 'false');

		twoFaDisabled();

		console.log("data: ", data);
		console.log("2FA disabled successfully");
	} catch(error) {
		console.log(error.message);
	}
}

function isValidPhoneNumber(phoneNumber) {
	// Regex pattern to validate phone number (adjust as needed)
	const phonePattern = /^\+?[1-9]\d{1,14}$/;
	return phonePattern.test(phoneNumber);
}
