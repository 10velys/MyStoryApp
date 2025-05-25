import CONFIG from "../config";

class StoryMap {
  constructor({
    mapContainer,
    latitude = -6.2088,
    longitude = 106.8456,
    isInteractive = true,
    defaultZoom = 5,
  }) {
    this._mapContainer = mapContainer;
    this._map = null;
    this._markers = [];
    this._latitude = latitude;
    this._longitude = longitude;
    this._selectedLocation = null;
    this._locationSelectedCallback = null;
    this._isInteractive = isInteractive;
    this._mapInitialized = false;
    this._resizeObserver = null;
    this._defaultZoom = defaultZoom;
    this._basemapLayers = {};
    this._currentBasemap = null;
    this._worldBounds = null;
    this._clickEnabled = true;

    this._addTransitionStyles();
  }

  _addTransitionStyles() {
    if (document.getElementById("storymap-transition-styles")) {
      return;
    }

    const styleElement = document.createElement("style");
    styleElement.id = "storymap-transition-styles";

    styleElement.textContent = `
      /* Animasi transisi untuk peta */
      @keyframes map-fade-in {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
      }
      
      @keyframes map-slide-up {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      
      /* Fallback animasi untuk browser tanpa View Transition API */
      .leaflet-container {
        animation: map-fade-in 0.5s ease-out;
      }
      
      /* Style khusus untuk marker dengan efek muncul bertahap */
      .leaflet-marker-icon {
        transition: transform 0.3s ease-out, opacity 0.3s ease-out;
        animation: map-slide-up 0.5s ease-out backwards;
      }
      
      /* Animasi hover marker */
      .leaflet-marker-icon:hover {
        transform: translateY(-2px);
      }
      
      /* Popup dengan animasi dan style yang lebih baik */
      .leaflet-popup {
        animation: map-slide-up 0.3s ease-out;
      }
      
      .custom-popup .leaflet-popup-content-wrapper {
        border-radius: 10px;
        box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
        overflow: hidden;
      }
      
      .custom-popup .leaflet-popup-content {
        margin: 0;
        padding: 0;
      }
      
      .map-popup {
        padding: 15px;
      }
      
      .map-popup h3 {
        margin-top: 0;
        margin-bottom: 10px;
        color: #0084ff;
        font-size: 16px;
      }
      
      .map-popup img {
        border-radius: 8px;
        margin: 10px 0;
        max-width: 100%;
        transition: transform 0.3s ease;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      
      .map-popup img:hover {
        transform: scale(1.03);
      }
      
      .map-popup p {
        margin: 8px 0;
        font-size: 14px;
        line-height: 1.4;
      }
      
      .map-popup .location-name {
        font-size: 12px;
        color: #666;
        display: flex;
        align-items: center;
        margin-top: 8px;
      }
      
      .map-popup .location-name:before {
        content: '';
        display: inline-block;
        width: 12px;
        height: 12px;
        background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path fill="%23666" d="M215.7 499.2C267 435 384 279.4 384 192C384 86 298 0 192 0S0 86 0 192c0 87.4 117 243 168.3 307.2c12.3 15.3 35.1 15.3 47.4 0zM192 128a64 64 0 1 1 0 128 64 64 0 1 1 0-128z"/></svg>');
        background-size: contain;
        background-repeat: no-repeat;
        margin-right: 5px;
      }
      
      .map-popup .view-story-link {
        display: inline-block;
        padding: 8px 15px;
        background-color: #0084ff;
        color: white;
        text-decoration: none;
        border-radius: 4px;
        margin-top: 10px;
        font-weight: bold;
        transition: background-color 0.3s, transform 0.2s;
      }
      
      .map-popup .view-story-link:hover {
        background-color: #006dce;
        transform: translateY(-2px);
      }
      
      /* View Transition API specific styles */
      @supports (view-transition-name: none) {
        /* Set view transition names for map components */
        .leaflet-container {
          view-transition-name: story-map;
        }
        
        .leaflet-marker-icon {
          view-transition-name: map-marker;
        }
        
        .leaflet-popup {
          view-transition-name: map-popup;
        }
        
        /* View Transition animations for smooth page changes */
        ::view-transition-old(story-map) {
          animation: 0.5s ease-out fade-out both;
        }
        
        ::view-transition-new(story-map) {
          animation: 0.5s ease-out fade-in both;
        }
        
        /* Custom transition animations */
        @keyframes fade-out {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      }
      
      /* Transisi tambahan untuk status hover pada marker */
      .animated-marker {
        transition: transform 0.3s ease;
      }
      
      .animated-marker:hover {
        transform: scale(1.1) translateY(-2px);
      }
      
      /* Error state dengan transisi */
      .map-error {
        animation: map-fade-in 0.5s ease-out;
        transition: all 0.3s ease;
      }

      /* Simple marker styles */
      .simple-marker {
        background-color: #dc3545;
        border: 2px solid white;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      }

      .simple-marker:hover {
        transform: scale(1.2);
        background-color: #c82333;
      }
    `;

    document.head.appendChild(styleElement);
  }

