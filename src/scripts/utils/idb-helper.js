const DATABASE_NAME = 'story-app-db';
const DATABASE_VERSION = 3;
const OBJECT_STORE_NAME = 'stories';

const openDB = () => {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('Browser tidak mendukung IndexedDB'));
      return;
    }

    const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onerror = () => {
      reject(new Error('Error membuka database'));
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains(OBJECT_STORE_NAME)) {
        db.createObjectStore(OBJECT_STORE_NAME, { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains('pendingStories')) {
        db.createObjectStore('pendingStories', { keyPath: 'id', autoIncrement: true });
      }
      
      if (!db.objectStoreNames.contains('offlineAssets')) {
        db.createObjectStore('offlineAssets', { keyPath: 'url' });
      }
      
      if (!db.objectStoreNames.contains('offlineData')) {
        db.createObjectStore('offlineData', { keyPath: 'key' });
      }

      if (!db.objectStoreNames.contains('bookmarks')) {
        const bookmarkStore = db.createObjectStore('bookmarks', { keyPath: 'id' });
        bookmarkStore.createIndex('bookmarkedAt', 'bookmarkedAt', { unique: false });
      }
    };
  });
};

const getAll = async (storeName = OBJECT_STORE_NAME) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(new Error('Gagal mengambil data dari IndexedDB'));
    };
  });
};

const get = async (id, storeName = OBJECT_STORE_NAME) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(id);

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(new Error(`Gagal mengambil item dengan id ${id} dari IndexedDB`));
    };
  });
};

const put = async (item, storeName = OBJECT_STORE_NAME) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(item);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error('Gagal menyimpan item ke IndexedDB'));
    };
  });
};

const saveAll = async (items, storeName = OBJECT_STORE_NAME) => {
  const db = await openDB();
  const transaction = db.transaction(storeName, 'readwrite');
  const store = transaction.objectStore(storeName);

  return Promise.all(
    items.map((item) => {
      return new Promise((resolve, reject) => {
        const request = store.put(item);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error('Gagal menyimpan item ke IndexedDB'));
      });
    })
  );
};

const remove = async (id, storeName = OBJECT_STORE_NAME) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error(`Gagal menghapus item dengan id ${id} dari IndexedDB`));
    };
  });
};

const deleteAll = async (storeName = OBJECT_STORE_NAME) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error('Gagal menghapus data dari IndexedDB'));
    };
  });
};

const addPendingStory = async (story) => {
  return put(story, 'pendingStories');
};

const getPendingStories = async () => {
  return getAll('pendingStories');
};

const removePendingStory = async (id) => {
  return remove(id, 'pendingStories');
};

const saveOfflineAsset = async (url, data) => {
  return put({ url, data, timestamp: Date.now() }, 'offlineAssets');
};

const getOfflineAsset = async (url) => {
  return get(url, 'offlineAssets');
};

const saveOfflineData = async (key, data) => {
  return put({ key, data, timestamp: Date.now() }, 'offlineData');
};

const getOfflineData = async (key) => {
  try {
    const result = await get(key, 'offlineData');
    return result ? result.data : null;
  } catch (error) {
    console.error(`Error getting offline data for key ${key}:`, error);
    return null;
  }
};

const getDummyStories = async () => {
  const cachedStories = await getOfflineData('cachedStories');
  if (cachedStories && cachedStories.length > 0) {
    return cachedStories;
  }
  
  return [
    {
      id: 'offline-story-1',
      name: 'Offline Mode',
      description: 'Anda sedang dalam mode offline. Cerita ini tersimpan di penyimpanan lokal.',
      photoUrl: '/favicon.png',
      createdAt: new Date().toISOString(),
      lat: -6.2,
      lon: 106.8
    },
    {
      id: 'offline-story-2',
      name: 'Dicoding Story App',
      description: 'Aplikasi ini dapat diakses secara offline. Koneksi internet diperlukan untuk melihat cerita terbaru.',
      photoUrl: '/favicon.png',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      lat: -6.9,
      lon: 107.6
    }
  ];
};

const cacheStories = async (stories) => {
  if (stories && Array.isArray(stories)) {
    await saveOfflineData('cachedStories', stories);
  }
};

const addBookmark = async (story) => {
  const bookmark = {
    ...story,
    bookmarkedAt: new Date().toISOString()
  };
  return put(bookmark, 'bookmarks');
};

const removeBookmark = async (storyId) => {
  return remove(storyId, 'bookmarks');
};

const getAllBookmarks = async () => {
  return getAll('bookmarks');
};

const isBookmarked = async (storyId) => {
  try {
    const bookmark = await get(storyId, 'bookmarks');
    return !!bookmark;
  } catch (error) {
    return false;
  }
};

export default {
  openDB,
  getAll,
  get,
  put,
  saveAll,
  remove,
  deleteAll,
  addPendingStory,
  getPendingStories,
  removePendingStory,
  saveOfflineAsset,
  getOfflineAsset,
  saveOfflineData,
  getOfflineData,
  getDummyStories,
  cacheStories,
  addBookmark,
  removeBookmark,
  getAllBookmarks,
  isBookmarked
};