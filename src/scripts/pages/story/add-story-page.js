import AddStoryPresenter from "./AddStoryPresenter";
import Camera from "../../utils/camera";
import StoryMap from "../../utils/map";

class AddStoryPage {
  constructor() {
    this._camera = null;
    this._map = null;
    this._marker = null;
    this._presenter = new AddStoryPresenter(this);

    this._handleBackButtonClick = this._handleBackButtonClick.bind(this);
  }

  async render() {
    return `
      <style>
        /* ===== Base styles ===== */
        .add-story-page {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .back-button {
          display: inline-flex;
          align-items: center;
          padding: 8px 16px;
          background-color: #f5f5f5;
          border-radius: 20px;
          color: #333;
          text-decoration: none;
          margin-bottom: 16px;
          font-weight: 500;
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        
        .back-button:hover {
          background-color: #e8e8e8;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        
        .back-button i {
          margin-right: 8px;
        }
        
        .add-story-page h1 {
          font-size: 1.8rem;
          margin-bottom: 20px;
          color: #333;
        }
        
        .add-story-form {
          background-color: #fff;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          padding: 24px;
          margin-bottom: 40px;
        }
        
        .form-group {
          margin-bottom: 24px;
        }
        
        .form-group label {
          display: block;
          font-weight: 600;
          margin-bottom: 8px;
          color: #333;
          font-size: 1rem;
        }
        
        .helper-text {
          font-size: 0.85rem;
          color: #666;
          margin-top: 4px;
          margin-bottom: 8px;
        }
        
        textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 8px;
          resize: vertical;
          font-size: 1rem;
          font-family: inherit;
          transition: border-color 0.3s;
        }
        
        textarea:focus {
          border-color: #0084ff;
          outline: none;
          box-shadow: 0 0 0 2px rgba(0, 132, 255, 0.2);
        }
        
        .location-actions {
          margin-bottom: 10px;
        }
        
        .location-info {
          margin-top: 10px;
          padding: 12px;
          background-color: #f8f9fa;
          border-radius: 8px;
          font-size: 0.9rem;
        }
        
        #selected-location {
          margin: 0;
          word-break: break-word;
        }
        
        .map-marker-pulse {
          display: block;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: rgba(0, 132, 255, 0.6);
          border: 2px solid white;
          cursor: pointer;
          box-shadow: 0 0 0 rgba(0, 132, 255, 0.4);
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(0, 132, 255, 0.4);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(0, 132, 255, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(0, 132, 255, 0);
          }
        }
        
        .media-options {
          display: flex;
          margin-bottom: 15px;
          flex-wrap: wrap;
          gap: 10px;
        }
        
        .media-option {
          cursor: pointer;
          padding: 10px 16px;
          background-color: #f1f1f1;
          border-radius: 8px;
          font-weight: 600;
          transition: all 0.3s;
          flex: 1;
          min-width: 120px;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        
        .media-option:hover {
          transform: translateY(-2px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .media-option.active {
          background-color: #0084ff;
          color: white;
          transform: scale(1.02);
          box-shadow: 0 3px 10px rgba(0,132,255,0.3);
        }
        
        .camera-container {
          position: relative;
          margin-top: 15px;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 3px 10px rgba(0,0,0,0.1);
          background-color: #f8f8f8;
        }
        
        #camera-preview, #photo-preview {
          width: 100%;
          max-height: 70vh;
          object-fit: cover;
          border-radius: 12px;
          display: block;
        }
        
        .camera-controls {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          padding: 15px;
          background-color: rgba(0,0,0,0.03);
          border-top: 1px solid rgba(0,0,0,0.05);
        }
        
        .btn {
          padding: 10px 16px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          flex: 1;
          min-width: 120px;
        }
        
        .btn-primary {
          background-color: #0084ff;
          color: white;
        }
        
        .btn-primary:hover:not(:disabled) {
          background-color: #0077e6;
          transform: translateY(-2px);
          box-shadow: 0 4px 10px rgba(0,132,255,0.3);
        }
        
        .btn-primary:disabled {
          background-color: #a6d0ff;
          cursor: not-allowed;
        }
        
        .btn-secondary {
          background-color: #f1f1f1;
          color: #333;
        }
        
        .btn-secondary:hover {
          background-color: #e5e5e5;
          transform: translateY(-2px);
          box-shadow: 0 3px 8px rgba(0,0,0,0.1);
        }
        
        .image-upload-container {
          margin-top: 15px;
          display: none;
          padding: 20px;
          border-radius: 12px;
          border: 2px dashed #ddd;
          background-color: #f9f9f9;
          text-align: center;
        }
        
        .image-upload-preview {
          max-width: 100%;
          max-height: 70vh;
          margin: 15px auto 0;
          border-radius: 8px;
          display: none;
          box-shadow: 0 3px 10px rgba(0,0,0,0.1);
        }
        
        .file-input-wrapper {
          position: relative;
          overflow: hidden;
          display: inline-block;
          margin-bottom: 10px;
        }
        
        .file-input-wrapper input[type=file] {
          font-size: 100px;
          position: absolute;
          left: 0;
          top: 0;
          opacity: 0;
          cursor: pointer;
          width: 100%;
          height: 100%;
        }
        
        .file-input-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 24px;
          background-color: #0084ff;
          color: white;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
        }
        
        .file-input-button:hover {
          background-color: #0077e6;
          transform: translateY(-2px);
          box-shadow: 0 4px 10px rgba(0,132,255,0.3);
        }
        
        .image-upload-info {
          margin-top: 10px;
          font-size: 0.85rem;
          color: #666;
        }
        
        .error-message {
          color: #d93025;
          font-size: 0.85rem;
          margin-top: 8px;
          padding: 8px 12px;
          background-color: #feeced;
          border-radius: 6px;
          display: none;
        }
        
        .error-message:not(:empty) {
          display: block;
        }
        
        .form-actions {
          margin-top: 32px;
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        
        .guest-notice {
          font-size: 0.9rem;
          padding: 12px;
          background-color: #f8f9fa;
          border-radius: 8px;
          text-align: center;
          margin: 0;
        }
        
        .guest-notice a {
          color: #0084ff;
          font-weight: 600;
          text-decoration: none;
        }
        
        .guest-notice a:hover {
          text-decoration: underline;
        }
        
        /* ===== Responsive styles ===== */
        @media (max-width: 768px) {
          .add-story-page {
            padding: 16px;
          }
          
          .add-story-form {
            padding: 20px 16px;
            border-radius: 10px;
          }
          
          .add-story-page h1 {
            font-size: 1.5rem;
            margin-bottom: 16px;
          }
          
          .form-group {
            margin-bottom: 20px;
          }
          
          .media-options {
            flex-direction: row;
            flex-wrap: wrap;
          }
          
          .media-option {
            flex: 1 0 calc(50% - 5px);
            min-width: 0;
            padding: 8px 12px;
            font-size: 0.9rem;
          }
          
          .camera-controls {
            flex-direction: row;
            flex-wrap: wrap;
          }
          
          .btn {
            flex: 1 0 calc(50% - 5px);
            min-width: 0;
            padding: 10px 12px;
            font-size: 0.9rem;
          }
          
          #story-map {
            height: 300px; 
            width: 100%;
            margin: 0 auto;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }

          /* Make sure map container is centered on all screen sizes */
          .form-group div#story-map {
            margin-left: auto;
            margin-right: auto;
            max-width: 100%;
          }

          /* Ensure the leaflet container is properly centered */
          .leaflet-container {
            width: 100%;
            height: 100%;
          }

          @media (max-width: 768px) {
            #story-map {
              height: 250px !important;
              max-width: 100%;
              margin: 0 auto;
            }
          }

          @media (max-width: 480px) {
            #story-map {
              height: 200px !important;
              max-width: 100%;
              margin: 0 auto;
            }
          }
          
          textarea {
            padding: 10px;
            font-size: 0.95rem;
          }
        }
        
        @media (max-width: 480px) {
          .add-story-page {
            padding: 12px;
          }
          
          .back-button {
            padding: 6px 12px;
            font-size: 0.9rem;
          }
          
          .add-story-form {
            padding: 16px 12px;
          }
          
          .form-group label {
            font-size: 0.95rem;
          }
          
          .media-option {
            flex: 1 0 100%;
            margin-right: 0;
            margin-bottom: 8px;
          }
          
          .camera-controls {
            padding: 10px;
          }
          
          .btn {
            flex: 1 0 100%;
            margin-bottom: 8px;
            padding: 10px;
          }
          
          #story-map {
            height: 200px !important;
          }
          
          .location-info {
            padding: 10px;
            font-size: 0.85rem;
          }
          
          .file-input-button {
            padding: 10px 16px;
            font-size: 0.9rem;
          }
          
          .helper-text {
            font-size: 0.8rem;
          }
        }
        
        /* ===== View Transition styles ===== */
        /* Default animations for all browsers */
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slide-up {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes fade-out {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        
        @keyframes slide-left {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(-20px); opacity: 0; }
        }
        
        @keyframes slide-from-left {
          from { transform: translateX(-20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes fade-up {
          from { transform: translateY(0); opacity: 1; }
          to { transform: translateY(-20px); opacity: 0; }
        }
        
        @keyframes fade-from-up {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        /* Fallback animations for browsers without View Transitions API */
        .add-story-page {
          animation: fade-in 0.3s ease-out;
        }
        
        .add-story-form {
          animation: slide-up 0.4s ease-out;
        }
        
        /* Animate form elements sequentially */
        .form-group {
          animation: slide-up 0.5s ease-out;
          animation-fill-mode: backwards;
        }
        
        .form-group:nth-child(1) { animation-delay: 0.1s; }
        .form-group:nth-child(2) { animation-delay: 0.15s; }
        .form-group:nth-child(3) { animation-delay: 0.2s; }
        
        .form-actions {
          animation: slide-up 0.5s ease-out;
          animation-delay: 0.25s;
          animation-fill-mode: backwards;
        }
        
        /* View Transitions API specific styles */
        @supports (view-transition-name: none) {
          /* Custom transitions for Add Story page elements */
          .add-story-page {
            view-transition-name: add-story-page;
          }
          
          #back-to-home {
            view-transition-name: back-button;
          }
          
          .add-story-page h1 {
            view-transition-name: page-title;
          }
          
          .add-story-form {
            view-transition-name: story-form;
          }
          
          /* Specific transitions for form elements */
          ::view-transition-group(description-group) {
            animation-duration: 0.5s;
            animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          ::view-transition-group(media-group) {
            animation-duration: 0.6s;
            animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          ::view-transition-group(location-group) {
            animation-duration: 0.7s;
            animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          ::view-transition-old(add-story-page) {
            animation: 0.5s ease-out fade-out both;
          }
          
          ::view-transition-new(add-story-page) {
            animation: 0.5s ease-out fade-in both;
          }
          
          ::view-transition-old(back-button) {
            animation: 0.3s ease-out slide-left both;
          }
          
          ::view-transition-new(back-button) {
            animation: 0.4s ease-out slide-from-left both;
            animation-delay: 0.1s;
          }
          
          ::view-transition-old(page-title) {
            animation: 0.3s ease-out fade-up both;
          }
          
          ::view-transition-new(page-title) {
            animation: 0.5s ease-out fade-from-up both;
            animation-delay: 0.15s;
          }
          
          ::view-transition-old(story-form) {
            animation: 0.4s ease-out fade-out both;
          }
          
          ::view-transition-new(story-form) {
            animation: 0.5s ease-out fade-in both;
            animation-delay: 0.2s;
          }
          
          /* Transition between photo preview and camera view */
          ::view-transition-group(camera-container) {
            animation-duration: 0.4s;
            animation-timing-function: ease-in-out;
          }
          
          /* Smooth transitions for map interactions */
          ::view-transition-group(story-map) {
            animation-duration: 0.5s;
            animation-timing-function: ease-in-out;
          }
          
          /* Media options transitions */
          ::view-transition-group(media-options) {
            animation-duration: 0.3s;
            animation-timing-function: ease-in-out;
          }
        }
      </style>
      
      <section class="container add-story-page">
        <a href="#/home" class="back-button" aria-label="Back to home page" id="back-to-home">
          <i class="fas fa-arrow-left"></i> Back
        </a>
        
        <h1>Add New Story</h1>
        
        <form id="add-story-form" class="add-story-form">
          <div class="form-group" style="view-transition-name: description-group">
            <label for="description">Story Description</label>
            <textarea id="description" name="description" rows="4" required></textarea>
          </div>
          
          <div class="form-group" style="view-transition-name: media-group">
            <label>Story Media</label>
            
            <div class="media-options" style="view-transition-name: media-options">
              <div id="option-camera" class="media-option active">
                <i class="fas fa-camera"></i> Camera
              </div>
              <div id="option-upload" class="media-option">
                <i class="fas fa-upload"></i> Upload Image
              </div>
            </div>
            
            <div id="camera-container" class="camera-container" style="view-transition-name: camera-container">
              <video id="camera-preview" autoplay playsinline></video>
              <img id="photo-preview" style="display: none;" alt="Captured photo preview">
              
              <div class="camera-controls" style="view-transition-name: camera-controls">
                <button type="button" id="capture-button" class="btn btn-secondary">
                  <i class="fas fa-camera"></i> Take Photo
                </button>
                <button type="button" id="switch-camera" class="btn btn-secondary">
                  <i class="fas fa-sync"></i> Switch Camera
                </button>
              </div>
            </div>
            <div id="camera-error" class="error-message"></div>
            
            <div id="image-upload-container" class="image-upload-container" style="view-transition-name: upload-container">
              <div class="file-input-wrapper">
                <div class="file-input-button">
                  <i class="fas fa-image"></i> Choose Image
                </div>
                <input type="file" id="image-upload" accept="image/*">
              </div>
              <div class="image-upload-info">
                Supported formats: JPG, PNG, GIF. Max size: 5MB
              </div>
              <img id="image-preview" class="image-upload-preview" alt="Uploaded image preview">
            </div>
          </div>
          
          <div class="form-group" style="view-transition-name: location-group">
            <label>Location (Optional)</label>
            <p class="helper-text">Click on the map to select a location for your story.</p>
            <div id="story-map" style="height: 300px; view-transition-name: story-map"></div>
            
            <div class="location-info" style="view-transition-name: location-info">
              <p id="selected-location">No location selected</p>
            </div>
          </div>
          
          <div class="form-actions" style="view-transition-name: form-actions">
            <button type="submit" id="submit-button" class="btn btn-primary" disabled style="view-transition-name: submit-button">
              Share Story
            </button>
            ${
              !this._presenter.isLoggedIn()
                ? `
              <p class="guest-notice" style="view-transition-name: guest-notice">
                You're posting as a guest. <a href="#/login">Login</a> to share with your account.
              </p>
            `
                : ""
            }
          </div>
        </form>
      </section>
    `;
  }

