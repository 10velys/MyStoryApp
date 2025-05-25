import { showFormattedDate } from "../../utils/index";
import StoryMap from "../../utils/map";
import CONFIG from "../../config";
import { getAllStories } from "../../data/api";
import AuthHelper from "../../utils/auth";
import NotificationHelper from "../../utils/notification-helper";

class HomePage {
  constructor() {
    this._map = null;
    this._storiesContainer = null;
    this._isLoadingMore = false;
    this._observer = null;
    this._model = {
      stories: [],
      isLoggedIn: AuthHelper.isUserSignedIn(),
    };
    this._storyIds = new Set();
    this._currentPage = 1;
    this._isLoading = false;
    this._lastStoriesCount = 0;
    this._lastStoryCheck = null;
    
    this._handleHashChange = this._handleHashChange.bind(this);
    this.handleLoadMoreClick = this.handleLoadMoreClick.bind(this);
    this._checkForNewStories = this._checkForNewStories.bind(this);
  }

  init() {
    this._setupEventListeners();
    this._loadStories();
    this._startNewStoryCheck();
    return this;
  }

  _startNewStoryCheck() {
    if (this._newStoryInterval) {
    clearInterval(this._newStoryInterval);
    }
    this._newStoryInterval = setInterval(this._checkForNewStories, 10000);
  }

  async _checkForNewStories() {
    if (!this._model.isLoggedIn || !AuthHelper.isUserSignedIn()) {
      return;
    }

    if (!NotificationHelper.isSubscribed) {
      return;
    }

    try {
      const token = AuthHelper.getAuth()?.token;
      if (!token) return;

      const response = await getAllStories({
        page: 1,
        size: 1,  
        location: 1,
        token,
      });

      if (!response.error && response.listStory && response.listStory.length > 0) {
        const latestStory = response.listStory[0];
        
        if (!this._lastStoryCheck) {
          this._lastStoryCheck = latestStory.createdAt;
          return;
        }

        const latestStoryTime = new Date(latestStory.createdAt).getTime();
        const lastCheckTime = new Date(this._lastStoryCheck).getTime();

        if (latestStoryTime > lastCheckTime && !this._storyIds.has(latestStory.id)) {
          console.log('[HomePage] ===== NEW STORY DETECTED =====');
          console.log('[HomePage] New story object:', latestStory);
          console.log('[HomePage] Story ID:', latestStory.id);
          console.log('[HomePage] Story ID type:', typeof latestStory.id);
          console.log('[HomePage] All story keys:', Object.keys(latestStory));
          console.log('[HomePage] ===== END DEBUG =====');
          
          this._lastStoryCheck = latestStory.createdAt;
          await NotificationHelper.handleNewStory(latestStory);
        }
      }
    } catch (error) {
      console.error('[HomePage] Error checking for new stories:', error);
    }
  }

  async render() {
    this._applyStyles();
    const isLoggedIn = this.getIsLoggedIn();

    return `
      <section class="container home-page" style="view-transition-name: page">
        <h1 class="visually-hidden">Story App Home Page</h1>
        
        <div class="page-wrapper">
          <div class="header-actions" style="view-transition-name: header-actions">
            ${
              isLoggedIn
                ? `
              <a href="#/add" class="btn btn-primary add-story-btn" aria-label="Add new story" data-transition="true">
                <i class="fas fa-plus"></i> Add Story
              </a>
            `
                : `
              <a href="#/login" class="btn btn-primary add-story-btn" aria-label="Login to add stories" data-transition="true">
                <i class="fas fa-sign-in-alt"></i> Login
              </a>
            `
            }
          </div>
          
          <div class="view-container">
            <div id="map-container" class="map-container" style="view-transition-name: map-container">
              <div id="stories-map" class="stories-map"></div>
            </div>
            
            <div id="list-view" class="stories-list" style="view-transition-name: list-view">
              <div class="story-items" id="stories-container">
                <div class="loading-indicator">Loading stories...</div>
              </div>
              <div class="pagination" id="pagination" style="view-transition-name: pagination">
                <button id="load-more" class="btn btn-secondary">Load More</button>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  _applyStyles() {
    const styleElement = document.createElement("style");
    styleElement.textContent = `
      .header-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      .add-story-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 38px;
      }

