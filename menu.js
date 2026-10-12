// The three-bar menu at the top right, on every page.
const menuButton = document.querySelector(".menu-btn");
const menu = document.getElementById("site-menu");

function setMenu(open) {
  menu.hidden = !open;
  menuButton.setAttribute("aria-expanded", String(open));
  menuButton.setAttribute("aria-label", open ? "Close menu" : "Menu");
}

menuButton.addEventListener("click", () => setMenu(menu.hidden));
// A link was chosen, a tap landed outside, or Escape: close it.
menu.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
document.addEventListener("click", (e) => {
  if (!menu.hidden && !menu.contains(e.target) && !menuButton.contains(e.target)) setMenu(false);
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !menu.hidden) { setMenu(false); menuButton.focus(); }
});
