import CONFIG from "../config";

const AuthHelper = {
  setAuth(data) {
    console.log("Setting auth data:", data);
    localStorage.setItem(CONFIG.AUTH_KEY, JSON.stringify(data));
    this.updateAuthButton();
  },

  getAuth() {
    return JSON.parse(localStorage.getItem(CONFIG.AUTH_KEY) || "{}");
  },

  clearAuth() {
    console.log("Clearing auth data");
    localStorage.removeItem(CONFIG.AUTH_KEY);
    this.updateAuthButton();
  },

  destroyAuth() {
    this.clearAuth();
  },

  isUserSignedIn() {
    const auth = this.getAuth();
    const isLoggedIn = Boolean(auth.token);
    console.log("User signed in:", isLoggedIn);
    return isLoggedIn;
  },

  updateAuthButton() {
    const loginNavItem = document.getElementById("login-nav-item");
    const loginButton = document.querySelector('a[href="#/login"]');

    if (!loginButton) {
      console.log("Login button not found");
      return;
    }

    const isLoggedIn = this.isUserSignedIn();
    console.log("Updating auth button. User logged in:", isLoggedIn);

    if (isLoggedIn) {
      loginButton.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';

      const newLoginButton = loginButton.cloneNode(true);
      loginButton.parentNode.replaceChild(newLoginButton, loginButton);

      newLoginButton.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.clearAuth();

        setTimeout(() => {
          window.location.hash = "#/login";
        }, 50);

        return false;
      });
    } else {
      loginButton.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';

      const newLoginButton = loginButton.cloneNode(true);
      loginButton.parentNode.replaceChild(newLoginButton, loginButton);

      newLoginButton.href = "#/login";
    }
  },

  clearAuthOnStartup() {
    if (
      window.location.hash === "" ||
      window.location.hash === "#/" ||
      window.location.hash === "#"
    ) {
      console.log(
        "Clearing auth state on initial load to ensure login page is shown first",
      );
      this.clearAuth();
    }
  },

  initAuthState() {
    document.addEventListener("DOMContentLoaded", () => {
      console.log("DOM loaded, updating auth button");
      this.updateAuthButton();
    });

    window.addEventListener("hashchange", () => {
      console.log("Hash changed, updating auth button");
      this.updateAuthButton();
    });
  },
};

AuthHelper.initAuthState();

export default AuthHelper;