  async init() {
    try {
      this._mapContainer.style.height = "500px";
      this._mapContainer.style.width = "100%";
      this._mapContainer.style.overflow = "hidden";

      if ("startViewTransition" in document) {
        this._mapContainer.style.viewTransitionName = "story-map-container";
      }

      if (typeof L === "undefined") {
        await this._loadLeaflet();
      }

      await new Promise((resolve) => setTimeout(resolve, 100));

      this._worldBounds = [
        [-90, -180],
        [90, 180],
      ];

      this._map = L.map(this._mapContainer, {
        dragging: this._isInteractive,
        touchZoom: this._isInteractive,
        scrollWheelZoom: this._isInteractive,
        doubleClickZoom: this._isInteractive,
        boxZoom: this._isInteractive,
        tap: this._isInteractive,
        keyboard: this._isInteractive,
        zoomControl: this._isInteractive,
        attributionControl: false,
        maxBoundsViscosity: 1.0,
        maxBounds: this._worldBounds,
        minZoom: 2,
        worldCopyJump: true,
      }).setView([this._latitude, this._longitude], this._defaultZoom);

      this._setupBasemapLayers();

      L.control
        .attribution({
          position: "bottomright",
        })
        .addTo(this._map);

      if (this._isInteractive) {
        L.control
          .zoom({
            position: "bottomright",
            zoomInTitle: "Zoom In",
            zoomOutTitle: "Zoom Out",
          })
          .addTo(this._map);

        L.control
          .layers(this._basemapLayers, null, {
            position: "topright",
            collapsed: true,
          })
          .addTo(this._map);
      }

      if (this._isInteractive) {
        this._map.on("click", (e) => {
          if (this._clickEnabled) {
            const { lat, lng } = e.latlng;

            if ("startViewTransition" in document) {
              document.startViewTransition(() => {
                this._handleMapClick(lat, lng);
              });
            } else {
              this._handleMapClick(lat, lng);
            }
          }
        });
      }

      this._map.on("resize", () => {
        this._preventEmptyTiles();
      });

      this._map.on("moveend", () => {
        this._preventEmptyTiles();
      });

      this._map.on("zoomend", () => {
        this._preventEmptyTiles();
      });

      this._setupResizeObserver();

      this._scheduleMapUpdate();

      this._mapInitialized = true;
      return true;
    } catch (error) {
      console.error("Error initializing map:", error);
      this._showMapError();
      return false;
    }
  }

