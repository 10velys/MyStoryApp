import { login } from "../../data/api";
import AuthHelper from "../../utils/auth";

export default class LoginPresenter {
  #view;

  constructor(view) {
    this.#view = view;
  }

  init() {
    return this;
  }

  destroy() {}

  async login(email, password) {
    this.#view.setSubmitButtonState(true, "Signing in...");

    const response = await login({ email, password });

    if (!response.error) {
      AuthHelper.setAuth({
        token: response.loginResult.token,
        name: response.loginResult.name,
        userId: response.loginResult.userId,
      });

      window.location.hash = "#/home";
      window.location.reload();
    } else {
      this.#view.showAlert(`Login failed: ${response.message}`);
      this.#view.setSubmitButtonState(false, "Sign In");
    }
  }

  validateInput(email, password) {
    if (!email || !password) {
      this.#view.showAlert("Please fill in all fields");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      this.#view.showAlert("Please enter a valid email address");
      return false;
    }

    return true;
  }
}