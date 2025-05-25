import LoginPresenter from "./LoginPresenter";
import { login } from "../../data/api";
import AuthHelper from "../../utils/auth";
import NotificationHelper from "../../utils/notification";

class LoginPage {
  constructor() {
    this.presenter = new LoginPresenter(this);
    this.model = {
      email: "",
      password: "",
      errorMessage: "",
    };
    this.isLoading = false;
  }

  async render() {
    return `
      <style>
        ::view-transition-old(root),
        ::view-transition-new(root) {
          animation-duration: 0.5s;
        }

        #login-container {
          view-transition-name: login-container;
        }

        ::view-transition-old(login-container) {
          animation: 300ms cubic-bezier(0.4, 0, 0.2, 1) both fade-out;
        }

        ::view-transition-new(login-container) {
          animation: 300ms cubic-bezier(0.4, 0, 0.2, 1) both fade-in;
        }

        #login-form-container {
          view-transition-name: login-form;
        }

        ::view-transition-old(login-form) {
          animation: 300ms cubic-bezier(0.4, 0, 0.2, 1) both slide-out;
        }

        ::view-transition-new(login-form) {
          animation: 300ms cubic-bezier(0.4, 0, 0.2, 1) both slide-in;
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes fade-out {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }

        @keyframes slide-in {
          from {
            transform: translateY(30px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes slide-out {
          from {
            transform: translateY(0);
            opacity: 1;
          }
          to {
            transform: translateY(-30px);
            opacity: 0;
          }
        }

        .form-actions {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          margin-top: 20px;
        }

        .btn-primary {
          width: 100%;
          max-width: 200px;
          padding: 10px 0;
          margin-bottom: 15px;
        }

        .auth-redirect {
          margin-top: 10px;
          text-align: center;
        }
      </style>
      <section class="container auth-page app-shell-content" id="login-container">
        <div class="auth-form-container" id="login-form-container">
          <h1>Login to Story App</h1>
         
          <form id="login-form">
            <div class="form-group">
              <label for="email">Email</label>
              <input type="email" id="email" required>
            </div>
           
            <div class="form-group">
              <label for="password">Password</label>
              <input type="password" id="password" required>
            </div>
           
            <div id="error-container" class="error-message"></div>
           
            <div class="form-actions">
              <button type="submit" id="login-button" class="btn btn-primary">Login</button>
              <div class="auth-redirect">
                Don't have an account? <a href="#/register" class="route-link">Register</a> or
                <a href="#/" class="route-link">continue as guest</a>
              </div>
            </div>
          </form>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this.presenter.init();
    this._initLoginForm();
    this._initTransitionLinks();
  }

  _initLoginForm() {
    const form = document.getElementById("login-form");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");

    emailInput.addEventListener("input", () => {
      this.model.email = emailInput.value;
    });

    passwordInput.addEventListener("input", () => {
      this.model.password = passwordInput.value;
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (this.isLoading) return;

      const email = this.model.email;
      const password = this.model.password;

      if (this.presenter.validateInput(email, password)) {
        await this.presenter.login(email, password);
      }
    });
  }

  _initTransitionLinks() {
    document.querySelectorAll(".route-link").forEach((link) => {
      link.addEventListener("click", async (event) => {
        event.preventDefault();
        const targetUrl = link.getAttribute("href");
        
        if (document.startViewTransition) {
          const transition = document.startViewTransition(() => {
            window.location.hash = targetUrl;
          });

          await transition.ready;
          return;
        }

        window.location.hash = targetUrl;
      });
    });
  }

  setSubmitButtonState(isLoading, text) {
    this.isLoading = isLoading;
    const button = document.getElementById("login-button");

    if (button) {
      button.disabled = isLoading;
      button.textContent = text || (isLoading ? "Logging in..." : "Login");
    }
  }

  showAlert(message) {
    const errorContainer = document.getElementById("error-container");
    if (errorContainer) {
      errorContainer.textContent = message;
      errorContainer.style.display = "block";
    }
  }

  navigateToHome() {
    if ('caches' in window) {
      const userData = AuthHelper.getAuth();
      if (userData) {
        try {
          localStorage.setItem('cached_user', JSON.stringify(userData));
        } catch (error) {
          console.error('Failed to cache user data:', error);
        }
      }
    }
    console.log("Login berhasil - Navigating to home page");
    window.location.hash = "#/home";
  }

  isLoginPage() {
    return Boolean(document.getElementById("login-form"));
  }
}

export default LoginPage;