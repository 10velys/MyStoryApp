class Camera {
  constructor({
    videoElement,
    captureButton,
    switchCameraButton = null,
    photoOutput,
    errorCallback = () => {},
    photoTakenCallback = () => {},
  }) {
    this._videoElement = videoElement;
    this._captureButton = captureButton;
    this._switchCameraButton = switchCameraButton;
    this._photoOutput = photoOutput;
    this._errorCallback = errorCallback;
    this._photoTakenCallback = photoTakenCallback;
    this._stream = null;
    this._facingMode = "user";
    this._photoBlob = null;

    this._setOptimalCameraDimensions();

    this._setupNavigationListeners();
  }

  _setOptimalCameraDimensions() {
    if (this._videoElement) {
      this._videoElement.style.width = "100%";
      this._videoElement.style.height = "100%";
      this._videoElement.style.objectFit = "cover";

      if (this._photoOutput) {
        this._photoOutput.style.width = "100%";
        this._photoOutput.style.height = "100%";
        this._photoOutput.style.objectFit = "cover";
      }
    }
  }

  _setupNavigationListeners() {
    this._hashChangeHandler = () => {
      console.log("Hash changed, stopping camera");
      if (!window.location.hash.includes("/add")) {
        this.stop();
      }
    };

    window.addEventListener("hashchange", this._hashChangeHandler);

    this._beforeUnloadHandler = () => {
      console.log("Page unloading, stopping camera");
      this.stop();
    };

    window.addEventListener("beforeunload", this._beforeUnloadHandler);

    this._visibilityChangeHandler = () => {
      if (document.visibilityState === "hidden") {
        console.log("Page hidden, stopping camera");
        this.stop();
      }
    };

    document.addEventListener(
      "visibilitychange",
      this._visibilityChangeHandler,
    );
  }

  async init() {
    try {
      this.stop();

      console.log("Initializing camera...");

      if (this._videoElement) {
        this._videoElement.style.display = "block";
      }

      this._stream = await this._startStream();

      if (!this._videoElement) {
        throw new Error("Video element not found");
      }

      this._videoElement.srcObject = this._stream;

      await new Promise((resolve) => {
        this._videoElement.onloadedmetadata = () => {
          this._videoElement
            .play()
            .then(() => {
              console.log("Camera started successfully");
              resolve();
            })
            .catch((err) => {
              console.error("Error playing video:", err);
              this._errorCallback("Error starting video playback");
              resolve();
            });
        };

        setTimeout(resolve, 3000);
      });

      this._initEvents();
      return true;
    } catch (error) {
      console.error("Camera init error:", error);
      this._errorCallback(error.message || "Could not access the camera");
      return false;
    }
  }

  async _startStream() {
    try {
      const constraints = {
        video: {
          facingMode: this._facingMode,
          width: { ideal: 1280 },
          height: { ideal: 960 },
          aspectRatio: { ideal: 4 / 3 },
        },
        audio: false,
      };

      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (error) {
      console.warn(
        "Failed with ideal constraints, trying basic constraints",
        error,
      );

      const basicConstraints = {
        video: { facingMode: this._facingMode },
        audio: false,
      };

      return await navigator.mediaDevices.getUserMedia(basicConstraints);
    }
  }

  _initEvents() {
    this._captureButton.removeEventListener("click", this._takePhoto);

    this._captureButton.addEventListener("click", () => {
      this._takePhoto();
    });

    if (this._switchCameraButton) {
      this._switchCameraButton.removeEventListener("click", this._switchCamera);

      this._switchCameraButton.addEventListener("click", () => {
        this._switchCamera();
      });
    }
  }

  _takePhoto() {
    if (!this._videoElement || !this._stream) {
      console.error("Cannot take photo: video or stream not available");
      return;
    }

    const canvas = document.createElement("canvas");
    const video = this._videoElement;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg");
    this._photoOutput.src = dataUrl;
    this._photoOutput.style.display = "block";

    canvas.toBlob(
      (blob) => {
        this._photoBlob = blob;
      },
      "image/jpeg",
      0.8,
    );

    this._videoElement.style.display = "none";
    this._photoOutput.style.display = "block";

    this._captureButton.textContent = "Retake Photo";
    this._captureButton.dataset.mode = "retake";

    this.stop();

    if (
      this._photoTakenCallback &&
      typeof this._photoTakenCallback === "function"
    ) {
      this._photoTakenCallback();
    }

    this._captureButton.addEventListener(
      "click",
      this._handleRetake.bind(this),
      { once: true },
    );
  }

  _handleRetake() {
    this._videoElement.style.display = "block";
    this._photoOutput.style.display = "none";

    this._captureButton.textContent = "Take Photo";
    this._captureButton.dataset.mode = "capture";

    this._photoBlob = null;

    // Restart the camera
    this.init();
  }

  async _switchCamera() {
    this._facingMode = this._facingMode === "user" ? "environment" : "user";
    console.log("Switching camera to:", this._facingMode);

    this.stop();

    try {
      this._stream = await this._startStream();
      this._videoElement.srcObject = this._stream;

      await this._videoElement.play();
    } catch (error) {
      console.error("Error switching camera:", error);
      this._errorCallback("Could not switch camera");

      this._facingMode = this._facingMode === "user" ? "environment" : "user";
      try {
        this._stream = await this._startStream();
        this._videoElement.srcObject = this._stream;
        await this._videoElement.play();
      } catch (revertError) {
        console.error("Failed to revert camera facing mode:", revertError);
      }
    }
  }

  stop() {
    console.log("Stopping camera stream");
    if (this._stream) {
      const tracks = this._stream.getTracks();
      console.log(`Stopping ${tracks.length} tracks`);

      tracks.forEach((track) => {
        console.log(`Stopping track: ${track.kind}`);
        track.stop();
      });

      this._stream = null;
    }

    if (this._videoElement && this._videoElement.srcObject) {
      this._videoElement.srcObject = null;
    }
  }

  getPhotoBlob() {
    return this._photoBlob;
  }

  hasPhoto() {
    return this._photoBlob !== null;
  }

  resize() {
    this._setOptimalCameraDimensions();
  }

  cleanUp() {
    console.log("Cleaning up camera resources");

    this.stop();

    window.removeEventListener("hashchange", this._hashChangeHandler);
    window.removeEventListener("beforeunload", this._beforeUnloadHandler);
    document.removeEventListener(
      "visibilitychange",
      this._visibilityChangeHandler,
    );

    this._stream = null;
    this._photoBlob = null;
  }

  isActive() {
    return !!this._stream && this._stream.active;
  }
}

export default Camera;
