import HomeView from "./views/HomeView.js";
import DashboardView from "./views/DashboardView.js";
import LoginView from "./views/LoginView.js";

console.log("this is the app file");

const pathToRegex = path => new RegExp("^" + path.replace(/\//g, "\\/").replace(/:\w+/g, "(.+)") + "$");

const getParams = match => {
    const values = match.result.slice(1);
    const keys = Array.from(match.route.path.matchAll(/:(\w+)/g)).map(result => result[1]);

    return Object.fromEntries(keys.map((key, i) => {
        return [key, values[i]];
    }));
};

const navigateTo = url => {
	history.pushState(null, null, url);
	router();
};

const router = async () => {
	const routes = [
		{ path: "/", view: HomeView },
		{ path: "/dashboard", view: DashboardView },
		{ path: "/login", view: LoginView }
	];

	const potentialMatches = routes.map(route => {
		return {
			route: route,
			result: location.pathname.match(pathToRegex(route.path))
		};
	});

	let match = potentialMatches.find(potentialMatch => potentialMatch.result !== null);

	if (!match) {
		match = {
			route: routes[0],
			result: [location.pathname]
		};
	}

	const view = new match.route.view(getParams(match));

	document.querySelector("#app").innerHTML = await view.getHtml();
};

window.addEventListener("popstate", router);

document.addEventListener("DOMContentLoaded", () => {
	document.body.addEventListener("click", e => {
		if (e.target.matches("[data-link]")) {
			console.log("checking links")
			e.preventDefault();
			navigateTo(e.target.href);
		}
	});

	router();
});
