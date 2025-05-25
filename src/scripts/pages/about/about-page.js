class AboutPage {
  constructor() {
    this.styles = `
      .about-page {
        max-width: 1000px;
        margin: 0 auto;
        padding: 2rem;
        font-family: 'Inter', 'Roboto', sans-serif;
        color: #2d3748;
        line-height: 1.6;
      }

      .page-header {
        text-align: center;
        margin-bottom: 3rem;
        padding-bottom: 2rem;
        border-bottom: 1px solid #e2e8f0;
      }

      .app-icon {
        width: 64px;
        height: 64px;
        background-color: #4a5568;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 1.5rem;
      }

      .app-icon i {
        font-size: 1.8rem;
        color: white;
      }

      .about-page h1 {
        font-size: 2.5rem;
        font-weight: 600;
        color: #1a202c;
        margin-bottom: 0.5rem;
      }

      .page-subtitle {
        font-size: 1.1rem;
        color: #718096;
        margin: 0;
      }

      .content-section {
        margin-bottom: 3rem;
      }

      .section-title {
        font-size: 1.5rem;
        font-weight: 600;
        color: #2d3748;
        margin-bottom: 1.5rem;
        padding-bottom: 0.5rem;
        border-bottom: 2px solid #e2e8f0;
      }

      .section-content {
        background: #f7fafc;
        padding: 2rem;
        border-radius: 8px;
        border-left: 4px solid #4a5568;
      }

      .about-page p {
        margin-bottom: 1rem;
        color: #4a5568;
        font-size: 1rem;
      }

      .features-list {
        list-style: none;
        padding: 0;
        margin: 0;
      }

      .feature-item {
        display: flex;
        align-items: flex-start;
        margin-bottom: 1rem;
        padding: 1rem;
        background: white;
        border-radius: 6px;
        border: 1px solid #e2e8f0;
      }

      .feature-icon {
        flex-shrink: 0;
        width: 32px;
        height: 32px;
        background-color: #edf2f7;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 1rem;
      }

      .feature-icon i {
        font-size: 0.9rem;
        color: #4a5568;
      }

      .feature-text {
        flex: 1;
        font-size: 0.95rem;
        color: #4a5568;
        margin: 0;
      }

      .tech-stack {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: 0.75rem;
        margin-top: 1rem;
      }

      .tech-item {
        background: white;
        padding: 0.75rem 1rem;
        border-radius: 6px;
        border: 1px solid #e2e8f0;
        text-align: center;
        font-size: 0.9rem;
        color: #4a5568;
        font-weight: 500;
      }

      .layout-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 3rem;
      }

      @media (min-width: 768px) {
        .layout-grid {
          grid-template-columns: 2fr 1fr;
        }
      }

      .main-content {
        /* Konten utama */
      }

      .sidebar-content {
        background: #f7fafc;
        padding: 2rem;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
        height: fit-content;
      }

      .sidebar-title {
        font-size: 1.25rem;
        font-weight: 600;
        color: #2d3748;
        margin-bottom: 1rem;
        text-align: center;
      }

      .developer-info {
        text-align: center;
      }

      .developer-avatar {
        width: 60px;
        height: 60px;
        background-color: #edf2f7;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 1rem;
      }

      .developer-avatar i {
        font-size: 1.5rem;
        color: #4a5568;
      }

      .info-list {
        list-style: none;
        padding: 0;
        margin: 1.5rem 0 0;
      }

      .info-list li {
        padding: 0.5rem 0;
        border-bottom: 1px solid #e2e8f0;
        font-size: 0.9rem;
        color: #4a5568;
      }

      .info-list li:last-child {
        border-bottom: none;
      }

      .info-label {
        font-weight: 600;
        color: #2d3748;
      }

      @media (max-width: 768px) {
        .about-page {
          padding: 1rem;
        }

        .about-page h1 {
          font-size: 2rem;
        }

        .section-content {
          padding: 1.5rem;
        }

        .layout-grid {
          gap: 2rem;
        }

        .tech-stack {
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
        }
      }
    `;
  }

  async render() {
    return `
      <style>${this.styles}</style>
      <section class="container about-page app-shell-content">
        
       

        <div class="layout-grid">
          <div class="main-content">
            
            <div class="content-section">
              <h2 class="section-title">Tentang Aplikasi</h2>
              <div class="section-content">
                <p>Story App adalah platform untuk berbagi cerita, pengalaman, dan momen bersama komunitas Dicoding. Aplikasi ini memungkinkan pengguna untuk membuat, berbagi, dan menjelajahi cerita dari berbagai lokasi.</p>
                <p>Dengan fokus pada kemudahan penggunaan dan pengalaman pengguna yang optimal, Story App dibangun menggunakan teknologi web modern dan mengikuti best practices dalam pengembangan aplikasi web.</p>
              </div>
            </div>

            <div class="content-section">
              <h2 class="section-title">Fitur Utama</h2>
              <div class="section-content">
                <ul class="features-list">
                  <li class="feature-item">
                    <div class="feature-icon">
                      <i class="fas fa-camera"></i>
                    </div>
                    <p class="feature-text">Ambil foto langsung dari kamera untuk cerita Anda</p>
                  </li>
                  <li class="feature-item">
                    <div class="feature-icon">
                      <i class="fas fa-map-marker-alt"></i>
                    </div>
                    <p class="feature-text">Tambahkan lokasi pada setiap cerita yang dibagikan</p>
                  </li>
                  <li class="feature-item">
                    <div class="feature-icon">
                      <i class="fas fa-globe"></i>
                    </div>
                    <p class="feature-text">Jelajahi cerita dari pengguna lain di peta interaktif</p>
                  </li>
                  <li class="feature-item">
                    <div class="feature-icon">
                      <i class="fas fa-bookmark"></i>
                    </div>
                    <p class="feature-text">Simpan cerita favorit untuk dibaca kemudian</p>
                  </li>
                  <li class="feature-item">
                    <div class="feature-icon">
                      <i class="fas fa-bell"></i>
                    </div>
                    <p class="feature-text">Dapatkan notifikasi untuk cerita baru dari komunitas</p>
                  </li>
                  <li class="feature-item">
                    <div class="feature-icon">
                      <i class="fas fa-mobile-alt"></i>
                    </div>
                    <p class="feature-text">Akses aplikasi dari berbagai perangkat dengan responsif</p>
                  </li>
                </ul>
              </div>
            </div>

            <div class="content-section">
              <h2 class="section-title">Teknologi</h2>
              <div class="section-content">
                <p>Aplikasi ini dibangun menggunakan teknologi web modern untuk memberikan performa dan pengalaman terbaik:</p>
                <div class="tech-stack">
                  <div class="tech-item">JavaScript ES6+</div>
                  <div class="tech-item">SPA Architecture</div>
                  <div class="tech-item">MVP Pattern</div>
                  <div class="tech-item">Camera API</div>
                  <div class="tech-item">Geolocation API</div>
                  <div class="tech-item">Maps Integration</div>
                  <div class="tech-item">Web Push API</div>
                  <div class="tech-item">Service Worker</div>
                  <div class="tech-item">Progressive Web App</div>
                  <div class="tech-item">Responsive Design</div>
                  <div class="tech-item">Webpack</div>
                  <div class="tech-item">Local Storage</div>
                </div>
              </div>
            </div>

          </div>

          <div class="sidebar-content">
            <h3 class="sidebar-title">Informasi Developer</h3>
            <div class="developer-info">
              <div class="developer-avatar">
                <i class="fas fa-user-graduate"></i>
              </div>
              <p>Aplikasi ini dikembangkan sebagai bagian dari program pembelajaran Dicoding.</p>
              
              <ul class="info-list">
                <li><span class="info-label">Developed by:</span> Vania Rahma Dewi</li>
                <li><span class="info-label">Tipe:</span> Submission Project</li>
                <li><span class="info-label">Platform:</span> Dicoding Academy</li>
                <li><span class="info-label">Kelas:</span> Front-End & Back-End</li>
                <li><span class="info-label">Arsitektur:</span> Single Page Application</li>
                <li><span class="info-label">Pattern:</span> Model-View-Presenter</li>
                <li><span class="info-label">Status:</span> Progressive Web App</li>
              </ul>
            </div>
          </div>

        </div>
      </section>
    `;
  }

  async afterRender() {
    document.title = "About - Story App";

    // Load Font Awesome
    if (!document.querySelector('link[href*="font-awesome"]')) {
      const fontAwesome = document.createElement("link");
      fontAwesome.rel = "stylesheet";
      fontAwesome.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css";
      document.head.appendChild(fontAwesome);
    }

    // Load Inter font
    if (!document.querySelector('link[href*="Inter"]')) {
      const interFont = document.createElement("link");
      interFont.rel = "stylesheet";
      interFont.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap";
      document.head.appendChild(interFont);
    }
  }

  destroy() {
    console.log("[AboutPage] Destroy called");
  }
}

export default AboutPage;