  _preventEmptyTiles() {
    if (!this._map) return;

    const currentBounds = this._map.getBounds();
    const currentZoom = this._map.getZoom();
    const currentCenter = this._map.getCenter();

    if (currentZoom < 2) {
      this._map.setZoom(2);
    }

    if (
      !this._worldBounds[0][0] <= currentBounds.getSouth() &&
      !this._worldBounds[1][0] >= currentBounds.getNorth() &&
      !this._worldBounds[0][1] <= currentBounds.getWest() &&
      !this._worldBounds[1][1] >= currentBounds.getEast()
    ) {
      let newLat = currentCenter.lat;
      let newLng = currentCenter.lng;

      if (currentCenter.lat > 85) newLat = 85;
      if (currentCenter.lat < -85) newLat = -85;

      newLng = ((newLng + 180) % 360) - 180;

      if (newLat !== currentCenter.lat || newLng !== currentCenter.lng) {
        this._map.setView([newLat, newLng], currentZoom, { animate: false });
      }
    }
  }

  _setupBasemapLayers() {
    this._basemapLayers["OpenStreetMap"] = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        noWrap: false,
        bounds: [
          [-90, -180],
          [90, 180],
        ],
      },
    ).addTo(this._map);

    this._currentBasemap = this._basemapLayers["OpenStreetMap"];

    this._basemapLayers["OSM Humanitarian"] = L.tileLayer(
      "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/">HOT</a>',
        noWrap: false,
        bounds: [
          [-90, -180],
          [90, 180],
        ],
      },
    );

    this._basemapLayers["Satellite"] = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        attribution:
          "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
        noWrap: false,
        bounds: [
          [-90, -180],
          [90, 180],
        ],
      },
    );

    this._basemapLayers["Carto Voyager"] = L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        noWrap: false,
        bounds: [
          [-90, -180],
          [90, 180],
        ],
      },
    );
  }

  _setupResizeObserver() {
    if ("ResizeObserver" in window) {
      this._resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.target === this._mapContainer && this._map) {
            if ("startViewTransition" in document) {
              document.startViewTransition(() => {
                this._map.invalidateSize();
                this._preventEmptyTiles();
              });
            } else {
              this._map.invalidateSize();
              this._preventEmptyTiles();
            }
          }
        }
      });
      this._resizeObserver.observe(this._mapContainer);
    }
  }

  _scheduleMapUpdate() {
    const updateIntervals = [100, 300, 500, 1000, 2000];

    updateIntervals.forEach((delay) => {
      setTimeout(() => {
        if (this._map && this._mapContainer.offsetParent !== null) {
          this._map.invalidateSize({
            animate: false,
            pan: false,
          });
          this._preventEmptyTiles();
        }
      }, delay);
    });

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible" && this._map) {
        setTimeout(() => {
          this._map.invalidateSize();
          this._preventEmptyTiles();
        }, 300);
      }
    });
  }

  async _loadLeaflet() {
    return new Promise((resolve, reject) => {
      const linkElement = document.createElement("link");
      linkElement.rel = "stylesheet";
      linkElement.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(linkElement);

      const scriptElement = document.createElement("script");
      scriptElement.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

      scriptElement.onload = () => {
        console.log("Leaflet loaded successfully");
        resolve();
      };

      scriptElement.onerror = () => {
        console.error("Failed to load Leaflet");
        reject(new Error("Failed to load Leaflet"));
      };

      document.head.appendChild(scriptElement);
    });
  }

  _showMapError() {
    this._mapContainer.innerHTML = `
      <div class="map-error">
        <p>Maaf, kami tidak dapat memuat peta. Silakan periksa koneksi internet Anda atau coba lagi nanti.</p>
      </div>
    `;
    this._mapContainer.style.height = "200px";
    this._mapContainer.style.display = "flex";
    this._mapContainer.style.alignItems = "center";
    this._mapContainer.style.justifyContent = "center";
    this._mapContainer.style.textAlign = "center";
    this._mapContainer.style.background = "#f0f0f0";
    this._mapContainer.style.border = "1px solid #ddd";
    this._mapContainer.style.borderRadius = "8px";
    this._mapContainer.style.padding = "20px";
  }

  _handleMapClick(lat, lng) {
    this._selectedLocation = { latitude: lat, longitude: lng };

    if (this._locationSelectedCallback) {
      this._locationSelectedCallback(this._selectedLocation);
    }
  }

  setLocationSelectedCallback(callback) {
    this._locationSelectedCallback = callback;
  }

  enableMapClick(enable = true) {
    this._clickEnabled = enable;
  }

  changeBasemap(name) {
    if (!this._map || !this._basemapLayers[name]) return;

    if ("startViewTransition" in document) {
      document.startViewTransition(() => {
        if (this._currentBasemap) {
          this._map.removeLayer(this._currentBasemap);
        }

        this._map.addLayer(this._basemapLayers[name]);
        this._currentBasemap = this._basemapLayers[name];
      });
    } else {
      if (this._currentBasemap) {
        this._map.removeLayer(this._currentBasemap);
      }

      this._map.addLayer(this._basemapLayers[name]);
      this._currentBasemap = this._basemapLayers[name];
    }
  }

  // Simplified marker creation - no external dependencies
  _createSimpleIcon(color = '#dc3545') {
    return L.divIcon({
      html: `<div style="
        background-color: ${color};
        border: 2px solid white;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        position: relative;
        transform: translate(-50%, -50%);
      "></div>`,
      className: 'simple-marker',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
      popupAnchor: [0, -10]
    });
  }

  addMarker(latitude, longitude, popupContent = "", options = {}) {
    if (!this._map) return null;

    // Use simple div icon instead of image-based icon
    const defaultIcon = this._createSimpleIcon(options.color);

    const markerOptions = {
      draggable: false,
      icon: defaultIcon,
      ...options,
    };

    const isAddStoryMode = window.location.hash.includes("#/add");
    if (!isAddStoryMode) {
      markerOptions.draggable = false;
    }

    const marker = L.marker([latitude, longitude], markerOptions);

    marker.on("add", function () {
      if (this._icon) {
        this._icon.classList.add("animated-marker");
        if ("startViewTransition" in document) {
          this._icon.style.viewTransitionName = `marker-${latitude}-${longitude}`;
        }
      }
    });

    if (popupContent) {
      marker.bindPopup(popupContent, {
        maxWidth: 300,
        minWidth: 200,
        className: "custom-popup",
      });

      if (options.openPopup) {
        setTimeout(() => {
          marker.openPopup();
        }, 300);
      }
    }

    marker.addTo(this._map);
    this._markers.push(marker);

    if (markerOptions.draggable && this._isInteractive) {
      marker.on("dragend", (event) => {
        const { lat, lng } = event.target.getLatLng();
        this._selectedLocation = { latitude: lat, longitude: lng };

        if (this._locationSelectedCallback) {
          if ("startViewTransition" in document) {
            document.startViewTransition(() => {
              this._locationSelectedCallback(this._selectedLocation);
            });
          } else {
            this._locationSelectedCallback(this._selectedLocation);
          }
        }
      });
    }

    return marker;
  }

  removeMarker(marker) {
    if (!this._map || !marker) return;

    if ("startViewTransition" in document) {
      document.startViewTransition(() => {
        this._map.removeLayer(marker);

        const index = this._markers.indexOf(marker);
        if (index !== -1) {
          this._markers.splice(index, 1);
        }
      });
    } else {
      this._map.removeLayer(marker);

      const index = this._markers.indexOf(marker);
      if (index !== -1) {
        this._markers.splice(index, 1);
      }
    }
  }

  _clearMarkers() {
    if ("startViewTransition" in document && this._markers.length > 0) {
      document.startViewTransition(() => {
        this._markers.forEach((marker) => {
          if (this._map) {
            this._map.removeLayer(marker);
          }
        });
        this._markers = [];
      });
    } else {
      this._markers.forEach((marker) => {
        if (this._map) {
          this._map.removeLayer(marker);
        }
      });
      this._markers = [];
    }
  }

  removeAllMarkers() {
    this._clearMarkers();
  }

  async showStoryLocations(stories) {
    const showStories = () => {
      this.removeAllMarkers();

      if (!this._map || !stories || stories.length === 0) return;

      const validStories = stories.filter((story) => story.lat && story.lon);

      if (validStories.length === 0) return;

      const addressPromises = [];

      for (let i = 0; i < validStories.length; i++) {
        const story = validStories[i];

        const addressPromise = this.getAddressFromCoordinates(
          story.lat,
          story.lon,
        )
          .then((address) => {
            story._address = address;
            return address;
          })
          .catch((error) => {
            console.error("Error fetching address:", error);
            story._address = "Lokasi tidak diketahui";
            return "Lokasi tidak diketahui";
          });

        addressPromises.push(addressPromise);

        const locationName = story.location
          ? story.location
          : "Memuat lokasi...";

        const popupContent = `
          <div class="map-popup">
            <h3>${story.name}</h3>
            <p>${story.description.substring(0, 100)}${story.description.length > 100 ? "..." : ""}</p>
            <img src="${story.photoUrl}" alt="${story.name}'s story" width="150">
            <p class="location-name location-${story.id}">${locationName}</p>
            <p><a href="#/story/${story.id}" class="view-story-link">Lihat Detail</a></p>
          </div>
        `;

        setTimeout(() => {
          // Use different colors for variety
          const colors = ['#dc3545', '#0084ff', '#28a745', '#ffc107', '#6f42c1'];
          const color = colors[i % colors.length];
          
          this.addMarker(story.lat, story.lon, popupContent, {
            openPopup: false,
            color: color
          });
        }, i * 50);
      }

      Promise.all(addressPromises).then(() => {
        this._markers.forEach((marker, index) => {
          if (index < validStories.length) {
            const story = validStories[index];
            const locationName =
              story.location || story._address || "Lokasi tidak diketahui";

            const popup = marker.getPopup();
            if (popup) {
              const popupElement = popup.getElement();
              if (popupElement) {
                const locationElement = popupElement.querySelector(
                  `.location-${story.id}`,
                );
                if (locationElement) {
                  locationElement.textContent = locationName;
                }
              }
            }

            const updatedPopupContent = `
              <div class="map-popup">
                <h3>${story.name}</h3>
                <p>${story.description.substring(0, 100)}${story.description.length > 100 ? "..." : ""}</p>
                <img src="${story.photoUrl}" alt="${story.name}'s story" width="150">
                <p class="location-name">${locationName}</p>
                <p><a href="#/story/${story.id}" class="view-story-link">Lihat Detail</a></p>
              </div>
            `;

            marker.bindPopup(updatedPopupContent, {
              maxWidth: 300,
              minWidth: 200,
              className: "custom-popup",
            });
          }
        });

        this.enableMapClick(false);

        setTimeout(() => {
          if (this._map && this._markers.length > 0) {
            if ("startViewTransition" in document) {
              document.startViewTransition(() => {
                this._fitBoundsToMarkers(validStories);
              });
            } else {
              this._fitBoundsToMarkers(validStories);
            }
          }
        }, 500);
      });
    };

    if ("startViewTransition" in document) {
      document.startViewTransition(() => {
        showStories();
      });
    } else {
      showStories();
    }
  }

  _fitBoundsToMarkers(stories) {
    if (this._markers.length === 1) {
      const marker = this._markers[0];
      const latlng = marker.getLatLng();
      this._map.setView([latlng.lat, latlng.lng], 10);
    } else {
      const bounds = L.latLngBounds();

      stories.forEach((story) => {
        bounds.extend([story.lat, story.lon]);
      });

      this._map.fitBounds(bounds, {
        padding: [100, 100],
        maxZoom: 12,
        animate: true,
      });
    }

    this._map.invalidateSize();

    this._preventEmptyTiles();
  }

  getSelectedLocation() {
    return this._selectedLocation;
  }

  centerOn(latitude, longitude, zoom = 10) {
    if (!this._map) return;

    if ("startViewTransition" in document) {
      document.startViewTransition(() => {
        this._map.setView([latitude, longitude], zoom);

        setTimeout(() => {
          if (this._map) {
            this._map.invalidateSize();
            this._preventEmptyTiles();
          }
        }, 300);
      });
    } else {
      this._map.setView([latitude, longitude], zoom);

      setTimeout(() => {
        if (this._map) {
          this._map.invalidateSize();
          this._preventEmptyTiles();
        }
      }, 300);
    }
  }

  fixMapBlanks() {
    if (!this._map) return;

    if ("startViewTransition" in document) {
      document.startViewTransition(() => {
        const checkIntervals = [100, 300, 500, 1000];

        checkIntervals.forEach((delay) => {
          setTimeout(() => {
            if (this._map) {
              this._map.invalidateSize({
                animate: false,
                pan: false,
              });
              this._preventEmptyTiles();
            }
          }, delay);
        });
      });
    } else {
      const checkIntervals = [100, 300, 500, 1000];

      checkIntervals.forEach((delay) => {
        setTimeout(() => {
          if (this._map) {
            this._map.invalidateSize({
              animate: false,
              pan: false,
            });
            this._preventEmptyTiles();
          }
        }, delay);
      });
    }
  }

  zoomOut(zoomLevel = 4) {
    if (!this._map) return;

    if ("startViewTransition" in document) {
      document.startViewTransition(() => {
        this._handleZoomOut(zoomLevel);
      });
    } else {
      this._handleZoomOut(zoomLevel);
    }
  }

  _handleZoomOut(zoomLevel) {
    if (this._markers.length > 0) {
      const bounds = L.latLngBounds();

      this._markers.forEach((marker) => {
        bounds.extend(marker.getLatLng());
      });

      this._map.fitBounds(bounds, {
        padding: [150, 150],
        maxZoom: zoomLevel,
        animate: true,
      });
    } else {
      this._map.setView([this._latitude, this._longitude], zoomLevel);
    }

    setTimeout(() => {
      this._map.invalidateSize();
      this._preventEmptyTiles();
    }, 300);
  }

  async getAddressFromCoordinates(latitude, longitude) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&accept-language=id`,
      );

      if (!response.ok) {
        throw new Error("Gagal mendapatkan informasi lokasi");
      }

      const data = await response.json();

      let address = data.display_name || "Lokasi tidak diketahui";

      if (data.address) {
        const addressParts = [];

        if (data.address.road) addressParts.push(data.address.road);
        if (data.address.suburb) addressParts.push(data.address.suburb);
        if (data.address.city || data.address.town || data.address.village) {
          addressParts.push(
            data.address.city || data.address.town || data.address.village,
          );
        }
        if (data.address.state) addressParts.push(data.address.state);
        if (data.address.country) addressParts.push(data.address.country);

        if (addressParts.length > 0) {
          address = addressParts.join(", ");
        }
      }

      console.log(`Address for ${latitude}, ${longitude}: ${address}`);
      return address;
    } catch (error) {
      console.error("Error getting address:", error);
      return "Lokasi tidak diketahui";
    }
  }

  destroy() {
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }

    if (this._map) {
      this._map.remove();
      this._map = null;
    }

    this._markers = [];
    this._mapInitialized = false;
    this._basemapLayers = {};
    this._currentBasemap = null;
    this._worldBounds = null;
  }

  prepareForTransition() {
    if (!this._map) return;

    const container = this._map.getContainer();
    if (container) {
      container.classList.add("map-exit-transition");
    }

    if ("startViewTransition" in document) {
      const leafletContainer = document.querySelector(".leaflet-container");
      if (leafletContainer) {
        leafletContainer.style.viewTransitionName = "story-map-exit";
      }
    }
  }
}

export default StoryMap;