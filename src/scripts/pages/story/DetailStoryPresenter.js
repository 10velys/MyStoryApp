import { getDetailStory } from "../../data/api";
import AuthHelper from "../../utils/auth";
import StoryMap from "../../utils/map";
import IdbHelper from "../../utils/idb-helper";

class DetailStoryPresenter {
  constructor(view) {
    this._view = view;
    this._story = null;
    this._map = null;
    this._locationAddress = null;
    this._isBookmarked = false;
  }

  async init(id) {
    await this._loadStoryDetail(id);
    await this._checkBookmarkStatus(id);
  }

  async _loadStoryDetail(id) {
    try {
      console.log("[DetailStoryPresenter] Loading story with ID:", id);

      const token = AuthHelper.getAuth().token;

      if (!token) {
        console.warn(
          "[DetailStoryPresenter] No auth token found, redirecting to login",
        );
        window.location.hash = "#/login";
        return;
      }

      console.log("[DetailStoryPresenter] Fetching story details from API");
      const response = await getDetailStory({ id, token });
      console.log("[DetailStoryPresenter] API response:", response);

      if (!response.error) {
        this._story = response.story;
        console.log("[DetailStoryPresenter] Story data loaded:", this._story);

        this._view.renderStoryDetail(this._story);
        console.log("[DetailStoryPresenter] Story detail rendered");

        if (this._story.lat && this._story.lon) {
          console.log(
            "[DetailStoryPresenter] Story has location data, preparing map",
          );

          this._view.showMapContainer();
          await this._getLocationAddress();
          
          this._view.initMapWithDelay(this._story.lat, this._story.lon);
        }
      } else {
        console.error("[DetailStoryPresenter] API error:", response.error);
        this._view.renderError("Failed to load story details.");
      }
    } catch (error) {
      console.error(
        "[DetailStoryPresenter] Error loading story detail:",
        error,
      );
      this._view.renderError("An error occurred while loading the story.");
    }
  }

  async _checkBookmarkStatus(storyId) {
    try {
      this._isBookmarked = await IdbHelper.isBookmarked(storyId);
      this._view.setupBookmarkButton(this._story, this._isBookmarked);
    } catch (error) {
      console.error("[DetailStoryPresenter] Error checking bookmark status:", error);
      this._view.setupBookmarkButton(this._story, false);
    }
  }

  async toggleBookmark(story) {
    if (!story) return;

    this._view.setBookmarkLoading(true);

    try {
      if (this._isBookmarked) {
        await IdbHelper.removeBookmark(story.id);
        this._isBookmarked = false;
        this._view.updateBookmarkButton(false);
        this._view.showToast('Bookmark removed', 'success');
      } else {
        await IdbHelper.addBookmark(story);
        this._isBookmarked = true;
        this._view.updateBookmarkButton(true);
        this._view.showToast('Story bookmarked!', 'success');
      }
    } catch (error) {
      console.error("[DetailStoryPresenter] Error toggling bookmark:", error);
      this._view.showToast('Failed to update bookmark', 'error');
    } finally {
      this._view.setBookmarkLoading(false);
    }
  }

  async _getLocationAddress() {
    if (!this._story || !this._story.lat || !this._story.lon) return;

    try {
      if (this._story.location) {
        this._locationAddress = this._story.location;
        this._view.updateLocationAddressUI(this._locationAddress);
        if (this._map && this._map._mapInitialized) {
          this._updateMapPopup();
        }
        return;
      }

      this._view.showLoadingAddress();

      const tempMap = new StoryMap({
        mapContainer: this._view.createTemporaryMapContainer()
      });

      try {
        const address = await Promise.race([
          tempMap.getAddressFromCoordinates(this._story.lat, this._story.lon),
          this._view.createTimeoutPromise(8000, "Waktu pencarian lokasi habis")
        ]);

        this._locationAddress = address || "Alamat tidak ditemukan";
      } catch (error) {
        console.warn("Error fetching detailed address:", error);

        try {
          this._locationAddress = `${this._story.lat.toFixed(4)}, ${this._story.lon.toFixed(4)}`;
        } catch (e) {
          this._locationAddress = "Lokasi tidak diketahui";
        }
      }

      this._view.updateLocationAddressUI(this._locationAddress);

      if (this._map && this._map._mapInitialized) {
        this._updateMapPopup();
      }

      tempMap.destroy();
    } catch (error) {
      console.error("Error getting location address:", error);
      this._locationAddress = "Lokasi tidak diketahui";
      this._view.updateLocationAddressUI(this._locationAddress);
    }
  }

  _updateMapPopup() {
    if (!this._map || !this._map._markers || this._map._markers.length === 0)
      return;

    const marker = this._map._markers[0];
    if (!marker) return;

    const popupData = {
      name: this._story.name,
      photoUrl: this._story.photoUrl,
      locationAddress: this._locationAddress || "Lokasi tidak diketahui",
    };
    
    this._view.updateMapPopup(marker, popupData);
    this._view.openMarkerPopupAndAdjustView(marker);
  }

  setMap(map) {
    this._map = map;
    
    if (this._locationAddress && this._map && this._map._markers && this._map._markers.length > 0) {
      this._updateMapPopup();
    }
  }
  
  getStoryData() {
    return this._story;
  }
  
  getLocationAddress() {
    return this._locationAddress;
  }
}

export default DetailStoryPresenter;