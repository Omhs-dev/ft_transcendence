const translations = {
    en: {
        welcome: "Welcome to ft_transcendence!",
        description: "Play, connect, and compete with others.",
        startGame: "Start Game",
        logout: "Logout"
    },
    fr: {
        welcome: "Bienvenue sur ft_transcendence!",
        description: "Jouez, connectez-vous et affrontez d'autres joueurs.",
        startGame: "Démarrer le jeu",
        logout: "Se déconnecter"
    },
    de: {
        welcome: "Willkommen bei ft_transcendence!",
        description: "Spielen, verbinden und gegen andere antreten.",
        startGame: "Spiel starten",
        logout: "Abmelden"
    }
};


document.addEventListener("DOMContentLoaded", function () {
    const langOptions = document.querySelectorAll(".lang-option");
    const elementsToTranslate = document.querySelectorAll("[data-translate]");

    // Load saved language or default to English
    let currentLang = localStorage.getItem("selectedLang") || "en";
    setLanguage(currentLang);

    // Add event listener for language selection
    langOptions.forEach(option => {
        option.addEventListener("click", function () {
            const selectedLang = this.getAttribute("data-lang");
            localStorage.setItem("selectedLang", selectedLang);
            setLanguage(selectedLang);
        });
    });

    // Function to update language
    function setLanguage(lang) {
        elementsToTranslate.forEach(element => {
            const key = element.getAttribute("data-translate");
            if (translations[lang][key]) {
                element.textContent = translations[lang][key];
            }
        });
    }
});
