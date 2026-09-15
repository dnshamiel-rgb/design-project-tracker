/* Desktop navigation layout only; no task data or network changes. */
(() => {
    const sidebar = document.getElementById("sidebar");
    if (!sidebar) return;
    const key = "dp.sidebarCollapsed";
    const desktop = window.matchMedia("(min-width: 651px)");
    let collapsed = false;
    try { collapsed = localStorage.getItem(key) === "true"; } catch (_) {}
    const button = document.createElement("button");
    button.id = "desktopSidebarToggle";
    button.type = "button";
    button.setAttribute("aria-controls", "sidebar");
    button.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M9 4v16"/></svg>';
    sidebar.before(button);
    function render() {
        const hidden = desktop.matches && collapsed;
        document.body.classList.toggle("desktop-sidebar-collapsed", hidden);
        sidebar.inert = hidden;
        button.setAttribute("aria-expanded", String(!hidden));
        button.setAttribute("aria-label", hidden ? "Open sidebar" : "Close sidebar");
        button.title = hidden ? "Open sidebar" : "Close sidebar";
    }
    button.addEventListener("click", () => {
        collapsed = !collapsed;
        try { localStorage.setItem(key, String(collapsed)); } catch (_) {}
        render();
    });
    desktop.addEventListener("change", render);
    render();
})();
