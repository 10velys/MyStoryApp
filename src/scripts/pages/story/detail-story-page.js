import { parseActivePathname } from "../../routes/url-parser";
import { showFormattedDate } from "../../utils/index";
import CONFIG from "../../config";
import DetailStoryPresenter from "./DetailStoryPresenter";

class DetailStoryPage {
  constructor() {
    this._presenter = new DetailStoryPresenter(this);
    this._mapContainer = null;
  }

  ensureMapLibrary() {
    return new Promise((resolve, reject) => {
      if (window.L && typeof window.L.map === "function") {
        console.log("[DetailStoryPage] Leaflet already loaded");
        resolve(true);
        return;
      }

      console.log("[DetailStoryPage] Loading Leaflet library");

      if (!document.getElementById("leaflet-css")) {
        const cssLink = document.createElement("link");
        cssLink.id = "leaflet-css";
        cssLink.rel = "stylesheet";
        cssLink.href = "https://unpkg.com/leaflet@1.7.1/dist/leaflet.css";
        cssLink.integrity =
          "sha512-xodZBNTC5n17Xt2atTPuE1HxjVMSvLVW9ocqUKLsCC5CXdbqCmblAshOMAS6/keqq/sMZMZ19scR4PsZChSR7A==";
        cssLink.crossOrigin = "";
        document.head.appendChild(cssLink);
      }

      if (!document.getElementById("leaflet-js")) {
        const script = document.createElement("script");
        script.id = "leaflet-js";
        script.src = "https://unpkg.com/leaflet@1.7.1/dist/leaflet.js";
        script.integrity =
          "sha512-XQoYMqMTK8LvdxXYG3nZ448hOEQiglfqkJs1NOQV44cWnUrBc8PkAOcXy20w0vlaXaVUearIOBhiXZ5V3ynxwA==";
        script.crossOrigin = "";

        script.onload = () => {
          console.log("[DetailStoryPage] Leaflet library loaded successfully");
          resolve(true);
        };

        script.onerror = (error) => {
          console.error("[DetailStoryPage] Failed to load Leaflet:", error);
          reject(error);
        };

        document.head.appendChild(script);
      }
    });
  }

  async render() {
    return `
      <section class="container detail-story-page">
        <div class="page-header">
          <a href="#/home" class="back-button" aria-label="Back to home page">
            <i class="fas fa-arrow-left"></i> Back
          </a>
          
          <div class="story-actions">
            <button id="bookmark-btn" class="bookmark-btn" aria-label="Bookmark this story">
              <i class="fas fa-bookmark"></i>
              <span class="bookmark-text">Bookmark</span>
            </button>
          </div>
        </div>
        
        <div id="story-container" class="story-detail">
          <div class="loading-indicator">Loading story details...</div>
        </div>
        
        <div id="map-container" class="map-container" style="display: none; background-color: #fff; border-radius: 10px; margin: 30px auto; box-shadow: 0 2px 10px rgba(0,0,0,0.1); padding: 20px; max-width: 100%; box-sizing: border-box;">
          <h2 style="margin: 0 0 15px; font-size: 24px; font-weight: 600; color: #333;">Story Location</h2>
          <div id="story-location-address" style="margin-bottom: 15px; display: flex; align-items: flex-start;">
            <i class="fas fa-map-marker-alt" style="margin-right: 10px; color: #d9534f; font-size: 18px; margin-top: 3px;"></i> 
            <span id="location-address-text" style="font-size: 16px; color: #333;">Loading location details...</span>
          </div>
          <div id="story-map-wrapper" style="width: 100%; height: 400px; box-sizing: border-box; position: relative;">
            <div id="story-map" style="height: 100%; width: 100%; border-radius: 8px; overflow: hidden; position: relative; background-color: #f5f5f5;"></div>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    const pathname = window.location.hash.slice(1);
    const id = pathname.split("/")[2];

    console.log("[DetailStoryPage] Story ID from URL:", id);

    if (!id) {
      this.renderError("Story ID not found.");
      return;
    }

    this.addMapStyles();
    this._addDetailPageStyles();

    try {
      await this.ensureMapLibrary();
      console.log("[DetailStoryPage] Leaflet library loaded successfully");
    } catch (error) {
      console.error("[DetailStoryPage] Failed to load Leaflet library:", error);
    }

    setTimeout(() => {
      this._presenter.init(id);
    }, 100);
  }
  
  _addDetailPageStyles() {
    const style = document.createElement('style');
    style.id = 'detail-story-styles';
    style.textContent = `
      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 30px;
        padding-bottom: 20px;
        border-bottom: 2px solid #f0f0f0;
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

      .story-actions {
        display: flex;
        gap: 10px;
      }

      .bookmark-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        background: #fff;
        border: 2px solid #4A6572;
        color: #4A6572;
        padding: 10px 16px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.3s ease;
      }

