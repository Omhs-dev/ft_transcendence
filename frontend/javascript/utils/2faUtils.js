

export function successfullyVerifiedOTP() {
	const otpCard = document.getElementById("otpCard");
	console.log("otp verify: ", otpCard);
	
	otpCard.innerHTML = `
		<div class="card text-center shadow-lg p-4">
			<div class="card-body p-4">
				<div class="mb-3">
					<div class="bg-success text-white rounded-circle d-flex justify-content-center
						align-items-center mx-auto" style="width: 80px; height: 80px;">
						<i class="fa-solid fa-check fa-2x"></i>
					</div>
				</div>
				<h4 class="fw-bold">OTP Verified</h4>
				<p class="text-muted">Congratulations, your account has been successfully verified.</p>
			</div>
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
