import { Link } from 'react-router-dom';

export const HomePage = () => {
  return (
    <div className="home-container">
      <div className="home-content">
        <div className="home-hero">
          <h1 className="home-title">Smoke Detect</h1>
          <p className="home-subtitle">
            ระบบจัดการและแสดงเอกสารออนไลน์
          </p>
          <p className="home-description">
            เข้าถึงเอกสาร PDF และ Canva Presentation ได้ง่ายๆ<br/>
            พร้อมระบบจัดการหมวดหมู่ที่ใช้งานสะดวก
          </p>
        </div>

        <div className="home-actions">
          <Link to="/data" className="home-btn home-btn--primary">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14,2 14,8 20,8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10,9 9,9 8,9"></polyline>
            </svg>
            เริ่มต้นใช้งาน
          </Link>
          
          <Link to="/manage" className="home-btn home-btn--secondary">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
            จัดการเอกสาร
          </Link>

          <Link to="/members" className="home-btn home-btn--secondary">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            สมาชิกทีม
          </Link>
        </div>

        <div className="home-features">
          <div className="home-feature">
            <div className="home-feature-icon">📄</div>
            <h3 className="home-feature-title">PDF Viewer</h3>
            <p className="home-feature-description">
              แสดงเอกสาร PDF แบบเต็มหน้าจอ พร้อมระบบเลื่อนดูหน้าถัดไป
            </p>
          </div>

          <div className="home-feature">
            <div className="home-feature-icon">🎨</div>
            <h3 className="home-feature-title">Canva Integration</h3>
            <p className="home-feature-description">
              รองรับการแสดง Canva Presentation แบบ embedded
            </p>
          </div>

          <div className="home-feature">
            <div className="home-feature-icon">📁</div>
            <h3 className="home-feature-title">จัดการหมวดหมู่</h3>
            <p className="home-feature-description">
              จัดระเบียบเอกสารด้วยระบบหมวดหมู่ที่ใช้งานง่าย
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
