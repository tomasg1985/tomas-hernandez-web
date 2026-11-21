const navigationToggle = document.querySelector(".nav-toggle");
const primaryNavigation = document.querySelector("#primary-navigation");

if (navigationToggle && primaryNavigation) {
    const setMenuOpen = (isOpen) => {
        navigationToggle.setAttribute("aria-expanded", String(isOpen));
        navigationToggle.setAttribute("aria-label", isOpen ? "Cerrar menú" : "Abrir menú");
        primaryNavigation.classList.toggle("is-open", isOpen);
        document.body.classList.toggle("menu-open", isOpen);
    };

    navigationToggle.addEventListener("click", () => {
        const isOpen = navigationToggle.getAttribute("aria-expanded") === "true";
        setMenuOpen(!isOpen);

        if (!isOpen) {
            const firstLink = primaryNavigation.querySelector("a");
            if (firstLink) firstLink.focus();
        }
    });

    primaryNavigation.addEventListener("click", (event) => {
        if (event.target instanceof Element && event.target.closest("a")) {
            setMenuOpen(false);
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && navigationToggle.getAttribute("aria-expanded") === "true") {
            setMenuOpen(false);
            navigationToggle.focus();
        }
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 992 && navigationToggle.getAttribute("aria-expanded") === "true") {
            setMenuOpen(false);
        }
    });
}
