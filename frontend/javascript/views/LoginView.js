import AbsractView from "./AbsractView.js";

export default class extends AbsractView {
	constructor(params) {
		super(params);
		this.setTitle("Login");
	}

	async loadHtml() {
		// try {
		// 	console.log("before fetching");
		// 	const response = await fetch("/pages/home.html");
		// 	if (!response.ok) {
		// 		throw new Error(`Error fetching page: ${response.statusText}`);
		// 	}
		// 	console.log("fetching informations");
		// 	const htmlContent = await response.text();
		// 	return htmlContent;
		// } catch(error) {
		// 	console.log(error.message);
		// }

		return `
			
			<div class="container">
				<div class="row justify-content-center">
					<div class="col-md-6">
						<div class="card">
							<div class="card-bg">

							</div>
							<div>
								<h2 class="text-center mt-4 fw-bold">
									LOGIN
								</h2>
							</div>
							<div class="card-body p-4">
								<form id="loginForm">
									<div class="mb-4">
										<!-- <label for="username" class="form-label">Username</label> -->
										<input type="text" class="form-control" id="username" placeholder="Enter your username"
											required>
									</div>
									<div class="mb-4">
										<!-- <label for="password" class="form-label">Password</label> -->
										<input type="password" class="form-control" id="password"
											placeholder="Enter your password" required>
									</div>
									<div class="d-grid">
										<button type="submit" class="btn btn-register">LOGIN</button>
									</div>
								</form>
							</div>
							<div class="card-footer text-secondary">
								Don't have an account? <a href="login.html">Sign Up</a>
							</div>
						</div>
					</div>
				</div>
			</div>
		`;
	}
}
