
document.addEventListener("DOMContentLoaded", () => {

  // Initialize icons
  if (window.lucide) {
    lucide.createIcons();
  }

  // Mobile navigation
  const menuBtn = document.getElementById("menuBtn");
  const nav = document.querySelector(".navbar nav");

  if (menuBtn && nav) {
    menuBtn.addEventListener("click", () => {
      nav.classList.toggle("show");

      const isOpen = nav.classList.contains("show");

      menuBtn.setAttribute(
        "aria-label",
        isOpen ? "Close menu" : "Open menu"
      );
    });

    nav.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        nav.classList.remove("show");
      });
    });
  }

});

// Scroll to experiment section
function scrollToExperiments() {
  const section = document.getElementById("experiments");

  if (section) {
    section.scrollIntoView({
      behavior: "smooth"
    });
  }
}

// Experiment navigation
function openExperiment(type) {

  const experiments = {
    forward: "experiments/forward.html",
    reverse: "experiments/reverse.html",
    load: "experiments/load-regulation.html"
  };

  const destination = experiments[type];

  if (!destination) {
    return;
  }

  window.location.href = destination;
}

