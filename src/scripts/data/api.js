import CONFIG from "../config";
import IDBHelper from "../utils/idb-helper";

const ENDPOINTS = {
  REGISTER: `${CONFIG.BASE_URL}/register`,
  LOGIN: `${CONFIG.BASE_URL}/login`,
  GET_ALL_STORIES: `${CONFIG.BASE_URL}/stories`,
  GET_DETAIL_STORY: (id) => `${CONFIG.BASE_URL}/stories/${id}`,
  ADD_STORY: `${CONFIG.BASE_URL}/stories`,
  ADD_STORY_GUEST: `${CONFIG.BASE_URL}/stories/guest`,
  SUBSCRIBE_NOTIFICATION: `${CONFIG.BASE_URL}/notifications/subscribe`,
  UNSUBSCRIBE_NOTIFICATION: `${CONFIG.BASE_URL}/notifications/unsubscribe`,
  TEST_NOTIFICATION: `${CONFIG.BASE_URL}/notifications/test`,
};

export async function register({ name, email, password }) {
  try {
    const response = await fetch(ENDPOINTS.REGISTER, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        email,
        password,
      }),
    });

    return await response.json();
  } catch (error) {
    console.error("Network error during registration:", error);
    return {
      error: true,
      message: "Failed to register. Please check your connection and try again."
    };
  }
}

export async function login({ email, password }) {
  try {
    const response = await fetch(ENDPOINTS.LOGIN, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const result = await response.json();
    
    if (!result.error) {
      try {
        localStorage.setItem('auth_data', JSON.stringify(result.loginResult));
      } catch (e) {
        console.error("Failed to save auth data to localStorage", e);
      }
    }
    
    return result;
  } catch (error) {
    console.error("Network error during login:", error);
    return {
      error: true,
      message: "Failed to login. Please check your connection and try again."
    };
  }
}

export async function getAllStories({
  page = 1,
  size = 10,
  location = 0,
  token = "",
}) {
  try {
    const url = `${ENDPOINTS.GET_ALL_STORIES}?page=${page}&size=${size}&location=${location}`;

    const headers = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      headers,
    });

    const responseJson = await response.json();

    console.log(
      `[API] Fetched ${responseJson.listStory?.length || 0} stories from page ${page}`,
    );

    if (responseJson.error) {
      console.error("[API] Error fetching stories:", responseJson.message);
      return responseJson;
    }
    
    if (!responseJson.error && responseJson.listStory && responseJson.listStory.length > 0) {
      try {
        if (page === 1) {
          await IDBHelper.deleteAll();
        }
        await IDBHelper.saveAll(responseJson.listStory);
      } catch (e) {
        console.error("Failed to cache stories:", e);
      }
    }

    return responseJson;
  } catch (error) {
    console.error("Network error when fetching stories:", error);
    
    if (!navigator.onLine) {
      try {
        const cachedStories = await IDBHelper.getAll();
        if (cachedStories && cachedStories.length > 0) {
          return {
            error: false,
            message: "Using cached data (offline mode)",
            listStory: cachedStories,
            fromCache: true
          };
        }
      } catch (e) {
        console.error("Failed to get cached stories:", e);
      }
    }

    return {
      error: true,
      message:
        "Failed to fetch stories. Please check your connection and try again.",
    };
  }
}

