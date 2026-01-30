import { Link } from 'react-router-dom';

export const NotFound = () => {
  return (
    <div className="notfound-container">
      <div className="notfound-content">
        <div className="notfound-icon">404</div>
        <h1 className="notfound-title">ไม่พบหน้าที่คุณต้องการ</h1>
        <p className="notfound-description">
          ขอโทษค่ะ หน้าที่คุณกำลังมองหาอาจถูกย้าย ลบ หรือไม่เคยมีอยู่จริง
        </p>
        <div className="notfound-actions">
          <Link to="/" className="notfound-btn notfound-btn--primary">
            กลับหน้าหลัก
          </Link>
          <Link to="/manage" className="notfound-btn notfound-btn--secondary">
            จัดการเอกสาร
          </Link>
        </div>
      </div>
    </div>
  );
};
