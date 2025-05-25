import RegisterPage from "./RegisterPage";

export default class RegisterPresenter {
  #view;

  constructor() {
    this.#view = new RegisterPage();
  }

  init() {
    return this.#view;
  }

  destroy() {
    if (this.#view) {
      this.#view.destroy();
    }
  }
}