  async afterRender() {
    this._presenter.init();
    this._initMediaOptions();
    this._initCamera();
    this._initImageUpload();
    this._initMap();
    this._initForm();
    this._initBackButton();
    this._setupViewTransition();

    document.title = "Add Story - Story App";
  }

  _setupViewTransition() {
    document.body.classList.add("add-story-view");
    window.getComputedStyle(document.querySelector(".add-story-page")).opacity;
  }

  _initBackButton() {
    const backButton = document.getElementById("back-to-home");
    if (backButton) {
      backButton.removeEventListener("click", this._handleBackButtonClick);
      backButton.addEventListener("click", this._handleBackButtonClick);
    }
  }

  _handleBackButtonClick(event) {
    event.preventDefault();

    if (this._camera) {
      console.log("Stopping camera from back button click");
      this._camera.stop();
      this._camera.cleanUp();
      this._camera = null;
    }

    this.navigateToHome();
  }

  _initMediaOptions() {
    const cameraOption = document.getElementById("option-camera");
    const uploadOption = document.getElementById("option-upload");
    const cameraContainer = document.getElementById("camera-container");
    const uploadContainer = document.getElementById("image-upload-container");

    if (
      !cameraOption ||
      !uploadOption ||
      !cameraContainer ||
      !uploadContainer
    ) {
      console.error("[AddStoryPage] Media option elements not found");
      return;
    }

    cameraOption.addEventListener("click", () => {
      if (document.startViewTransition) {
        document.startViewTransition(() => {
          cameraOption.classList.add("active");
          uploadOption.classList.remove("active");
          cameraContainer.style.display = "block";
          uploadContainer.style.display = "none";
          this._initCamera();
          this.updateSubmitButtonState();
        });
      } else {
        cameraOption.classList.add("active");
        uploadOption.classList.remove("active");
        cameraContainer.style.display = "block";
        uploadContainer.style.display = "none";
        this._initCamera();
        this.updateSubmitButtonState();
      }
    });

    uploadOption.addEventListener("click", () => {
      if (document.startViewTransition) {
        document.startViewTransition(() => {
          uploadOption.classList.add("active");
          cameraOption.classList.remove("active");
          uploadContainer.style.display = "block";
          cameraContainer.style.display = "none";

          if (this._camera) {
            this._camera.stop();
          }

          this.updateSubmitButtonState();
        });
      } else {
        uploadOption.classList.add("active");
        cameraOption.classList.remove("active");
        uploadContainer.style.display = "block";
        cameraContainer.style.display = "none";

        if (this._camera) {
          this._camera.stop();
        }

        this.updateSubmitButtonState();
      }
    });
  }