      .map-container {
        width: 100%;
        margin-bottom: 30px;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 3px 8px rgba(0,0,0,0.1);
      }

      .stories-map {
        width: 100%;
        height: 300px;
        position: relative;
      }

      @media screen and (min-width: 768px) {
        .stories-map {
          height: 400px;
        }
      }

      @media screen and (min-width: 1200px) {
        .stories-map {
          height: 450px;
        }
      }

      .story-link-container {
        display: block;
        width: 100%;
        height: 100%;
        position: relative;
        overflow: hidden;
      }

      .story-link-container:hover img {
        transform: scale(1.05);
      }

      .story-link {
        text-decoration: none;
        color: #333;
        transition: color 0.3s ease;
      }

      .story-link:hover {
        color: #0084ff;
      }

      @media screen and (max-width: 576px) {
        .header-actions {
          display: flex;
          flex-direction: row; 
          justify-content: space-between; 
          align-items: center;
          width: 100%;
        }
        
        .add-story-btn {
          flex: 0 1 auto; 
          min-width: 110px; 
          height: 38px;
        }
      }

      @media screen and (max-width: 414px) {
        .header-actions {
          gap: 8px; 
        }
        
        .add-story-btn {
          font-size: 14px; 
          padding: 0.375rem 0.75rem; 
        }
        
        .story-items {
          grid-template-columns: 1fr; 
        }
      }

      @media screen and (min-width: 415px) and (max-width: 768px) {
        .story-items {
          grid-template-columns: repeat(2, 1fr); 
        }
      }

      .story-items {
        min-height: 200px;
        position: relative;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 20px;
        align-items: start;
        width: 100%; 
        margin: 0 auto; 
        padding: 10px 5px; 
        overflow-y: visible; 
        overflow-x: clip; 
        z-index: 1; 
        margin-top: 10px;
        margin-bottom: 20px;
        contain: layout paint; 
      }

