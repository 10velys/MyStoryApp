import IdbHelper from "../../utils/idb-helper";

class BookmarksPresenter {
  constructor(view) {
    this._view = view;
    this._bookmarks = [];
  }

  async init() {
    await this._loadBookmarks();
  }

  async _loadBookmarks() {
    try {
      this._view.showLoading();
      this._bookmarks = await IdbHelper.getAllBookmarks();
      this._view.renderBookmarks(this._bookmarks);
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
      this._view.renderError();
    }
  }

  async removeBookmark(storyId) {
    try {
      await IdbHelper.removeBookmark(storyId);
      this._bookmarks = this._bookmarks.filter(bookmark => bookmark.id !== storyId);
      this._view.renderBookmarks(this._bookmarks);
      this._view.showToast('Bookmark removed successfully', 'success');
    } catch (error) {
      console.error('Failed to remove bookmark:', error);
      this._view.showToast('Failed to remove bookmark', 'error');
    }
  }

  getBookmarks() {
    return this._bookmarks;
  }

  destroy() {
    this._bookmarks = [];
  }
}

export default BookmarksPresenter;