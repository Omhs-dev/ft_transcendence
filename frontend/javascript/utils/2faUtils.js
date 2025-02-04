const enable2FA = localStorage.getItem("enable2Fa");

export function successfullyVerifiedOTP() {
	const otpCard = document.getElementById("otpCard");
	console.log("otp verify: ", otpCard);
	
	otpCard.innerHTML = `
		<div class="card text-center shadow-lg p-4">
			<div class="card-body p-4">
				<div class="mb-3">
					<div class="bg-success text-white rounded-circle d-flex
						justify-content-center align-items-center mx-auto"
						style="width: 80px; height: 80px;">
						<i class="fa-solid fa-check fa-2x"></i>
					</div>
				</div>
				<h4 class="fw-bold">OTP Verified</h4>
				<p class="text-muted">Congratulations, your account has been successfully verified.</p>
			</div>
		</div>
	`;
}

export function loadSmsContainer(smsContainer) {
	smsContainer.innerHTML = `
		<div class="d-flex flex-column align-items-center">
			<label id="phoneNumberLabel" for="otpCode"></label>
				Enter your phone number to receive the code
			</small></p>
			<input class="form-control text-dark bg-light w-75" type="text" id="phoneNumber"
				placeholder="Phone Number: 0176..." name="otpCode" required>
			<button class="btn btn-outline-success mt-3 w-50" id="updateNumber">
				Update Number
			</button>
		</div>
	`;
}

export function sendOtpBySms(smsContainer) {
	smsContainer.innerHTML = `
		<div class="d-flex flex-column align-items-center">
			<p class="text-muted">Click the button below to receive the code</p>
			<button class="btn btn-outline-success mt-3 w-50" id="sendCode">
				Send Code
			</button>
		</div>
	`;
}

export function closeModal() {
	const closeBtn = document.getElementById("closeBtn");
	console.log("closeBtn: ", closeBtn);
	successfullyVerifiedOTP();
	setTimeout(() => {
		closeBtn.click();
	}, 2000);
}

export function choose2FaMethodSection() {
	const choose2FaMethod = document.getElementById("choose2FaMethod");
	console.log("choose2FaMethod: ", choose2FaMethod);

	choose2FaMethod.innerHTML = `
		<div class="mb-4">
			<label for="twoFaMethod" class="form-label">Choose 2FA Method:</label>
			<select id="twoFaMethod" class="form-select" required>
				<option value="sms">SMS</option>
				<option value="email">Email</option>
				<option value="totp">Authenticator App</option>
			</select>
		</div>

		<button class="btn btn-primary" id="save" data-bs-toggle="modal" 
			data-bs-target="#saveOtpMode">
			Save
		</button>
	`;
}

export function twoFaAlreadyEnabled() {
	const choose2FaMethod = document.getElementById("choose2FaMethod");

	choose2FaMethod.innerHTML = `
		<div class="mb-4">
			<p class="text-success">2FA is <strong>enabled</strong></p>
		</div>
	`;
}

export function twoFaDisabled() {
	const choose2FaMethod = document.getElementById("choose2FaMethod");

	choose2FaMethod.innerHTML = `
		<div class="mb-4">
			<p class="text-danger"><smal>2FA is <strong>disabled</strong></small></p>
			<p class="text-light">Please enable 2FA to secure your account</p>
		</div>
	`;
}