      .story-card {
        position: relative;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.08);
        margin-bottom: 10px;
        transition: transform 0.25s ease-out, box-shadow 0.25s ease-out;
        transform: translate3d(0, 0, 0); 
        height: 100%;
        contain: content; 
        will-change: transform; 
      }

      .story-card:hover {
        transform: translate3d(0, -5px, 0);
        box-shadow: 0 8px 15px rgba(0, 0, 0, 0.12);
      }

      .story-item,
      .story-card {
        background-color: #fff;
        border-radius: 12px;
        box-shadow: 0 3px 8px rgba(0,0,0,0.1);
        overflow: hidden;
        transition: transform 0.25s ease-out, box-shadow 0.25s ease-out;
        cursor: pointer;
        opacity: 1;
        height: 100%;
        display: flex;
        flex-direction: column;
        backface-visibility: hidden;
        transform: translate3d(0, 0, 0);
        contain: content; 
        position: relative;
        z-index: 1;
      }

      .story-item:hover,
      .story-card:hover {
        transform: translate3d(0, -8px, 0);
        box-shadow: 0 12px 20px rgba(0,0,0,0.12);
        z-index: 5;
      }

      .story-image {
        width: 100%;
        height: 200px;
        overflow: hidden;
        background-color: #f2f2f2;
        position: relative;
        contain: strict; 
      }

      .story-image::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(rgba(0,0,0,0.05), rgba(0,0,0,0.1));
        z-index: 1;
        pointer-events: none;
      }

      .story-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.4s ease-out;
        transform: translate3d(0, 0, 0);
        will-change: transform;
      }

      .story-item:hover .story-image img,
      .story-card:hover .story-image img {
        transform: scale(1.05) translate3d(0, 0, 0);
      }

      .story-image img.loading {
        opacity: 0;
      }

      .story-image img.loaded {
        opacity: 1;
        transition: opacity 0.4s ease-out;
      }

      .story-content {
        padding: 15px;
        flex: 1;
        display: flex;
        flex-direction: column;
      }

      .story-content h2 {
        margin: 0 0 8px;
        font-size: 1.2rem;
      }

      .story-content h2 a {
        color: #333;
        text-decoration: none;
        transition: color 0.25s ease;
      }

      .story-content h2 a:hover {
        color: #0084ff;
      }

      .story-date {
        font-size: 0.85rem;
        color: #666;
        margin: 0 0 10px;
      }

      .story-description {
        margin: 0 0 10px;
        font-size: 0.95rem;
        color: #444;
        line-height: 1.5;
      }

      .story-location {
        display: flex;
        align-items: center;
        font-size: 0.85rem;
        color: #666;
      }

      .story-location i {
        color: #0084ff;
        margin-right: 5px;
      }

      .loading-indicator {
        text-align: center;
        padding: 20px;
        color: #666;
        animation: pulse 1.5s infinite ease-out;
        contain: strict; 
      }

      @keyframes pulse {
        0% { opacity: 0.6; }
        50% { opacity: 1; }
        100% { opacity: 0.6; }
      }

      .empty-state {
        text-align: center;
        padding: 40px 20px;
        background-color: #f9f9f9;
        border-radius: 10px;
        margin: 20px 0;
        transform: translate3d(0, 0, 0);
        transition: all 0.3s ease-out;
      }

      .error-state {
        text-align: center;
        padding: 40px 20px;
        background-color: #fff8f8;
        border-radius: 10px;
        margin: 20px 0;
        border-left: 4px solid #d9534f;
        transform: translate3d(0, 0, 0);
        transition: all 0.3s ease-out;
      }

      .page-wrapper {
        width: 100%;
        max-width: 1200px;
        margin: 0 auto;
        padding: 15px;
        position: relative;
        isolation: isolate;
        overflow: visible;
      }

      .container.home-page {
        padding: 0;
        max-width: 100%;
        width: 100%;
        transform: translate3d(0, 0, 0);
        overflow: visible;
      }

      .view-container {
        width: 100%;
        max-width: 100%;
        margin: 0 auto;
        padding-bottom: 30px;
        min-height: auto;
        position: relative;
        overflow-x: visible;
        transform: translate3d(0, 0, 0);
        padding-top: 10px;
        contain: layout paint; 
      }

      .story-item.fade-in,
      .story-card.fade-in {
        animation: fadeIn 0.5s ease-out forwards;
        contain: layout paint; 
      }

      @keyframes fadeIn {
        from { 
          opacity: 0; 
          transform: translate3d(0, 15px, 0); 
        }
        to { 
          opacity: 1; 
          transform: translate3d(0, 0, 0); 
        }
      }

      .stories-list {
        padding: 20px 0;
        width: 100%;
        box-sizing: border-box;
        transform: translate3d(0, 0, 0);
        margin-top: 15px;
        margin-bottom: 15px;
        position: relative;
        z-index: 1;
        min-height: 200px;
        contain: content; 
      }

      .location-indicator {
        display: flex;
        align-items: center;
        gap: 5px;
        color: #666;
        margin-top: 8px;
        font-size: 0.9em;
      }

      .error-message {
        color: #d93025;
        padding: 8px 0;
        font-size: 0.9em;
        display: none;
      }

      .pagination {
        display: flex;
        justify-content: center;
        margin-top: 20px;
        margin-bottom: 20px;
        position: relative;
        z-index: 2;
      }

      .btn-loading {
        position: relative;
        color: transparent !important;
      }

      .btn-loading::after {
        content: "";
        position: absolute;
        width: 16px;
        height: 16px;
        top: calc(50% - 8px);
        left: calc(50% - 8px);
        border: 2px solid rgba(255, 255, 255, 0.5);
        border-radius: 50%;
        border-top-color: white;
        animation: spin 0.8s linear infinite;
        will-change: transform;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      ::view-transition-old(root),
      ::view-transition-new(root) {
        animation-duration: 0.5s;
        animation-timing-function: ease-out;
        contain: layout paint; 
      }

      ::view-transition-old(page) {
        animation: 300ms ease-out both fade-out;
        contain: layout paint; 
      }

      ::view-transition-new(page) {
        animation: 350ms ease-out 50ms both fade-in;
        contain: layout paint; 
      }

      ::view-transition-old(story-*) {
        animation: 300ms ease-out both slide-out;
        contain: layout paint; 
      }

      ::view-transition-new(story-*) {
        animation: 350ms ease-out 50ms both slide-in;
        contain: layout paint; 
      }

      @keyframes fade-out {
        from { opacity: 1; transform: translate3d(0, 0, 0); }
        to { opacity: 0; transform: translate3d(0, 0, 0); }
      }

      @keyframes fade-in {
        from { opacity: 0; transform: translate3d(0, 0, 0); }
        to { opacity: 1; transform: translate3d(0, 0, 0); }
      }

      @keyframes slide-out {
        from { opacity: 1; transform: translate3d(0, 0, 0); }
        to { opacity: 0; transform: translate3d(0, 20px, 0); }
      }

      @keyframes slide-in {
        from { opacity: 0; transform: translate3d(0, 20px, 0); }
        to { opacity: 1; transform: translate3d(0, 0, 0); }
      }

      .new-story-badge {
        position: fixed;
        top: 80px;
        right: 20px;
        background-color: #0084ff;
        color: white;
        padding: 10px 15px;
        border-radius: 25px;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0, 132, 255, 0.3);
        z-index: 1000;
        cursor: pointer;
        animation: slideInFromRight 0.3s ease-out;
      }

      @keyframes slideInFromRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      .new-story-badge:hover {
        background-color: #0056b3;
        transform: scale(1.05);
        transition: all 0.2s ease;
      }
    `;

    const existingStyle = document.getElementById("home-page-custom-style");
    if (!existingStyle) {
      styleElement.id = "home-page-custom-style";
      document.head.appendChild(styleElement);
    }
  }

  async afterRender() {
    console.log("[HomePage] afterRender called");
    this._initializeElements();
    this._ensureMapRenders();
  }

  _initializeElements() {
    this._waitForElementsToRender().then(() => {
      this._storiesContainer = document.getElementById("stories-container");
      this._setupLoadMore();
      this._initMap();
      this._setupLazyLoading();
      this._setupTransitions();

      const stories = this.getStories();
      if (stories && stories.length > 0) {
        console.log(
          `[HomePage] Showing ${stories.length} story locations after initialization`,
        );
        setTimeout(() => {
          if (this._map) {
            this._map.showStoryLocations(stories);
          }
        }, 50);
      }
    });
  }

  _waitForElementsToRender() {
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        const checkElements = () => {
          const storiesContainer = document.getElementById("stories-container");
          const loadMoreBtn = document.getElementById("load-more");
          const storiesMap = document.getElementById("stories-map");

          if (storiesContainer && loadMoreBtn && storiesMap) {
            console.log("[HomePage] All required DOM elements found");
            resolve();
          } else {
            console.log("[HomePage] Waiting for DOM elements...");
            setTimeout(checkElements, 50);
          }
        };

        checkElements();
      });
    });
  }

  _setupEventListeners() {
    window.removeEventListener("hashchange", this._handleHashChange);
    window.addEventListener("hashchange", this._handleHashChange);
  }

  _handleHashChange(event) {
    const newHash = window.location.hash;
    const oldHash = new URL(event.oldURL).hash;
    if (
      (newHash === "#/home" || newHash === "#/") &&
      oldHash !== "#/home" &&
      oldHash !== "#/"
    ) {
      this._reset();
      this._loadStories();
    }
  }

  _setupTransitions() {
    console.log("[HomePage] Setting up transitions (simplified version)");

    document.querySelectorAll('[data-transition="true"]').forEach((link) => {
      if (!link.getAttribute("href").startsWith("#/story/")) {
        link.addEventListener("click", (event) => {
          if (document.startViewTransition) {
            event.preventDefault();
            const href = link.getAttribute("href");

            document.startViewTransition(() => {
              window.location.hash = href;
            });
          }
        });
      }
    });

    const storyItems = document.querySelectorAll(".story-item");
    storyItems.forEach((item) => {
      item.style.cursor = "pointer";

      const imageLinks = item.querySelectorAll(".story-link-container");
      imageLinks.forEach((link) => {
        link.style.display = "block";
        link.style.height = "100%";
      });
    });
  }

  _setupLazyLoading() {
    this._observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target.querySelector("img");
            if (img && img.dataset.src) {
              this._loadImage(img, img.dataset.src);
              this._observer.unobserve(entry.target);
            }
          }
        });
      },
      {
        root: null,
        rootMargin: "0px",
        threshold: 0.1,
      },
    );

    this._applyLazyLoadingToItems();
  }

  _applyLazyLoadingToItems() {
    if (this._observer) {
      const storyItems = document.querySelectorAll(".story-item");
      storyItems.forEach((item) => {
        this._observer.observe(item);
      });
    }
  }

  _loadImage(img, src) {
    img.classList.add("loading");

    const tempImage = new Image();

    tempImage.onload = () => {
      img.src = src;
      img.classList.remove("loading");
      img.classList.add("loaded");

      this._recalculateContainerSize();
    };

    tempImage.onerror = () => {
      img.src = "/path/to/placeholder-image.jpg";
      img.classList.remove("loading");
      img.classList.add("loaded");
    };

    tempImage.src = src;
  }

  _initMap() {
    const mapContainer = document.getElementById("stories-map");
    if (!mapContainer) {
      console.error("[HomePage] Map container not found");
      return;
    }

    this._map = new StoryMap({ mapContainer });
    this._map
      .init()
      .then(() => {
        console.log("[HomePage] Map initialized successfully");

        const stories = this.getStories();
        if (stories && stories.length > 0) {
          console.log(
            `[HomePage] Showing ${stories.length} story locations after map init`,
          );
          this._map.showStoryLocations(stories);
        } else {
          console.log("[HomePage] No stories available yet to show on map");
        }
      })
      .catch((error) => {
        console.error("[HomePage] Error initializing map:", error);
      });
  }

  _ensureMapRenders() {
  }

  _recalculateContainerSize() {
    if (!this._storiesContainer) return;

    void this._storiesContainer.offsetHeight;

    const viewContainer = document.querySelector(".view-container");
    if (viewContainer) {
      const currentHeight = this._storiesContainer.scrollHeight;
      const minimumHeight = Math.max(500, currentHeight + 150);
      viewContainer.style.minHeight = `${minimumHeight}px`;
    }

    this._storiesContainer.style.width = "100%";
  }

  _reset() {
    this._model.stories = [];
    this._storyIds.clear();
    this._currentPage = 1;
    this._isLoading = false;
    this._lastStoriesCount = 0;
    this._lastStoryCheck = null;
  }

  async _loadStories() {
    try {
      if (this._isLoading) {
        return;
      }
      this._isLoading = true;
      this.updateLoadingState(true);
      
      const location = 1;
      const token =
        this._model.isLoggedIn && AuthHelper.getAuth()
          ? AuthHelper.getAuth().token
          : "";
          
      try {
        const response = await getAllStories({
          page: this._currentPage,
          size: 10,
          location,
          token,
        });
        
        if (!response.error) {
          const newStories = this._filterDuplicateStories(response.listStory);
          this._model.stories = [...this._model.stories, ...newStories];
          
          this._cacheStories(this._model.stories);
          
          this.renderStories(this._model.stories, response.fromCache);

          if (this._model.stories.length > 0 && !this._lastStoryCheck) {
            this._lastStoryCheck = this._model.stories[0].createdAt;
          }
          
          if (this._map) {
            this._map.showStoryLocations(this._model.stories);
          }
          
          this.updatePaginationState(response.listStory.length < 10);
        } else {
          this.renderError(
            "Failed to load stories. Please try again later.",
          );
        }
      } catch (error) {
        console.error('Failed to fetch stories:', error);
        
        if (!navigator.onLine) {
          const cachedStories = await this._loadCachedStories();
          if (cachedStories && cachedStories.length > 0) {
            this._model.stories = cachedStories;
            this.renderStories(cachedStories, true);
            this.updatePaginationState(true);
            return;
          }
        }
        
        this.renderError("An error occurred while loading stories.");
      } finally {
        this._isLoading = false;
        this.updateLoadingState(false);
      }
    } catch (error) {
      console.error("Error in _loadStories:", error);
      this.renderError("An error occurred while loading stories.");
      this._isLoading = false;
      this.updateLoadingState(false);
    }
  }

  async _cacheStories(stories) {
    try {
      localStorage.setItem('cached_stories', JSON.stringify(stories));
    } catch (error) {
      console.error('Failed to cache stories:', error);
    }
  }

  async _loadCachedStories() {
    try {
      const cachedData = localStorage.getItem('cached_stories');
      return cachedData ? JSON.parse(cachedData) : [];
    } catch (error) {
      console.error('Failed to load cached stories:', error);
      return [];
    }
  }

  renderStories(stories, isFromCache = false) {
    this._storiesContainer = document.getElementById("stories-container");

    if (!this._storiesContainer) {
      console.error("[HomePage] Stories container not found");
      return;
    }

    const isLoggedIn = this.getIsLoggedIn();

    if (stories.length === 0) {
      this._storiesContainer.innerHTML = `
        <div class="empty-state">
          <p>No stories available. Be the first to share a story!</p>
          ${
            isLoggedIn
              ? `<a href="#/add" class="btn btn-primary" data-transition="true">Add Story</a>`
              : `<a href="#/login" class="btn btn-primary" data-transition="true">Login to Share</a>`
          }
        </div>
      `;
      return;
    }

    if (isFromCache && this._currentPage === 1) {
      const offlineNotice = document.createElement('div');
      offlineNotice.className = 'offline-notice';
      offlineNotice.innerHTML = `
        Menampilkan data dari cache (offline mode). 
        Beberapa fitur mungkin tidak tersedia dalam mode offline.
      `;
      this._storiesContainer.appendChild(offlineNotice);
    }

    const fragment = document.createDocumentFragment();

    const renderedIds = new Set(
      Array.from(this._storiesContainer.querySelectorAll(".story-item")).map(
        (item) => item.dataset.id,
      ),
    );

    stories.forEach((story) => {
      if (!renderedIds.has(story.id)) {
        const storyElement = this._createStoryElement(story);
        fragment.appendChild(storyElement);
      }
    });

    this._storiesContainer.appendChild(fragment);

    setTimeout(() => {
      const newItems = Array.from(
        this._storiesContainer.querySelectorAll(".story-item:not(.fade-in)"),
      );
      newItems.forEach((item, index) => {
        setTimeout(() => {
          item.classList.add("fade-in");
        }, index * 100);
      });
    }, 50);

    this._applyLazyLoadingToItems();
    this._setupTransitions();

    if (this._map) {
      this._map.showStoryLocations(stories);
    }
  }

  _filterDuplicateStories(stories) {
    const newStories = [];
    for (const story of stories) {
      if (this._storyIds.has(story.id)) {
        continue;
      }
      this._storyIds.add(story.id);
      newStories.push(story);
    }
    return newStories;
  }

  handleLoadMoreClick() {
    if (!this._isLoading) {
      this._currentPage += 1;
      this._loadStories();
    }
  }

  renderStories(stories) {
    this._storiesContainer = document.getElementById("stories-container");

    if (!this._storiesContainer) {
      console.error("[HomePage] Stories container not found");
      return;
    }

    const isLoggedIn = this.getIsLoggedIn();

    if (stories.length === 0) {
      this._storiesContainer.innerHTML = `
        <div class="empty-state">
          <p>No stories available. Be the first to share a story!</p>
          ${
            isLoggedIn
              ? `<a href="#/add" class="btn btn-primary" data-transition="true">Add Story</a>`
              : `<a href="#/login" class="btn btn-primary" data-transition="true">Login to Share</a>`
          }
        </div>
      `;
      return;
    }

    if (stories.length <= 10) {
      this._storiesContainer.innerHTML = "";
    }

    const fragment = document.createDocumentFragment();

    const renderedIds = new Set(
      Array.from(this._storiesContainer.querySelectorAll(".story-item")).map(
        (item) => item.dataset.id,
      ),
    );

    stories.forEach((story) => {
      if (!renderedIds.has(story.id)) {
        const storyElement = this._createStoryElement(story);
        fragment.appendChild(storyElement);
      }
    });

    this._storiesContainer.appendChild(fragment);

    setTimeout(() => {
      const newItems = Array.from(
        this._storiesContainer.querySelectorAll(".story-item:not(.fade-in)"),
      );
      newItems.forEach((item, index) => {
        setTimeout(() => {
          item.classList.add("fade-in");
        }, index * 100);
      });
    }, 50);

    this._applyLazyLoadingToItems();

    this._setupTransitions();

    if (this._map) {
      this._map.showStoryLocations(stories);
    }
  }

  _createStoryElement(story) {
    const article = document.createElement("article");
    article.className = "story-item";
    article.dataset.id = story.id;

    const name = story.name || "Anonymous";
    const photoUrl = story.photoUrl || "";
    const description = story.description || "";
    const createdAt = story.createdAt || new Date().toISOString();
    const hasLocation = story.lat && story.lon;

    article.innerHTML = `
      <div class="story-image">
        <a href="#/story/${story.id}">
          <img data-src="${photoUrl}" alt="${name}'s story photo" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E">
        </a>
      </div>
      <div class="story-content">
        <h2><a href="#/story/${story.id}">${name}'s Story</a></h2>
        <p class="story-date">${showFormattedDate(createdAt, CONFIG.DEFAULT_LANGUAGE)}</p>
        <p class="story-description">${description.substring(0, 100)}${description.length > 100 ? "..." : ""}</p>
        ${
          hasLocation
            ? `
          <div class="story-location">
            <i class="fas fa-map-marker-alt"></i> 
            <span>Location available</span>
          </div>
        `
            : ""
        }
      </div>
    `;

    return article;
  }

  _setupLoadMore() {
    const loadMoreBtn = document.getElementById("load-more");

    if (!loadMoreBtn) {
      console.error("[HomePage] Load more button not found during setup");
      return;
    }

    const newLoadMoreBtn = loadMoreBtn.cloneNode(true);
    loadMoreBtn.parentNode.replaceChild(newLoadMoreBtn, loadMoreBtn);

    newLoadMoreBtn.addEventListener("click", () => {
      if (this._isLoading) return;

      this._isLoading = true;
      newLoadMoreBtn.disabled = true;
      newLoadMoreBtn.textContent = "";
      newLoadMoreBtn.classList.add("btn-loading");

      const currentHeight = this._storiesContainer.scrollHeight;
      this._storiesContainer.style.minHeight = `${currentHeight}px`;

      this.handleLoadMoreClick();
    });
  }

  updatePaginationState(isLastPage) {
    const loadMoreBtn = document.getElementById("load-more");

    if (!loadMoreBtn) {
      console.error("[HomePage] Load more button not found");
      return;
    }

    if (isLastPage) {
      loadMoreBtn.disabled = true;
      loadMoreBtn.textContent = "No More Stories";
      loadMoreBtn.classList.remove("btn-loading");
    } else {
      loadMoreBtn.disabled = false;
      loadMoreBtn.textContent = "Load More";
      loadMoreBtn.classList.remove("btn-loading");
    }

    this._isLoading = false;

    this._recalculateContainerSize();
  }

  updateLoadingState(isLoading) {
    const loadMoreBtn = document.getElementById("load-more");

    if (!loadMoreBtn) {
      console.error("[HomePage] Load more button not found");
      return;
    }

    if (isLoading) {
      loadMoreBtn.disabled = true;
      loadMoreBtn.textContent = "";
      loadMoreBtn.classList.add("btn-loading");
    } else {
      loadMoreBtn.disabled = false;
      loadMoreBtn.textContent = "Load More";
      loadMoreBtn.classList.remove("btn-loading");
      this._isLoading = false;

      setTimeout(() => this._recalculateContainerSize(), 100);
    }
  }

  renderError(message) {
    this._storiesContainer = document.getElementById("stories-container");

    if (!this._storiesContainer) {
      console.error(
        "[HomePage] Stories container not found when rendering error",
      );
      return;
    }

    this._storiesContainer.innerHTML = `
      <div class="error-state">
        <p>${message}</p>
        <button class="btn btn-secondary" id="retry-btn">Retry</button>
      </div>
    `;

    const retryBtn = document.getElementById("retry-btn");
    if (retryBtn) {
      retryBtn.addEventListener("click", () => {
        window.location.reload();
      });
    } else {
      console.error(
        "[HomePage] Retry button not found after rendering error state",
      );
    }
  }

  getMap() {
    return this._map;
  }

  getIsLoggedIn() {
    return this._model.isLoggedIn;
  }

  getStories() {
    return this._model.stories;
  }

  destroy() {
    console.log("[HomePage] Destroy called");

    if (this._newStoryInterval) {
      clearInterval(this._newStoryInterval);
      this._newStoryInterval = null;
    }

    window.removeEventListener("hashchange", this._handleHashChange);
    
    const customStyle = document.getElementById("home-page-custom-style");
    if (customStyle) {
      customStyle.remove();
    }

    if (this._map) {
      this._map.destroy();
      this._map = null;
    }

    if (this._observer) {
      this._observer.disconnect();
      this._observer = null;
    }

    this._storiesContainer = null;
    this._model.stories = [];
    this._storyIds.clear();
  }
}

export default HomePage;