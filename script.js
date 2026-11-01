
// ==========================================
// ZENER-LAB-360
// Main Website JavaScript
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    // --------------------------------------
    // MOBILE NAVIGATION
    // --------------------------------------

    const menuToggle = document.getElementById("menuToggle");
    const navLinks = document.querySelector(".nav-links");

    if (menuToggle && navLinks) {

        menuToggle.addEventListener("click", () => {

            const isOpen = navLinks.classList.toggle("open");

            menuToggle.innerHTML = isOpen ? "✕" : "☰";

            menuToggle.setAttribute(
                "aria-expanded",
                String(isOpen)
            );

        });

        // Close menu after clicking a navigation link

        navLinks.querySelectorAll("a").forEach(link => {

            link.addEventListener("click", () => {

                navLinks.classList.remove("open");
                menuToggle.innerHTML = "☰";

                menuToggle.setAttribute(
                    "aria-expanded",
                    "false"
                );

            });

        });

        // Close menu when clicking outside

        document.addEventListener("click", event => {

            const clickedInside =
                navLinks.contains(event.target) ||
                menuToggle.contains(event.target);

            if (!clickedInside) {

                navLinks.classList.remove("open");
                menuToggle.innerHTML = "☰";

                menuToggle.setAttribute(
                    "aria-expanded",
                    "false"
                );

            }

        });

    }


    // --------------------------------------
    // ACTIVE NAVIGATION LINK
    // --------------------------------------

    const sections = document.querySelectorAll(
        "main section[id]"
    );

    const navigationItems = document.querySelectorAll(
        ".nav-links a"
    );

    function updateActiveNavigation() {

        let currentSection = "home";

        sections.forEach(section => {

            const sectionTop = section.offsetTop - 140;

            if (window.scrollY >= sectionTop) {
                currentSection = section.id;
            }

        });

        navigationItems.forEach(link => {

            link.classList.remove("active");

            const target = link.getAttribute("href");

            if (target === `#${currentSection}`) {
                link.classList.add("active");
            }

        });

    }

    window.addEventListener(
        "scroll",
        updateActiveNavigation,
        { passive: true }
    );

    updateActiveNavigation();


    // --------------------------------------
    // SMOOTH SCROLLING
    // --------------------------------------

    document.querySelectorAll('a[href^="#"]').forEach(link => {

        link.addEventListener("click", event => {

            const targetID = link.getAttribute("href");

            if (!targetID || targetID === "#") return;

            const targetElement =
                document.querySelector(targetID);

            if (targetElement) {

                event.preventDefault();

                targetElement.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            }

        });

    });


    // --------------------------------------
    // EXPERIMENT CARD INTERACTION
    // --------------------------------------

    const experimentCards = document.querySelectorAll(
        ".experiment-card"
    );

    experimentCards.forEach(card => {

        card.addEventListener("mouseenter", () => {
            card.classList.add("card-active");
        });

        card.addEventListener("mouseleave", () => {
            card.classList.remove("card-active");
        });

    });


    // --------------------------------------
    // CURRENT YEAR
    // --------------------------------------

    const yearElements = document.querySelectorAll(
        ".current-year"
    );

    yearElements.forEach(element => {
        element.textContent = new Date().getFullYear();
    });


    // --------------------------------------
    // PAGE LOADED
    // --------------------------------------

    document.body.classList.add("page-loaded");

    console.log(
        "ZENER-LAB-360 | Home Page Initialized Successfully"
    );

});
