class Sidenav extends HTMLElement {
	constructor() {
		super();

		console.log("Constructed: ", this);

		this.innerHTML = 
		`
			<div class="d-flex flex-column flex-shrink-0 p-3 text-white sidenav text-warning" style="width: 250px;">
			<a href="/" class="d-flex align-items-center mb-3 mb-md-0 me-md-auto text-white text-decoration-none fw-bold">
				<i class="fa-solid fa-table-tennis-paddle-ball fa-2x" style="padding-right: 8px;"></i>
				<span class="fs-3">Ping Pong</span>
			</a>
			<hr>
			<ul class="nav nav-pills flex-column mb-auto d-flex flex-column" id="navlist">
				<li class="nav-item flex-grow-1">
					<a href="#" class="nav-link active fw-bolder" aria-current="page">
						<i class="fa-solid fa-house"></i>
						Home
					</a>
				</li>
				<li class="nav-item flex-grow-1">
					<a href="#" class="nav-link text-white fw-bolder">
						<i class="fa-solid fa-gauge"></i>
						Dashboard
					</a>
				</li>
				<li class="nav-item">
					<a href="#" class="nav-link text-white fw-bolder">
						<i class="fa-solid fa-ranking-star"></i>
						Leaderboard
					</a>
				</li>
				<li class="nav-item">
					<a href="#" class="nav-link text-white fw-bolder">
						<i class="fa-solid fa-user-group"></i>
						Friend List
					</a>
				</li>
				<li class="nav-item">
					<a href="#" class="nav-link text-white fw-bolder">
						<i class="fa-solid fa-gear"></i>
						Settings
					</a>
				</li>
			</ul>

			<ul class="nav nav-pills flex-column">
			<li class="nav-item mb-auto">
				<a href="#" class="nav-link text-white fw-bolder">
					<i class="fa-solid fa-moon"></i>
					Dark Mode
				</a>
			</li>
			<li >
				<a href="#" class="nav-link text-white fw-bolder">
					<i class="fa-solid fa-right-to-bracket"></i>
					Login
				</a>
			</li>
			</ul>

			<hr>
			<div class="dropdown">
				<a href="#" class="d-flex align-items-center text-white text-decoration-none dropdown-toggle"
				id="dropdownUser1" data-bs-toggle="dropdown" aria-expanded="false">
				<img src="../assets/user1.png" alt="" width="32" height="32" class="rounded-circle me-2">
				<strong>mdo</strong>
				</a>
				<ul class="dropdown-menu dropdown-menu-dark text-small shadow" aria-labelledby="dropdownUser1">
					<li><a class="dropdown-item" href="#">New project...</a></li>
					<li><a class="dropdown-item" href="#">Settings</a></li>
					<li><a class="dropdown-item" href="#">Profile</a></li>
					<li>
						<hr class="dropdown-divider">
					</li>
					<li><a class="dropdown-item" href="#">Sign out</a></li>
				</ul>
			</div>
		</div>
		`;
	}

	connectedCallback() {
		console.log("connected", this);
	}

	disconnectedCallback() {
		console.log("disconnected", this);
	}
}

if ('customElements' in window) {
	customElements.define('side-nav', Sidenav);
}