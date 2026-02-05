interface CanvaViewerProps {
  canvaUrl: string;
  title: string;
  onNextDocument?: () => void;
  hasNextDocument?: boolean;
}

export const CanvaViewer = ({ canvaUrl, title, onNextDocument, hasNextDocument }: CanvaViewerProps) => {
  const isCanvaSite = canvaUrl.includes('.my.canva.site');

  return (
    <div className="canva-viewer">
      <div className="pdf-controls">
        <div className="page-controls">
          <span className="page-info">{title}</span>
        </div>
        
        <div className="next-button-container">
          {hasNextDocument && (
            <button className="next-document-btn" onClick={onNextDocument}>
              <span className="desktop-text">ไปยังบทถัดไป →</span>
              <span className="mobile-text">ถัดไป →</span>
            </button>
          )}
          <a href="/members" className="members-link-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <span className="desktop-text">สมาชิก</span>
          </a>
        </div>
      </div>

      <div className="canva-container">
        {isCanvaSite ? (
          <div className="canva-external-link">
            <div className="canva-external-content">
              <div className="canva-icon">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
              </div>
              <h2 className="canva-external-title">{title}</h2>
              <p className="canva-external-description">
                Canva Presentation ไม่สามารถแสดงแบบ embed ได้<br/>
                กรุณาคลิกปุ่มด้านล่างเพื่อเปิดในหน้าต่างใหม่
              </p>
              <a 
                href={canvaUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="canva-open-btn"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
                เปิด Canva Presentation
              </a>
              <p className="canva-external-hint">
                💡 Presentation จะเปิดในแท็บใหม่
              </p>
            </div>
          </div>
        ) : (
          <>
            <iframe
              src={canvaUrl}
              allowFullScreen
              allow="fullscreen"
              className="canva-iframe"
              title={title}
              loading="lazy"
            />
            <div className="canva-hint">
              💡 กด fullscreen icon ที่มุมขวาล่างเพื่อดูแบบเต็มจอ
            </div>
          </>
        )}
      </div>
    </div>
  );
};