      .bookmark-btn:hover {
        background: #4A6572;
        color: white;
      }

      .bookmark-btn.bookmarked {
        background: #ffc107;
        border-color: #ffc107;
        color: #212529;
      }

      .bookmark-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .toast {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 6px;
        color: white;
        z-index: 10000;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
      }

      .toast.show {
        opacity: 1;
        transform: translateX(0);
      }

      .toast-success {
        background: #28a745;
      }

      .toast-error {
        background: #dc3545;
      }

      @media (max-width: 768px) {
        .page-header {
          flex-direction: column;
          align-items: flex-start;
          gap: 15px;
        }

        .story-actions {
          width: 100%;
          justify-content: flex-end;
        }
      }
    `;
    
    if (!document.getElementById('detail-story-styles')) {
      document.head.appendChild(style);
    }
  }
  
  addMapStyles() {
    const mapStyles = document.createElement("style");
    mapStyles.textContent = `
      .map-container {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        max-width: 800px !important;
        margin: 30px auto !important;
        height: auto !important; 
        min-height: 450px !important;
        overflow: visible !important;
      }
      #story-map {
        height: 400px !important;
        width: 100% !important;
        position: relative !important;
        z-index: 1 !important;
        visibility: visible !important;
        display: block !important;
        overflow: hidden !important;
      }
      #story-map-wrapper {
        height: 400px !important;
        width: 100% !important;
        position: relative !important;
        overflow: visible !important;
      }
      .leaflet-container {
        height: 100% !important;
        width: 100% !important;
        z-index: 1 !important;
      }
      .leaflet-pane {
        z-index: 1 !important;
      }
      .leaflet-tile-pane {
        z-index: 1 !important;
      }
      .leaflet-tile {
        visibility: visible !important;
      }
      .leaflet-control-container {
        z-index: 10 !important;
      }
      .container.detail-story-page {
        overflow: visible !important;
      }
      .leaflet-popup-content-wrapper {
        background: white !important;
        color: #333 !important;
        box-shadow: 0 3px 14px rgba(0,0,0,0.4) !important;
        border-radius: 8px !important;
        border: none !important;
      }
      .leaflet-popup-content {
        margin: 0 !important;
        padding: 0 !important;
      }
      .leaflet-popup-tip {
        background: white !important;
        box-shadow: 0 3px 14px rgba(0,0,0,0.4) !important;
      }
      .leaflet-popup {
        z-index: 1000 !important;
        position: absolute !important;
      }
      .leaflet-pane.leaflet-popup-pane {
        z-index: 700 !important;
      }
      .leaflet-pane.leaflet-marker-pane {
        z-index: 600 !important;
      }
    `;
    document.head.appendChild(mapStyles);
  }

  renderStoryDetail(story) {
    const storyContainer = document.getElementById("story-container");

    storyContainer.innerHTML = `
      <article class="story-content" style="max-width: 100%; overflow: hidden;">
        <h1 style="margin: 20px 0 10px; font-size: 28px; color: #333; line-height: 1.3;">${story.name}'s Story</h1>
        <p class="story-date" style="margin: 0 0 20px; color: #666; font-size: 16px;">${showFormattedDate(story.createdAt, CONFIG.DEFAULT_LANGUAGE)}</p>
        
        <figure class="story-image-container" style="margin: 0 0 25px; padding: 0; text-align: center;">
          <div style="width: 100%; max-width: 800px; margin: 0 auto; overflow: hidden; position: relative; border-radius: 10px; background-color: #f5f5f5; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <img src="${story.photoUrl}" alt="${story.name}'s story photo" class="story-image" style="width: 100%; height: auto; max-height: 600px; object-fit: contain; display: block; margin: 0 auto;">
          </div>
          <figcaption style="margin-top: 10px; font-size: 14px; color: #666; text-align: center;">Photo by ${story.name}</figcaption>
        </figure>
        
        <div class="story-description" style="margin: 0 0 25px; line-height: 1.6; font-size: 16px; color: #333;">
          <p>${story.description}</p>
        </div>
        
        ${
          story.lat && story.lon
            ? `
          <div class="story-location-info" style="display: flex; align-items: flex-start; margin-bottom: 20px; padding: 12px 15px; background-color: #f9f9f9; border-radius: 8px; border-left: 4px solid #4CAF50;">
            <i class="fas fa-map-marker-alt" style="margin-right: 10px; color: #4CAF50; font-size: 18px; margin-top: 2px;"></i> 
            <span style="flex: 1; font-size: 15px;">This story has location information.</span>
          </div>
        `
            : ""
        }
      </article>
    `;
  }

  updateBookmarkButton(isBookmarked) {
    const bookmarkBtn = document.getElementById('bookmark-btn');
    const bookmarkText = bookmarkBtn.querySelector('.bookmark-text');
    const bookmarkIcon = bookmarkBtn.querySelector('i');
    
    if (isBookmarked) {
      bookmarkBtn.classList.add('bookmarked');
      bookmarkText.textContent = 'Bookmarked';
      bookmarkIcon.className = 'fas fa-bookmark';
    } else {
      bookmarkBtn.classList.remove('bookmarked');
      bookmarkText.textContent = 'Bookmark';
      bookmarkIcon.className = 'far fa-bookmark';
    }
  }

  setBookmarkLoading(loading) {
    const bookmarkBtn = document.getElementById('bookmark-btn');
    bookmarkBtn.disabled = loading;
    
    if (loading) {
      bookmarkBtn.querySelector('.bookmark-text').textContent = 'Loading...';
    }
  }

  showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 3000);
  }

  setupBookmarkButton(story, isBookmarked) {
    const bookmarkBtn = document.getElementById('bookmark-btn');
    this.updateBookmarkButton(isBookmarked);
    
    bookmarkBtn.addEventListener('click', () => {
      this._presenter.toggleBookmark(story);
    });
  }

  showMapContainer() {
    const mapContainer = document.getElementById("map-container");
    if (mapContainer) {
      mapContainer.style.display = "block";
      mapContainer.style.visibility = "visible";
      mapContainer.style.opacity = "1";
    }
  }

  updateLocationAddressUI(locationAddress) {
    const addressElement = document.getElementById("location-address-text");
    if (addressElement) {
      if (!locationAddress || locationAddress === "Lokasi tidak diketahui") {
        addressElement.innerHTML = `
          <span style="color: #777;">Lokasi tidak diketahui</span>
        `;
      } else {
        addressElement.innerHTML = `
          <span style="color: #333; font-weight: 500;">${locationAddress}</span>
        `;
      }
    }
  }

  showLoadingAddress() {
    const addressElement = document.getElementById("location-address-text");
    if (addressElement) {
      addressElement.innerHTML =
        '<span style="display: inline-block; margin-right: 5px;">Sedang mencari lokasi...</span> <div class="spinner" style="display: inline-block; width: 12px; height: 12px; border: 2px solid rgba(0, 0, 0, 0.1); border-top-color: #d9534f; border-radius: 50%; animation: spin 1s linear infinite;"></div>';
    }

    const styleEl = document.createElement("style");
    styleEl.textContent = `
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(styleEl);
  }

  getMapContainer() {
    return document.getElementById("story-map");
  }

  renderError(message) {
    const storyContainer = document.getElementById("story-container");

    storyContainer.innerHTML = `
      <div class="error-state">
        <h2>Error</h2>
        <p>${message}</p>
        <a href="#/" class="btn btn-primary">Back to Home</a>
      </div>
    `;

    document.getElementById("map-container").style.display = "none";
  }

  configureMapContainer() {
    const mapContainer = this.getMapContainer();

    if (!mapContainer) {
      console.error("[DetailStoryPage] Map container element not found");
      return null;
    }

    mapContainer.style.height = "400px";
    mapContainer.style.width = "100%";
    mapContainer.style.borderRadius = "8px";
    mapContainer.style.overflow = "hidden";
    mapContainer.style.position = "relative";
    mapContainer.style.backgroundColor = "#f5f5f5";
    mapContainer.style.boxShadow = "0 2px 5px rgba(0,0,0,0.1)";
    mapContainer.style.display = "block";
    mapContainer.style.visibility = "visible";
    mapContainer.style.zIndex = "1";

    const uniqueId = "detail-story-map-" + Date.now();
    mapContainer.id = uniqueId;

    const mapContainerParent = document.getElementById("map-container");
    if (mapContainerParent) {
      mapContainerParent.style.display = "block";
      mapContainerParent.style.visibility = "visible";
      mapContainerParent.style.opacity = "1";
      mapContainerParent.style.height = "auto";
      mapContainerParent.style.overflow = "visible";
    }

    mapContainer.innerHTML = "";

    const mapStyle = document.createElement("style");
    mapStyle.textContent = `
      #${uniqueId} {
        z-index: 1;
        position: relative !important;
        display: block !important;
        visibility: visible !important;
        height: 400px !important;
        width: 100% !important;
      }
      #${uniqueId} .leaflet-tile-pane {
        z-index: 5 !important;
      }
      #${uniqueId} .leaflet-tile {
        visibility: visible !important;
      }
      .leaflet-container {
        background-color: #f5f5f5 !important;
        z-index: 1 !important;
        height: 100% !important;
        width: 100% !important;
      }
      .leaflet-popup-content-wrapper, 
      .leaflet-popup-tip {
        background: white !important;
        box-shadow: 0 3px 14px rgba(0,0,0,0.4) !important;
      }
      .leaflet-popup {
        z-index: 1000 !important;
      }
      .leaflet-popup-content {
        margin: 0 !important;
        width: auto !important;
      }
      .leaflet-control-container {
        z-index: 10 !important;
      }
      #map-container {
        overflow: visible !important;
        height: auto !important;
        min-height: 450px !important;
      }
      #story-map-wrapper {
        position: relative !important;
        overflow: visible !important;
        z-index: 1;
      }
      .leaflet-pane.leaflet-popup-pane {
        z-index: 700 !important;
      }
    `;
    document.head.appendChild(mapStyle);

    console.log(
      "[DetailStoryPage] Map container configured with ID:",
      uniqueId,
    );
    return uniqueId;
  }

  prepareMapContainer() {
    const uniqueMapId = this.configureMapContainer();
    const mapContainer = document.getElementById(uniqueMapId);

    if (!mapContainer) {
      return null;
    }

    mapContainer.style.height = "400px";
    mapContainer.style.width = "100%";
    mapContainer.style.display = "block";
    mapContainer.style.visibility = "visible";
    mapContainer.style.position = "relative";
    mapContainer.style.zIndex = "1";

    mapContainer.innerHTML = "";

    return mapContainer;
  }
  
  createTemporaryMapContainer() {
    return document.createElement("div");
  }
  
  createTimeoutPromise(milliseconds, errorMessage) {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), milliseconds)
    );
  }

  initMapWithDelay(lat, lon) {
    setTimeout(async () => {
      await this._initMap(lat, lon);
    }, 800);
  }

  async _initMap(lat, lon) {
    console.log("[DetailStoryPage] Starting map initialization");

    try {
      await this.ensureMapLibrary();
      const mapContainer = this.prepareMapContainer();

      if (!mapContainer) {
        console.error(
          "[DetailStoryPage] Map container not found after configuration",
        );
        this.showMapError();
        return false;
      }

      console.log("[DetailStoryPage] Map container found:", mapContainer);

      await new Promise((resolve) => setTimeout(resolve, 100));

      if (!window.L) {
        console.error("[DetailStoryPage] Leaflet library not available");
        this.showMapError();
        return false;
      }

      try {
        console.log("[DetailStoryPage] Creating map with Leaflet");
        console.log(
          "[DetailStoryPage] Coordinates:",
          lat,
          lon,
        );

        const mapOptions = {
          center: [lat, lon],
          zoom: 15,
          zoomControl: true
        };
        
        const tileLayerOptions = {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        };
        
        const popupOptions = {
          maxWidth: 280,
          minWidth: 250,
          className: "custom-map-popup",
          offset: [0, -5],
          autoPan: true,
          autoPanPadding: [50, 50],
        };
        
        const story = this._presenter.getStoryData();
        const locationText = this._presenter.getLocationAddress() || "Mencari lokasi...";
        const popupData = {
          name: story.name,
          photoUrl: story.photoUrl,
          locationAddress: locationText,
        };

        const mapResult = this.createMap(
          mapContainer, 
          mapOptions,
          tileLayerOptions,
          [lat, lon],
          popupData,
          popupOptions
        );

        this._presenter.setMap(mapResult.map);

        console.log("[DetailStoryPage] Map initialized successfully");
        return true;
      } catch (innerError) {
        console.error(
          "[DetailStoryPage] Error creating Leaflet map:",
          innerError,
        );
        this.showMapError();
        return false;
      }
    } catch (error) {
      console.error("[DetailStoryPage] Error initializing map:", error);
      this.showMapError();
      return false;
    }
  }
  
  createMap(mapContainer, mapOptions, tileLayerOptions, markerPosition, popupData, popupOptions) {
    console.log("[DetailStoryPage] Creating map with Leaflet");
    
    const map = L.map(mapContainer, mapOptions);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", tileLayerOptions).addTo(map);

    this.addMapPopupStyles();
    
    const marker = L.marker(markerPosition).addTo(map);
    
    const popupContent = this.createPopupContent(popupData);
    
    marker.bindPopup(popupContent, popupOptions).openPopup();

    this.refreshMapWithTimeout(map, markerPosition, marker);

    const mapObject = {
      _map: map,
      _markers: [marker],
      _mapInitialized: true,
      destroy: () => {
        if (map) {
          map.remove();
        }
      },
    };

    return { map: mapObject };
  }
  
  refreshMapWithTimeout(map, markerPosition, marker) {
    setTimeout(() => {
      map.invalidateSize(true);
      map.setView(markerPosition, 15);
      marker.openPopup();
    }, 300);

    [500, 1000, 1500].forEach((timeout) => {
      setTimeout(() => {
        if (map) {
          map.invalidateSize(true);
          if (!marker.isPopupOpen()) {
            marker.openPopup();
          }
        }
      }, timeout);
    });
  }

  updateMapPopup(marker, popupData) {
    const popupContent = this.createPopupContent(popupData);
    marker.getPopup().setContent(popupContent);
  }
  
  openMarkerPopupAndAdjustView(marker) {
    if (!marker.isPopupOpen()) {
      marker.openPopup();

      setTimeout(() => {
        if (this._presenter._map && this._presenter._map._map) {
          this._presenter._map._map.panBy([0, -50], { duration: 0.1 });
        }
      }, 100);
    }
  }

  createPopupContent(data) {
    return `
      <div class="map-popup">
        <h3 style="margin: 0 0 8px; font-size: 16px; font-weight: 600; color: #333; line-height: 1.3;">${data.name}</h3>
        <img src="${data.photoUrl}" alt="${data.name}" style="width: 100%; max-height: 130px; object-fit: cover; margin: 8px 0; border-radius: 6px;">
        <p style="margin: 8px 0 0; font-size: 14px; color: #333; display: flex; align-items: flex-start;">
          <i class="fas fa-map-marker-alt" style="margin-right: 6px; color: #d9534f; font-size: 14px; margin-top: 2px;"></i>
          <span style="flex: 1;">${data.locationAddress}</span>
        </p>
      </div>
    `;
  }

  addMapPopupStyles() {
    if (!document.getElementById("custom-leaflet-popup-styles")) {
      const popupStyles = document.createElement("style");
      popupStyles.id = "custom-leaflet-popup-styles";
      popupStyles.textContent = `
        .leaflet-popup {
          z-index: 1000 !important;
        }
        .leaflet-popup-content-wrapper {
          background: white;
          box-shadow: 0 3px 14px rgba(0,0,0,0.4);
          border-radius: 8px;
          padding: 0;
          overflow: hidden;
        }
        .leaflet-popup-content {
          margin: 0;
          padding: 0;
          width: 100% !important;
        }
        .leaflet-popup-tip {
          background: white;
          box-shadow: 0 3px 14px rgba(0,0,0,0.4);
        }
        .map-popup {
          padding: 12px;
        }
        .map-popup img {
          display: block;
          width: 100%;
          max-height: 120px;
          object-fit: cover;
          margin: 8px 0;
          border-radius: 4px;
        }
      `;
      document.head.appendChild(popupStyles);
    }
  }

  showMapError() {
    const mapContainer = this.getMapContainer();
    if (mapContainer) {
      mapContainer.innerHTML =
        '<div style="padding: 20px; text-align: center; height: 100%; display: flex; align-items: center; justify-content: center; background-color: #f8f8f8;"><p style="color: #d9534f; font-size: 16px;"><i class="fas fa-exclamation-triangle" style="margin-right: 8px;"></i>Failed to load the map. Please try again later.</p></div>';
    }
  }

  destroy() {
    const detailStyles = document.getElementById('detail-story-styles');
    if (detailStyles) {
      detailStyles.remove();
    }
  }
}

export default DetailStoryPage;