import { appSection } from "./utils/domUtils.js"
import HomeView from "./views/HomeView.js";
import DashboardView from "./views/DashboardView.js";
import LoginView from "./views/LoginView.js";
import ProfileView from "./views/ProfileView.js";
import TournamentsView from "./views/TournamentsView.js";
import TournamentView from "./views/TournamentView.js";
import UsersOnlineview from "./views/UsersOnlineview.js";
import SettingsView from "./views/SettingsView.js";
import LeaderboardView from "./views/LeaderboardView.js";
import RequestsView from "./views/RequestsView.js";
import PongGameView from "./views/PongGameView.js";
import UserProfileView from "./views/UserProfileView.js";

// game imports
import { initGame } from "./game.js";
import { initTournamentGame } from "./tournament.js";

const navigateTo = (url) => {
	history.pushState(null, null, url);
	router();
};

const routes = [
	{ path: "/", view: HomeView },
	{ path: "/login", view: LoginView },
	{ path: "/dashboard", view: DashboardView },
	{ path: "/profile", view: ProfileView },
	{ path: "/userprofile", view: UserProfileView },
	{ path: "/tournaments", view: TournamentsView },
	{ path: "/tournament", view: TournamentView },
	{ path: "/requests", view: RequestsView },
	{ path: "/usersonline", view: UsersOnlineview },
	{ path: "/leaderboard", view: LeaderboardView },
	{ path: "/ponggame", view: PongGameView },
	{ path: "/settings", view: SettingsView }
];

const router = async () => {
	const match = routes.find(route => route.path === location.pathname) || routes[0];

	const view = new match.view();

	appSection.innerHTML = await view.loadHtml();

	if (location.pathname === "/ponggame") {
		console.log("Pong Game view loaded");
        const canvas = document.getElementById("pongCanvas");
        if (!canvas) {
            console.error("Canvas element not found in live DOM!");
        } else {
            const ctx = canvas.getContext("2d");
            initGame(canvas, ctx);
        }
    } else if (location.pathname === "/tournament") {
		const canvas = document.getElementById("tournamentCanvas");
		if (!canvas) {
			console.error("Canvas element not found in live DOM!");
		} else {
			const ctx = canvas.getContext("2d");
			initTournamentGame(canvas, ctx);
		}
	}
};

window.addEventListener("popstate", router);

document.addEventListener("DOMContentLoaded", () => {
	document.body.addEventListener("click", (e) => {
		const link = e.target.closest("[data-link]");
		// if (e.target.matches("[data-link]")) {
		if (!link)
			return;
			e.preventDefault();
			navigateTo(link.href);
	});

	router();
});

const publicRoutes = ["/", "/history", "/rules"];

window.addEventListener('load', () => {
	console.log('loaded');
	const isAuthenticated = localStorage.getItem("isAuthenticated");
	const isOauthLogged = localStorage.getItem("isOauthLogged");
	const currentPath = window.location.pathname;

	console.log('isAuthenticated:', isAuthenticated);
	console.log('currentPath:', currentPath);

	// if ((!isAuthenticated || !isOauthLogged) && !publicRoutes.includes(currentPath)) {
	// 	console.log('redirecting to login');
	// 	window.location.href = '/';
	// 	console.log('href:', window.location.href);
	// } else {
	// 	console.log('not redirecting');
	// }

	// ****** SideNav link effects on click ******
	const navLinks = document.querySelectorAll(".nav-link");

    const activeLink = localStorage.getItem("activeNavLink");
    if (activeLink) {
        document.querySelector(`.nav-link[href='${activeLink}']`)?.classList.add("active");
    }

    navLinks.forEach(link => {
        link.addEventListener("click", function () {
            // Remove 'active' from all links
            navLinks.forEach(nav => nav.classList.remove("active"));
            
            // Add 'active' class to clicked link
            this.classList.add("active");

            // Store selected link in localStorage
            localStorage.setItem("activeNavLink", this.getAttribute("href"));
        });
    });
});
