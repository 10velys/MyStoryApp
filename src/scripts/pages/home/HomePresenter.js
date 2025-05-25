import AuthHelper from "../../utils/auth";
import HomePage from "./home-page.js";

export default class HomePresenter {
  #view;

  constructor() {
    this.#view = new HomePage();
  }

  init() {
    return this.#view.init();
  }

  destroy() {
    if (this.#view) {
      this.#view.destroy();
    }
  }
}