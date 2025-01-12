export function authSection(authSectionDiv) {
	const token = localStorage.getItem("access_token");
	console.log("token ----- : ", token);
	console.log("auth section: ", authSectionDiv);
	if (token) {
		console.log("user is logged in");
		return	authSectionDiv.innerHTML += `
				<button type="button" class="btn btn-success homebtn mb-3 game-action"
					id="startbtn" data-action="start">
					<div class="d-flex flex-column">
						<span class="fs-2">Start Game</span>
						<small class="fw-light">Play with a training AI</small>
					</div>
				</button>

				<button type="button" class="btn homebtn mb-3 game-action game-mode" data-action="mode">
					<div class="d-flex flex-column">
						<span class="fs-2">Game Mode</span>
						<small class="fw-light">Select game mode to play</small>
					</div>
				</button>
			`;
	} else {
		console.log("user is not logged in");
		return	authSectionDiv.innerHTML += `
				<button type="button" class="btn btn-success homebtn mb-3 game-action"
					id="startbtn" data-action="start">
					<div class="d-flex flex-column">
						<span class="fs-2">Start Game</span>
						<small class="fw-light">Play with a training AI</small>
					</div>
				</button>
				
				<a href="#" type="button" class="btn homebtn text-decoration-none register"
					id="registerBtn" data-bs-toggle="modal" data-bs-target="#registerMod">
					<div class="d-flex flex-column align-items-center">
						<span class="fs-2">Register</span>
						<small class="fw-light">Create an account to play</small>
					</div>
				</a>
				<div class="separator" id="separator">
					<hr>
					<span>Or</span>
					<hr>
				</div>
				<a href="#" type="button" class="btn text-decoration-none login"
					id="loginBtn" data-bs-toggle="modal" data-bs-target="#loginMod">
					<div class="d-flex flex-column align-items-center">
						<span class="fs-2">Login</span>
						<small class="fw-light">Login to play with a friend</small>
					</div>
				</a>
			`;
	}
}