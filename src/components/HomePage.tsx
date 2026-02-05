import { Link } from 'react-router-dom';

export const HomePage = () => {
  return (
    <div className="home-container">
      <div className="home-content">
        <div className="home-hero">
          <h1 className="home-title">Smoke Detect</h1>
          <p className="home-subtitle">
            เครื่องตรวจจับควัน
          </p>
        </div>

        <div className="home-actions">
          <Link to="/picture" className="home-btn home-btn--primary">
            เริ่มต้นใช้งาน
          </Link>
        </div>
      </div>
    </div>
  );
};
