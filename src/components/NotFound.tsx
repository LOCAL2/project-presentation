import { Link } from 'react-router-dom';

export const NotFound = () => {
  return (
    <div className="notfound-container">
      <div className="notfound-content">
        {/* SVG Illustration */}
        <div className="notfound-illustration">
          <svg viewBox="0 0 800 600" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Background Circle */}
            <circle cx="400" cy="300" r="200" fill="#f9fafb" />
            
            {/* 404 Text */}
            <text x="400" y="280" fontSize="120" fontWeight="900" fill="#1f2937" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif">
              404
            </text>
            
            {/* Magnifying Glass */}
            <g transform="translate(500, 350)">
              <circle cx="0" cy="0" r="40" stroke="#6b7280" strokeWidth="6" fill="none" />
              <line x1="28" y1="28" x2="60" y2="60" stroke="#6b7280" strokeWidth="6" strokeLinecap="round" />
            </g>
            
            {/* Document Icon */}
            <g transform="translate(250, 350)">
              <rect x="-25" y="-35" width="50" height="70" rx="4" fill="white" stroke="#d1d5db" strokeWidth="2" />
              <line x1="-15" y1="-20" x2="15" y2="-20" stroke="#e5e7eb" strokeWidth="2" strokeLinecap="round" />
              <line x1="-15" y1="-5" x2="15" y2="-5" stroke="#e5e7eb" strokeWidth="2" strokeLinecap="round" />
              <line x1="-15" y1="10" x2="5" y2="10" stroke="#e5e7eb" strokeWidth="2" strokeLinecap="round" />
            </g>
            
            {/* Floating Dots */}
            <circle cx="300" cy="200" r="4" fill="#d1d5db" opacity="0.6">
              <animate attributeName="cy" values="200;190;200" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="500" cy="220" r="4" fill="#d1d5db" opacity="0.6">
              <animate attributeName="cy" values="220;210;220" dur="2.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="350" cy="180" r="3" fill="#d1d5db" opacity="0.4">
              <animate attributeName="cy" values="180;170;180" dur="3s" repeatCount="indefinite" />
            </circle>
          </svg>
        </div>

        <h1 className="notfound-title">ไม่พบหน้าที่คุณต้องการ</h1>
        <p className="notfound-description">
          หน้าที่คุณกำลังมองหาอาจถูกย้าย ลบ หรือไม่เคยมีอยู่จริง
        </p>
        
        <div className="notfound-actions">
          <Link to="/" className="notfound-btn notfound-btn--primary">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            กลับหน้าหลัก
          </Link>
          <Link to="/manage" className="notfound-btn notfound-btn--secondary">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
            จัดการเอกสาร
          </Link>
        </div>
      </div>
    </div>
  );
};
