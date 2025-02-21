const isAuthenticated = localStorage.getItem("isAuthenticated");
const userName = localStorage.getItem("username");
const isOauthLogged = localStorage.getItem("isOauthLogged");
const chatIcon = document.getElementById("chatIcon");

console.log("chatIcon: ", chatIcon);

console.log("isoauthlogged: ", isOauthLogged);

export function authSection(authSectionDiv) {
	if ((isAuthenticated && userName) || isOauthLogged) {
		
		chatIcon.style.display = "block";

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
		// console.log("user is not logged in");
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

export function unloggedSideNav(sideNavDiv) {
	if (!sideNavDiv) {
		console.error("Error: sideNavDiv not found!");
		return;
	}

		const ulElement = sideNavDiv.getElementsByClassName("ul1").item(0);
		const ulElement2 = sideNavDiv.getElementsByClassName("ul2").item(0);
		const ulElement3 = sideNavDiv.getElementsByClassName("ul3").item(0);

		ulElement.innerHTML = `
			<li class="nav-item flex-grow-1">
				<a href="/history" class="nav-link text-white fw-bolder" data-link>
					<i class="fa-solid fa-book"></i>
					Pong History
				</a>
			</li>
			<li class="nav-item flex-grow-1">
				<a href="/rules" class="nav-link text-white fw-bolder" data-link>
					<i class="fa-solid fa-file-lines"></i>
					Pong Rules
				</a>
			</li>
		`;

		ulElement2.innerHTML = "";
		ulElement3.innerHTML = "";
}

export function UpdateUserName() {
	const loggedUserName = document.getElementById("loggedUserName");

	if ((isAuthenticated || isOauthLogged) && userName) {
		console.log("username: ", userName);
		if (loggedUserName) {
			console.log("loggedUserName: ", loggedUserName);
			loggedUserName.textContent = userName;
		}
	}
}

export function loadDefaultPic(userPicOne, userPicTwo) {
	if (userPicOne) {
		console.log("this is sidnav pic");
		
		userPicOne.src = "../assets/user1.png";
	}
	if (userPicTwo) {
		console.log("this is profile pic");

		userPicTwo.src = "../assets/user1.png";
	}
}


export function check2FaStatus(loginCardBody) {
	console.log("checking 2fa status");

	console.log("2fa is enabled");
	// click the 2fa button to show the 2fa modal
	loginCardBody.innerHTML = `
		<div class="text-center row justify-content-center mb-4" id="loginOtpInput">
			<div>
				<button class="btn btn-primary btn-login w-100">
					Verify OTP Before Login
				</button>
			</div>
			<div id="loginOtpDiv">
			</div>
		</div>
	`;
}

