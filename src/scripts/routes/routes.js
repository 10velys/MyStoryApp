import AboutPage from "../pages/about/about-page";
import LoginPage from "../pages/auth/login-page";
import RegisterPage from "../pages/auth/register-page";
import HomePresenter from "../pages/home/HomePresenter";
import AddStoryPage from "../pages/story/add-story-page";
import DetailStoryPage from "../pages/story/detail-story-page";
import BookmarksPage from "../pages/bookmarks/bookmarks-page";
import NotFoundPage from "../pages/not-found/not-found-page"; 
import AuthHelper from "../utils/auth";

const routes = {
  "/": {
    render: () => new LoginPage().render(),
    afterRender: () => new LoginPage().afterRender(),
    destroy: () => {},
  },
  "/home": {
    _presenter: null,
    _view: null,
    render: function () {
      this._presenter = new HomePresenter();
      this._view = this._presenter.init();
      return this._view.render();
    },
    afterRender: function () {
      return this._view.afterRender();
    },
    destroy: function () {
      if (this._view && typeof this._view.destroy === "function") {
        this._view.destroy();
      }
      if (this._presenter && typeof this._presenter.destroy === "function") {
        this._presenter.destroy();
      }
      this._view = null;
      this._presenter = null;
    },
  },
  "/about": {
    render: () => new AboutPage().render(),
    afterRender: () => new AboutPage().afterRender(),
    destroy: () => {},
  },
  "/bookmarks": {
    _page: null,
    render: function () {
      this._page = new BookmarksPage();
      return this._page.render();
    },
    afterRender: function () {
      return this._page.afterRender();
    },
    destroy: function () {
      if (this._page && typeof this._page.destroy === "function") {
        this._page.destroy();
      }
      this._page = null;
    },
  },
  "/story/:id": {
    _page: null,
    render: function () {
      this._page = new DetailStoryPage();
      return this._page.render();
    },
    afterRender: function () {
      return this._page.afterRender();
    },
    destroy: function () {
      if (this._page && typeof this._page.destroy === "function") {
        this._page.destroy();
      }
      this._page = null;
    },
  },
  "/add": {
    _page: null,
    render: function () {
      this._page = new AddStoryPage();
      return this._page.render();
    },
    afterRender: function () {
      return this._page.afterRender();
    },
    destroy: function () {
      if (this._page && typeof this._page.destroy === "function") {
        this._page.destroy();
      }
      this._page = null;
    },
  },
  "/login": {
    render: () => new LoginPage().render(),
    afterRender: () => new LoginPage().afterRender(),
    destroy: () => {},
  },
  "/register": {
    render: () => new RegisterPage().render(),
    afterRender: () => new RegisterPage().afterRender(),
    destroy: () => {},
  },
  "/logout": {
    render: () => {
      AuthHelper.logout();
      return '<div class="loading-indicator">Logging out...</div>';
    },
    afterRender: () => {},
    destroy: () => {},
  },
  "/404": {
    _page: null,
    render: function () {
      this._page = new NotFoundPage();
      return this._page.render();
    },
    afterRender: function () {
      return this._page.afterRender();
    },
    destroy: function () {
      if (this._page && typeof this._page.destroy === "function") {
        this._page.destroy();
      }
      this._page = null;
    },
  },
};

export default routes;