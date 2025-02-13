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

const navigateTo = (url) => {
	history.pushState(null, null, url);
	router();
};

const routes = [
	{ path: "/", view: HomeView },
	{ path: "/login", view: LoginView },
	{ path: "/dashboard", view: DashboardView },
	{ path: "/profile", view: ProfileView },
	{ path: "/tournaments", view: TournamentsView },
	{ path: "/tournament", view: TournamentView },
	{ path: "/requests", view: RequestsView },
	{ path: "/usersonline", view: UsersOnlineview },
	{ path: "/leaderboard", view: LeaderboardView },
	{ path: "/settings", view: SettingsView }
];

const router = async () => {
	const match = routes.find(route => route.path === location.pathname) || routes[0];

	const view = new match.view();

	appSection.innerHTML = await view.loadHtml();
};

window.addEventListener("popstate", router);

document.addEventListener("DOMContentLoaded", () => {
	document.body.addEventListener("click", (e) => {
		if (e.target.matches("[data-link]")) {
			e.preventDefault();
			navigateTo(e.target.href);
		}
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

	if ((!isAuthenticated || !isOauthLogged) && !publicRoutes.includes(currentPath)) {
		console.log('redirecting to login');
		window.location.href = '/';
		console.log('href:', window.location.href);
	} else {
		console.log('not redirecting');
	}
});
