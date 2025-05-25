import "../styles/styles.css";
import App from "./pages/app";
import AuthHelper from "./utils/auth";

document.addEventListener("DOMContentLoaded", async () => {
  AuthHelper.clearAuthOnStartup();

  const app = new App({
    content: document.querySelector("#main-content"),
    drawerButton: document.querySelector("#drawer-button"),
    navigationDrawer: document.querySelector("#navigation-drawer"),
  });
  await app.renderPage();

  window.addEventListener("hashchange", async () => {
    await app.renderPage();
  });
});