  _initCamera() {
    const cameraPreview = document.getElementById("camera-preview");
    const captureButton = document.getElementById("capture-button");
    const switchCameraButton = document.getElementById("switch-camera");
    const photoPreview = document.getElementById("photo-preview");

    if (
      !cameraPreview ||
      !captureButton ||
      !switchCameraButton ||
      !photoPreview
    ) {
      console.error("[AddStoryPage] Camera elements not found");
      return;
    }

    this._camera = new Camera({
      videoElement: cameraPreview,
      captureButton,
      switchCameraButton,
      photoOutput: photoPreview,
      errorCallback: (message) => {
        const errorElement = document.getElementById("camera-error");
        if (errorElement) {
          errorElement.textContent = message;
        }
      },
      photoTakenCallback: () => {
        if (document.startViewTransition && photoPreview) {
          document.startViewTransition(() => {
            photoPreview.style.display = "block";
            cameraPreview.style.display = "none";
            this.updateSubmitButtonState();
          });
        } else {
          photoPreview.style.display = "block";
          cameraPreview.style.display = "none";
          this.updateSubmitButtonState();
        }
      },
    });

    this._camera.init().then((success) => {
      if (success) {
        this.updateSubmitButtonState();
      } else {
        const errorElement = document.getElementById("camera-error");
        if (errorElement) {
          errorElement.textContent =
            "Could not access camera. Please ensure camera permissions are enabled.";
        }
      }
    });

    window.removeEventListener("hashchange", this._onHashChange);
    window.addEventListener("hashchange", this._onHashChange);
  }

