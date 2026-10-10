(function () {
  "use strict";

  var path = window.location.pathname.toLowerCase();
  var page = "home";
  if (path.includes("pricing")) page = "pricing";
  else if (path.includes("download")) page = "download";
  else if (path.includes("docs")) page = "docs";
  else if (path.includes("auth")) page = "auth";
  else if (path.includes("profile")) page = "profile";
  else if (path.includes("admin")) page = "admin";
  else if (path.includes("changelog")) page = "changelog";
  else if (path.includes("use-cases")) page = "use-cases";
  else if (path.includes("404")) page = "404";

  document.body.classList.add("hive-page-" + page);
  if (page === "404") document.body.classList.add("hive-404");

  var nav = document.getElementById("site-nav");
  var toggle = document.querySelector("#m-menu-btn, #menu-btn, .nav-toggle");
  var mobilePanel = document.querySelector("#m-menu, .nav-mobile");
  var sidebar = document.querySelector("#sidebar");
  var navLinks = document.querySelector(".nav-links");
  var hasPageMenu = Boolean((document.getElementById("m-menu-btn") && mobilePanel) || (document.getElementById("menu-btn") && sidebar));

  function closeMenu() {
    if (mobilePanel) {
      mobilePanel.classList.remove("open", "is-open");
    }
    if (sidebar) sidebar.classList.remove("open");
    if (navLinks) navLinks.classList.remove("mobile-open");
    if (toggle) toggle.setAttribute("aria-expanded", "false");
  }

  function openMenu() {
    if (mobilePanel) {
      mobilePanel.classList.add("open", "is-open");
    }
    if (sidebar) sidebar.classList.add("open");
    if (navLinks) navLinks.classList.add("mobile-open");
    if (toggle) toggle.setAttribute("aria-expanded", "true");
  }

  if (toggle && !hasPageMenu) {
    toggle.addEventListener("click", function () {
      var expanded = toggle.getAttribute("aria-expanded") === "true";
      if (expanded) closeMenu();
      else openMenu();
    });
  }

  if (mobilePanel) {
    mobilePanel.addEventListener("click", function (event) {
      if (event.target.closest("a")) closeMenu();
    });
  }

  if (sidebar) {
    sidebar.addEventListener("click", function (event) {
      if (event.target.closest("a")) closeMenu();
    });
  }

  document.addEventListener("click", function (event) {
    if (nav && nav.contains(event.target)) return;
    if (toggle && toggle.contains(event.target)) return;
    if (mobilePanel && mobilePanel.contains(event.target)) return;
    if (sidebar && sidebar.contains(event.target)) return;
    closeMenu();
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") closeMenu();
  });

  var current = window.location.pathname.replace(/\/$/, "") || "/";
  document.querySelectorAll(".nav-links a, .nav-mobile a").forEach(function (link) {
    var href = link.getAttribute("href");
    if (!href) return;
    if (href === current || (current === "/" && href === "/")) {
      link.classList.add("is-current");
      link.setAttribute("aria-current", "page");
    }
  });

  document.querySelectorAll(".reveal").forEach(function (element) {
    element.classList.add("is-visible");
  });

  function updateScrollState() {
    var y = window.scrollY || document.documentElement.scrollTop;
    if (nav) nav.classList.toggle("scrolled", y > 10);
    var top = document.getElementById("to-top");
    if (top) top.classList.toggle("show", y > 520);
    var progress = document.getElementById("scroll-progress");
    var height = document.documentElement.scrollHeight - window.innerHeight;
    if (progress && height > 0) {
      progress.style.transform = "scaleX(" + (y / height) + ")";
      progress.setAttribute("aria-valuenow", String(Math.round((y / height) * 100)));
    }
  }

  var ticking = false;
  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      updateScrollState();
      ticking = false;
    });
  }, { passive: true });
  updateScrollState();

  var top = document.getElementById("to-top");
  if (top) {
    top.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  document.querySelectorAll('a[target="_blank"]').forEach(function (link) {
    if (!link.rel) link.rel = "noopener noreferrer";
  });
})();
