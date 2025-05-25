import { addStory, addStoryGuest } from "../../data/api";
import AuthHelper from "../../utils/auth";

class AddStoryPresenter {
  constructor(view) {
    this._view = view;
    this._selectedLocation = null;
    this._imageFile = null;
    this._isLoggedIn = AuthHelper.isUserSignedIn();
  }

  init() {
    this._resetState();
  }

  _resetState() {
    this._selectedLocation = null;
    this._imageFile = null;
  }

  isLoggedIn() {
    return this._isLoggedIn;
  }

  setImageFile(file) {
    this._imageFile = file;
    this._view.updateSubmitButtonState();
  }

  getImageFile() {
    return this._imageFile;
  }

  setSelectedLocation(location) {
    this._selectedLocation = location;
    this._view.updateSelectedLocationText(location);
    this._view.updateSubmitButtonState();
  }

  getSelectedLocation() {
    return this._selectedLocation;
  }

  validateForm(description, hasMedia) {
    if (!description.trim()) {
      this._view.showAlert("Please enter a description for your story.");
      return false;
    }

    if (!hasMedia) {
      this._view.showAlert("Please add an image for your story.");
      return false;
    }

    return true;
  }

  async submitStory(description, photo, isUsingCamera) {
    try {
      this._view.setSubmitButtonState(true, "Sharing...");

      if (isUsingCamera && !photo) {
        throw new Error("Failed to get photo from camera");
      }

      if (!isUsingCamera && !this._imageFile) {
        throw new Error("No image file selected");
      }

      const lat = this._selectedLocation
        ? this._selectedLocation.latitude
        : null;
      const lon = this._selectedLocation
        ? this._selectedLocation.longitude
        : null;

      const imageToUpload = isUsingCamera ? photo : this._imageFile;

      let response;
      let authorName = "Seseorang";
      
      if (this._isLoggedIn) {
        const auth = AuthHelper.getAuth();
        const token = auth.token;
        authorName = auth.name || "Seseorang";
        
        response = await addStory({
          description,
          photo: imageToUpload,
          lat,
          lon,
          token,
        });
      } else {
        response = await addStoryGuest({
          description,
          photo: imageToUpload,
          lat,
          lon,
        });
        authorName = "Guest";
      }

      if (!response.error && !response.isPending) {
        this._view.showAlert("Story shared successfully!");
        
        const storyId = response.story?.id || Date.now().toString();
        this._triggerNotification(authorName, storyId);
      }
      
      if (!response.error) {
        this._view.navigateToHome();
      } else {
        this._view.showAlert(`Failed to share story: ${response.message}`);
        this._view.setSubmitButtonState(false, "Share Story");
      }
      
      return response;
    } catch (error) {
      console.error("Error sharing story:", error);
      this._view.showAlert(
        "An error occurred while sharing your story. Please try again."
      );
      this._view.setSubmitButtonState(false, "Share Story");
      throw error;
    }
  }

  async _triggerNotification(authorName, storyId = null) {
    try {
      console.log('[AddStory] ===== TRIGGERING NOTIFICATION =====');
      console.log('[AddStory] Author name:', authorName);
      console.log('[AddStory] Story ID:', storyId);
      
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        
        if (registration && registration.active) {
          const message = {
            type: 'SIMULATE_PUSH',
            data: {
              title: "Story App", 
              body: `${authorName} menambahkan story baru`,
              author: authorName,
              storyId: storyId
            }
          };
          console.log('[AddStory] Message being sent:', JSON.stringify(message, null, 2));
          
          registration.active.postMessage(message);
          console.log('[AddStory] ===== MESSAGE SENT SUCCESSFULLY =====');
        }
      }
    } catch (error) {
      console.error('[AddStory] ===== NOTIFICATION ERROR =====', error);
    }
  }
}

export default AddStoryPresenter;