  _initImageUpload() {
    const imageUploadInput = document.getElementById("image-upload");
    const imagePreview = document.getElementById("image-preview");

    if (!imageUploadInput || !imagePreview) {
      console.error("[AddStoryPage] Image upload elements not found");
      return;
    }

    imageUploadInput.addEventListener("change", (event) => {
      const file = event.target.files[0];

      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          this.showAlert(
            "Image size exceeds 5MB limit. Please choose a smaller image.",
          );
          imageUploadInput.value = "";
          this._presenter.setImageFile(null);
          imagePreview.style.display = "none";
          this.updateSubmitButtonState();
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          if (document.startViewTransition) {
            document.startViewTransition(() => {
              imagePreview.src = e.target.result;
              imagePreview.style.display = "block";
              this._presenter.setImageFile(file);
              this.updateSubmitButtonState();
            });
          } else {
            imagePreview.src = e.target.result;
            imagePreview.style.display = "block";
            this._presenter.setImageFile(file);
            this.updateSubmitButtonState();
          }
        };

        reader.readAsDataURL(file);
      } else {
        imagePreview.style.display = "none";
        this._presenter.setImageFile(null);
        this.updateSubmitButtonState();
      }
    });
  }

  _initMap() {
    const mapContainer = document.getElementById("story-map");

    if (!mapContainer) {
      console.error("[AddStoryPage] Map container not found");
      return;
    }

    this._map = new StoryMap({ mapContainer });
    this._map.init();

    this._map.setLocationSelectedCallback((location) => {
      this._presenter.setSelectedLocation(location);

      if (document.startViewTransition) {
        document.startViewTransition(() => {
          this._addMarkerToMap(location.latitude, location.longitude);
          this.updateSubmitButtonState();
        });
      } else {
        this._addMarkerToMap(location.latitude, location.longitude);
        this.updateSubmitButtonState();
      }
    });
  }

  _addMarkerToMap(latitude, longitude) {
    if (this._marker) {
      this._map.removeMarker(this._marker);
    }

    this._marker = this._map.addMarker(latitude, longitude, "", {
      color: '#28a745', 
      draggable: true
    });
  }

  updateSelectedLocationText(location) {
    const locationText = document.getElementById("selected-location");

    if (!locationText) {
      console.error("[AddStoryPage] Location text element not found");
      return;
    }

    if (location) {
      if (document.startViewTransition) {
        document.startViewTransition(() => {
          locationText.innerHTML = `
            <i class="fas fa-map-marker-alt"></i> 
            Location selected: (${location.latitude.toFixed(6)}, 
            ${location.longitude.toFixed(6)})
          `;
        });
      } else {
        locationText.innerHTML = `
          <i class="fas fa-map-marker-alt"></i> 
          Location selected: (${location.latitude.toFixed(6)}, 
          ${location.longitude.toFixed(6)})
        `;
      }
    } else {
      locationText.textContent = "No location selected";
    }
  }

  _initForm() {
    const form = document.getElementById("add-story-form");
    const descriptionInput = document.getElementById("description");
    const submitButton = document.getElementById("submit-button");

    if (!form || !descriptionInput || !submitButton) {
      console.error("[AddStoryPage] Form elements not found");
      return;
    }

    descriptionInput.addEventListener("input", () => {
      this.updateSubmitButtonState();
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const descriptionInput = document.getElementById("description");
      const cameraOption = document.getElementById("option-camera");

      if (!descriptionInput || !cameraOption) {
        console.error("[AddStoryPage] Form elements not found");
        return;
      }

      const description = descriptionInput.value;
      const isUsingCamera = cameraOption.classList.contains("active");

      let hasMedia = false;
      if (isUsingCamera) {
        hasMedia = this._camera && this._camera.hasPhoto();
      } else {
        hasMedia = !!this._presenter.getImageFile();
      }

      if (!this._presenter.validateForm(description, hasMedia)) {
        return;
      }

      this.setSubmitButtonState(true, "Saving...");

      const photo = isUsingCamera && this._camera ? this._camera.getPhotoBlob() : null;
    
      try {
        const response = await this._presenter.submitStory(description, photo, isUsingCamera);
        
        if (!navigator.onLine && response && !response.error && response.isPending) {
          this.showAlert("Story saved offline. It will be uploaded when you're back online.");
        }
      } catch (error) {
        console.error('Error submitting story:', error);
        this.showAlert("An error occurred while sharing your story. Please try again.");
        this.setSubmitButtonState(false, "Share Story");
      }
    });
  }

  updateSubmitButtonState() {
    const descriptionInput = document.getElementById("description");
    const submitButton = document.getElementById("submit-button");
    const cameraOption = document.getElementById("option-camera");

    if (!descriptionInput || !submitButton || !cameraOption) {
      console.error(
        "[AddStoryPage] Elements for submit button state update not found",
      );
      return;
    }

    const isUsingCamera = cameraOption.classList.contains("active");

    const isDescriptionFilled = descriptionInput.value.trim() !== "";
    let hasMedia = false;

    if (isUsingCamera) {
      hasMedia = this._camera && this._camera.hasPhoto();
    } else {
      hasMedia = !!this._presenter.getImageFile();
    }

    console.log("Description filled:", isDescriptionFilled);
    console.log("Has media:", hasMedia);
    console.log("Using camera:", isUsingCamera);

    submitButton.disabled = !(isDescriptionFilled && hasMedia);
  }

  setSubmitButtonState(isDisabled, text) {
    const submitButton = document.getElementById("submit-button");
    if (submitButton) {
      submitButton.disabled = isDisabled;
      submitButton.textContent = text || "Share Story";
    }
  }

  showAlert(message) {
    alert(message);
  }

  navigateToHome() {
    if (document.startViewTransition) {
      document.startViewTransition(() => {
        window.location.hash = "#/home";
      });
    } else {
      window.location.hash = "#/home";
    }
  }

  _onHashChange = () => {
    console.log("[AddStoryPage] Hash changed");
    if (!window.location.hash.includes("/add")) {
      if (this._camera) {
        console.log("Stopping camera on hash change");
        this._camera.stop();
        this._camera.cleanUp();
        this._camera = null;
      }
    }
  };

  destroy() {
    console.log("[AddStoryPage] Destroy called");

    if (this._camera) {
      this._camera.stop();
      this._camera.cleanUp();
      this._camera = null;
    }

    window.removeEventListener("hashchange", this._onHashChange);

    document.body.classList.remove("add-story-view");
  }
}

export default AddStoryPage;