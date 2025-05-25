import { showFormattedDate } from "../../utils/index";
import CONFIG from "../../config";
import BookmarksPresenter from "./BookmarksPresenter";

class BookmarksPage {
  constructor() {
    this._presenter = new BookmarksPresenter(this);
  }

  async render() {
    return `
      <section class="container bookmarks-page">
        <div class="page-header">
          <a href="#/home" class="back-button" aria-label="Back to home page">
            <i class="fas fa-arrow-left"></i> Back
          </a>
          <h1><i class="fas fa-bookmark"></i> Bookmarked Stories</h1>
        </div>
        
        <div id="bookmarks-container" class="bookmarks-container">
          <div class="loading-indicator">Loading bookmarks...</div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this._addStyles();
    await this._presenter.init();
  }

  showLoading() {
    const container = document.getElementById('bookmarks-container');
    container.innerHTML = `
      <div class="loading-indicator">Loading bookmarks...</div>
    `;
  }

  renderBookmarks(bookmarks) {
    const container = document.getElementById('bookmarks-container');
    
    if (bookmarks.length === 0) {
      this._renderEmptyState(container);
      return;
    }

    const bookmarksHTML = bookmarks
      .sort((a, b) => new Date(b.bookmarkedAt) - new Date(a.bookmarkedAt))
      .map(bookmark => this._createBookmarkHTML(bookmark))
      .join('');

    container.innerHTML = `
      <div class="bookmarks-grid">
        ${bookmarksHTML}
      </div>
    `;

    this._attachBookmarkEvents();
  }

  renderError() {
    const container = document.getElementById('bookmarks-container');
    container.innerHTML = `
      <div class="empty-bookmarks">
        <i class="fas fa-exclamation-triangle"></i>
        <h2>Error Loading Bookmarks</h2>
        <p>Failed to load your bookmarks. Please try again.</p>
        <button onclick="window.location.reload()" class="browse-stories-btn">
          Retry
        </button>
      </div>
    `;
  }

  _renderEmptyState(container) {
    container.innerHTML = `
      <div class="empty-bookmarks">
        <i class="fas fa-bookmark"></i>
        <h2>No Bookmarks Yet</h2>
        <p>Start exploring stories and bookmark the ones you love!</p>
        <a href="#/home" class="browse-stories-btn">Browse Stories</a>
      </div>
    `;
  }

  _createBookmarkHTML(bookmark) {
    const hasLocation = bookmark.lat && bookmark.lon;
    
    return `
      <div class="bookmark-card" data-id="${bookmark.id}">
        <div class="bookmark-image">
          <img src="${bookmark.photoUrl}" alt="${bookmark.name}'s story" 
               onerror="this.src='/favicon.png'">
        </div>
        <div class="bookmark-content">
          <h3 class="bookmark-title">${bookmark.name}'s Story</h3>
          <p class="bookmark-date">
            Bookmarked: ${showFormattedDate(bookmark.bookmarkedAt, CONFIG.DEFAULT_LANGUAGE)}
          </p>
          <p class="bookmark-description">
            ${bookmark.description.length > 150 
              ? bookmark.description.substring(0, 150) + '...' 
              : bookmark.description}
          </p>
          <div class="bookmark-meta">
            ${hasLocation 
              ? `<div class="bookmark-location">
                   <i class="fas fa-map-marker-alt"></i>
                   <span>Location available</span>
                 </div>`
              : '<div></div>'
            }
            <button class="remove-bookmark-btn" data-id="${bookmark.id}">
              <i class="fas fa-trash"></i> Remove
            </button>
          </div>
        </div>
      </div>
    `;
  }

  _attachBookmarkEvents() {
    const bookmarkCards = document.querySelectorAll('.bookmark-card');
    const removeButtons = document.querySelectorAll('.remove-bookmark-btn');

    bookmarkCards.forEach(card => {
      card.addEventListener('click', (e) => {
        if (!e.target.closest('.remove-bookmark-btn')) {
          const storyId = card.dataset.id;
          window.location.hash = `#/story/${storyId}`;
        }
      });
    });

    removeButtons.forEach(button => {
      button.addEventListener('click', async (e) => {
        e.stopPropagation();
        const storyId = button.dataset.id;
        
        if (confirm('Are you sure you want to remove this bookmark?')) {
          await this._presenter.removeBookmark(storyId);
        }
      });
    });
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#28a745' : '#dc3545'};
      color: white;
      padding: 12px 20px;
      border-radius: 6px;
      z-index: 10000;
      opacity: 0;
      transform: translateX(100%);
      transition: all 0.3s ease;
    `;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  _addStyles() {
    const style = document.createElement('style');
    style.id = 'bookmarks-page-styles';
    style.textContent = `
      .bookmarks-page {
        padding: 20px;
        max-width: 1200px;
        margin: 0 auto;
      }

      .page-header {
        display: flex;
        align-items: center;
        gap: 20px;
        margin-bottom: 30px;
        padding-bottom: 20px;
        border-bottom: 2px solid #f0f0f0;
      }

      .page-header h1 {
        margin: 0;
        color: #333;
        font-size: 2rem;
      }

      .back-button {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #4A6572;
        text-decoration: none;
        font-weight: 500;
        transition: color 0.3s ease;
      }

      .back-button:hover {
        color: #0084ff;
      }

      .bookmarks-container {
        min-height: 300px;
      }

      .bookmarks-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 20px;
        margin-top: 20px;
      }

      .bookmark-card {
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        overflow: hidden;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        cursor: pointer;
      }

      .bookmark-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 20px rgba(0,0,0,0.15);
      }

      .bookmark-image {
        width: 100%;
        height: 200px;
        overflow: hidden;
        position: relative;
      }

      .bookmark-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.3s ease;
      }

      .bookmark-card:hover .bookmark-image img {
        transform: scale(1.05);
      }

      .bookmark-content {
        padding: 20px;
      }

      .bookmark-title {
        margin: 0 0 10px;
        font-size: 1.3rem;
        font-weight: 600;
        color: #333;
      }

      .bookmark-date {
        font-size: 0.9rem;
        color: #666;
        margin-bottom: 10px;
      }

      .bookmark-description {
        color: #555;
        line-height: 1.5;
        margin-bottom: 15px;
      }

      .bookmark-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 15px;
        padding-top: 15px;
        border-top: 1px solid #eee;
      }

      .bookmark-location {
        display: flex;
        align-items: center;
        gap: 5px;
        color: #666;
        font-size: 0.9rem;
      }

      .remove-bookmark-btn {
        background: #dc3545;
        color: white;
        border: none;
        padding: 8px 12px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.9rem;
        transition: background-color 0.3s ease;
      }

      .remove-bookmark-btn:hover {
        background: #c82333;
      }

      .empty-bookmarks {
        text-align: center;
        padding: 60px 20px;
        background: #f9f9f9;
        border-radius: 12px;
        margin-top: 20px;
      }

      .empty-bookmarks i {
        font-size: 4rem;
        color: #ccc;
        margin-bottom: 20px;
      }

      .empty-bookmarks h2 {
        color: #666;
        margin-bottom: 10px;
      }

      .empty-bookmarks p {
        color: #888;
        margin-bottom: 20px;
      }

      .browse-stories-btn {
        background: #4A6572;
        color: white;
        text-decoration: none;
        padding: 12px 24px;
        border-radius: 8px;
        display: inline-block;
        transition: background-color 0.3s ease;
        border: none;
        cursor: pointer;
        font-size: 1rem;
      }

      .browse-stories-btn:hover {
        background: #3a5260;
        color: white;
      }

      .loading-indicator {
        text-align: center;
        padding: 40px;
        color: #666;
      }

      @media (max-width: 768px) {
        .bookmarks-grid {
          grid-template-columns: 1fr;
        }
        
        .page-header {
          flex-direction: column;
          align-items: flex-start;
          gap: 10px;
        }
      }
    `;
    
    if (!document.getElementById('bookmarks-page-styles')) {
      document.head.appendChild(style);
    }
  }

  destroy() {
    const style = document.getElementById('bookmarks-page-styles');
    if (style) {
      style.remove();
    }
    
    if (this._presenter) {
      this._presenter.destroy();
    }
  }
}

export default BookmarksPage;