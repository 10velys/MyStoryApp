import { register } from "../../data/api";

class RegisterPage {
  constructor() {
    this._model = {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      errorMessage: "",
    };
    this._isLoading = false;
    
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  async render() {
    return `
      <style>
        /* Styling untuk form actions dan tombol register */
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
      <section class="container auth-page">
        <div class="auth-form-container">
          <h1>Create an Account</h1>
          
          <form id="register-form" class="auth-form">
            <div class="form-group">
              <label for="name">Name</label>
              <input type="text" id="name" name="name" required autocomplete="name">
            </div>
            
            <div class="form-group">
              <label for="email">Email</label>
              <input type="email" id="email" name="email" required autocomplete="email">
            </div>
            
            <div class="form-group">
              <label for="password">Password</label>
              <input type="password" id="password" name="password" required autocomplete="new-password" minlength="8">
              <p class="helper-text">Password must be at least 8 characters long</p>
            </div>
            
            <div class="form-group">
              <label for="confirm-password">Confirm Password</label>
              <input type="password" id="confirm-password" name="confirm-password" required autocomplete="new-password" minlength="8">
            </div>
            
            <div id="error-container" class="error-message"></div>
            
            <div class="form-actions">
              <button type="submit" id="register-button" class="btn btn-primary">Register</button>
              <p class="auth-redirect">
                Already have an account? <a href="#/login">Login</a> or 
                <a href="#/">continue as guest</a>
              </p>
            </div>
          </form>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this.init();
    this._initRegisterForm();
  }

  init() {
    return this;
  }

  get isLoading() {
    return this._isLoading;
  }

  set isLoading(value) {
    this._isLoading = value;
    this.updateLoadingState(this._isLoading);
  }

  setName(name) {
    this._model.name = name;
  }

  setEmail(email) {
    this._model.email = email;
  }

  setPassword(password) {
    this._model.password = password;
  }

  setConfirmPassword(confirmPassword) {
    this._model.confirmPassword = confirmPassword;
  }

  _initRegisterForm() {
    const form = document.getElementById("register-form");
    const nameInput = document.getElementById("name");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const confirmPasswordInput = document.getElementById("confirm-password");

    nameInput.addEventListener("input", () => {
      this.setName(nameInput.value);
    });

    emailInput.addEventListener("input", () => {
      this.setEmail(emailInput.value);
    });

    passwordInput.addEventListener("input", () => {
      this.setPassword(passwordInput.value);
    });

    confirmPasswordInput.addEventListener("input", () => {
      this.setConfirmPassword(confirmPasswordInput.value);
    });

    form.addEventListener("submit", (event) => {
      this.handleSubmit(event);
    });
  }

  validateForm() {
    const { name, email, password, confirmPassword } = this._model;
    this.clearError();

    if (name.trim().length < 2) {
      this._model.errorMessage = "Name must be at least 2 characters long.";
      this.showError(this._model.errorMessage);
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      this._model.errorMessage = "Please enter a valid email address.";
      this.showError(this._model.errorMessage);
      return false;
    }

    if (password.length < 8) {
      this._model.errorMessage = "Password must be at least 8 characters long.";
      this.showError(this._model.errorMessage);
      return false;
    }

    if (password !== confirmPassword) {
      this._model.errorMessage = "Passwords do not match.";
      this.showError(this._model.errorMessage);
      return false;
    }

    return true;
  }

  async handleSubmit(event) {
    event.preventDefault();

    if (this._isLoading) return;

    if (!this.validateForm()) {
      return;
    }

    try {
      this.isLoading = true;

      const { name, email, password } = this._model;

      const response = await register({ name, email, password });

      if (!response.error) {
        this.showSuccessMessage();
        this.navigateToLogin();
      } else {
        this._model.errorMessage =
          response.message || "Registration failed. Please try again.";
        this.showError(this._model.errorMessage);
      }
    } catch (error) {
      console.error("Registration error:", error);
      this._model.errorMessage =
        "An error occurred during registration. Please try again.";
      this.showError(this._model.errorMessage);
    } finally {
      this.isLoading = false;
    }
  }

  navigateToLogin() {
    window.location.hash = "#/login";
  }

  updateLoadingState(isLoading) {
    const button = document.getElementById("register-button");

    if (isLoading) {
      button.disabled = true;
      button.textContent = "Registering...";
    } else {
      button.disabled = false;
      button.textContent = "Register";
    }
  }

  showError(message) {
    const errorContainer = document.getElementById("error-container");

    if (errorContainer) {
      errorContainer.textContent = message;
      errorContainer.style.display = "block";
    }
  }

  clearError() {
    const errorContainer = document.getElementById("error-container");

    if (errorContainer) {
      errorContainer.textContent = "";
      errorContainer.style.display = "none";
    }
  }

  showSuccessMessage() {
    alert("Registration successful! Please login with your new account.");
  }

  destroy() {}
}

export default RegisterPage;