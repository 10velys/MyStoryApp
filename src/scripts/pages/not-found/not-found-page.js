class NotFoundPage {
  async render() {
    return `
      <div class="not-found-container">
        <div class="not-found-content">
          <div class="not-found-icon">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="#6B7280"/>
            </svg>
          </div>
          
          <h1 class="not-found-title">404</h1>
          <h2 class="not-found-subtitle">Halaman Tidak Ditemukan</h2>
          
          <p class="not-found-description">
            Maaf, halaman yang Anda cari tidak dapat ditemukan. 
            Mungkin halaman telah dipindahkan atau tidak lagi tersedia.
          </p>
          
          <div class="not-found-actions">
            <a href="#/home" class="btn btn-primary not-found-btn">
              <span class="btn-icon">🏠</span>
              Kembali ke Beranda
            </a>
            
            <button id="go-back-btn" class="btn btn-secondary not-found-btn">
              <span class="btn-icon">←</span>
              Kembali
            </button>
          </div>
          
          <div class="not-found-suggestions">
            <h3>Mungkin Anda mencari:</h3>
            <ul class="suggestions-list">
              <li><a href="#/home">📖 Lihat Semua Stories</a></li>
              <li><a href="#/add">✍️ Tambah Story Baru</a></li>
              <li><a href="#/bookmarks">🔖 Bookmarks Saya</a></li>
              <li><a href="#/about">ℹ️ Tentang Story App</a></li>
            </ul>
          </div>
        </div>
      </div>
      
      <style>
        .not-found-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 70vh;
          padding: 2rem;
          text-align: center;
        }
        
        .not-found-content {
          max-width: 600px;
          width: 100%;
        }
        
        .not-found-icon {
          margin-bottom: 2rem;
          opacity: 0.7;
        }
        
        .not-found-title {
          font-size: 6rem;
          font-weight: 800;
          color: #4A6572;
          margin: 0;
          line-height: 1;
        }
        
        .not-found-subtitle {
          font-size: 1.5rem;
          color: #374151;
          margin: 1rem 0;
          font-weight: 600;
        }
        
        .not-found-description {
          font-size: 1rem;
          color: #6B7280;
          margin: 1.5rem 0 2.5rem 0;
          line-height: 1.6;
        }
        
        .not-found-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-bottom: 3rem;
          flex-wrap: wrap;
        }
        
        .not-found-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 500;
          transition: all 0.2s ease;
          border: none;
          cursor: pointer;
          font-size: 1rem;
        }
        
        .btn-primary {
          background: #4A6572;
          color: white;
        }
        
        .btn-primary:hover {
          background: #3a525d;
          transform: translateY(-1px);
        }
        
        .btn-secondary {
          background: #F3F4F6;
          color: #374151;
          border: 1px solid #D1D5DB;
        }
        
        .btn-secondary:hover {
          background: #E5E7EB;
          transform: translateY(-1px);
        }
        
        .not-found-suggestions {
          background: #F9FAFB;
          border-radius: 12px;
          padding: 1.5rem;
          border: 1px solid #E5E7EB;
        }
        
        .not-found-suggestions h3 {
          margin: 0 0 1rem 0;
          color: #374151;
          font-size: 1.1rem;
        }
        
        .suggestions-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: grid;
          gap: 0.75rem;
        }
        
        .suggestions-list li {
          text-align: left;
        }
        
        .suggestions-list a {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          color: #4A6572;
          text-decoration: none;
          border-radius: 8px;
          transition: background-color 0.2s ease;
        }
        
        .suggestions-list a:hover {
          background: white;
          color: #374151;
        }
        
        @media (max-width: 768px) {
          .not-found-container {
            padding: 1rem;
            min-height: 60vh;
          }
          
          .not-found-title {
            font-size: 4rem;
          }
          
          .not-found-subtitle {
            font-size: 1.25rem;
          }
          
          .not-found-actions {
            flex-direction: column;
            align-items: center;
          }
          
          .not-found-btn {
            width: 100%;
            max-width: 280px;
            justify-content: center;
          }
        }
      </style>
    `;
  }

  async afterRender() {
    this._setupEventListeners();
  }

  _setupEventListeners() {
    const goBackBtn = document.getElementById('go-back-btn');
    
    if (goBackBtn) {
      goBackBtn.addEventListener('click', () => {
        if (window.history.length > 1) {
          window.history.back();
        } else {
          window.location.hash = '#/home';
        }
      });
    }
  }

  destroy() {
  }
}

export default NotFoundPage;