export async function getDetailStory({ id, token }) {
  try {
    const response = await fetch(ENDPOINTS.GET_DETAIL_STORY(id), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json();
    
    if (!result.error && result.story) {
      try {
        await IDBHelper.put(result.story);
      } catch (e) {
        console.error("Failed to cache story detail:", e);
      }
    }
    
    return result;
  } catch (error) {
    console.error("Network error when fetching story detail:", error);
    
    if (!navigator.onLine) {
      try {
        const cachedStory = await IDBHelper.get(id);
        if (cachedStory) {
          return {
            error: false,
            message: "Using cached data (offline mode)",
            story: cachedStory,
            fromCache: true
          };
        }
      } catch (e) {
        console.error("Failed to get cached story:", e);
      }
    }
    
    return {
      error: true,
      message: "Failed to fetch story detail. Please check your connection and try again."
    };
  }
}

export async function addStory({
  description,
  photo,
  lat = null,
  lon = null,
  token,
}) {
  try {
    const formData = new FormData();
    formData.append("description", description);
    formData.append("photo", photo);

    if (lat !== null && lon !== null) {
      formData.append("lat", lat);
      formData.append("lon", lon);
    }

    const response = await fetch(ENDPOINTS.ADD_STORY, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Network error when adding story:", error);
    
    if (!navigator.onLine) {
      try {
        const pendingStory = {
          id: `pending-${Date.now()}`,
          description,
          photoData: await readFileAsBase64(photo),
          lat,
          lon,
          createdAt: new Date().toISOString(),
          isPending: true
        };
        
        await IDBHelper.addPendingStory(pendingStory);
        
        return {
          error: false,
          message: "Story saved offline and will be uploaded when you're back online",
          isPending: true,
          story: pendingStory
        };
      } catch (e) {
        console.error("Failed to save pending story:", e);
      }
    }
    
    return {
      error: true,
      message: "Failed to add story. Please check your connection and try again."
    };
  }
}

export async function addStoryGuest({
  description,
  photo,
  lat = null,
  lon = null,
}) {
  try {
    const formData = new FormData();
    formData.append("description", description);
    formData.append("photo", photo);

    if (lat !== null && lon !== null) {
      formData.append("lat", lat);
      formData.append("lon", lon);
    }

    const response = await fetch(ENDPOINTS.ADD_STORY_GUEST, {
      method: "POST",
      body: formData,
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Network error when adding guest story:", error);
    
    if (!navigator.onLine) {
      try {
        const pendingStory = {
          id: `pending-guest-${Date.now()}`,
          description,
          photoData: await readFileAsBase64(photo),
          lat,
          lon,
          createdAt: new Date().toISOString(),
          isPending: true,
          isGuest: true
        };
        
        await IDBHelper.addPendingStory(pendingStory);
        
        return {
          error: false,
          message: "Story saved offline and will be uploaded when you're back online",
          isPending: true,
          story: pendingStory
        };
      } catch (e) {
        console.error("Failed to save pending guest story:", e);
      }
    }
    
    return {
      error: true,
      message: "Failed to add story. Please check your connection and try again."
    };
  }
}

export async function syncPendingStories(token) {
  if (!navigator.onLine) return;
  
  try {
    const pendingStories = await IDBHelper.getPendingStories();
    if (!pendingStories || pendingStories.length === 0) return;
    
    for (const story of pendingStories) {
      try {
        const photoBlob = await base64ToBlob(story.photoData);
        const photoFile = new File([photoBlob], "photo.jpg", { type: "image/jpeg" });
        
        if (story.isGuest) {
          await addStoryGuest({
            description: story.description,
            photo: photoFile,
            lat: story.lat,
            lon: story.lon
          });
        } else {
          await addStory({
            description: story.description,
            photo: photoFile,
            lat: story.lat,
            lon: story.lon,
            token
          });
        }
        
        await IDBHelper.removePendingStory(story.id);
      } catch (error) {
        console.error(`Failed to sync story ${story.id}:`, error);
      }
    }
  } catch (error) {
    console.error("Error syncing pending stories:", error);
  }
}

async function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
}

async function base64ToBlob(base64Data) {
  const parts = base64Data.split(';base64,');
  const contentType = parts[0].split(':')[1];
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);
  
  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }
  
  return new Blob([uInt8Array], { type: contentType });
}

export async function subscribeNotification({ endpoint, keys, token }) {
  try {
    const response = await fetch(ENDPOINTS.SUBSCRIBE_NOTIFICATION, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        endpoint,
        keys,
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to subscribe');
    }
    
    return result;
  } catch (error) {
    console.error("Error subscribing to notifications:", error);
    return {
      error: true,
      message: error.message || "Failed to subscribe to notifications"
    };
  }
}

export async function unsubscribeNotification({ endpoint, token }) {
  try {
    const response = await fetch(ENDPOINTS.UNSUBSCRIBE_NOTIFICATION, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        endpoint,
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to unsubscribe');
    }
    
    return result;
  } catch (error) {
    console.error("Error unsubscribing from notifications:", error);
    return {
      error: true,
      message: error.message || "Failed to unsubscribe from notifications"
    };
  }
}

export async function testNotification({ token }) {
  try {
    console.log("Sending test notification with token:", token);
    const response = await fetch(ENDPOINTS.TEST_NOTIFICATION, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        message: "Test notification from Story App"
      }),
    });

    const result = await response.json();
    console.log("Test notification response:", result);
    
    if (!response.ok) {
      throw new Error(result.message || 'Test notification request failed');
    }
    
    return result;
  } catch (error) {
    console.error("Error sending test notification:", error);
    return {
      error: true,
      message: error.message || "Failed to send test notification"
    };
  }
}