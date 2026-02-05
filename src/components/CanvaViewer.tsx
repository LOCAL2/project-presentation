interface CanvaViewerProps {
  canvaUrl: string;
  title: string;
  onNextDocument?: () => void;
  hasNextDocument?: boolean;
}

export const CanvaViewer = ({ canvaUrl, title, onNextDocument, hasNextDocument }: CanvaViewerProps) => {
  // แปลง Canva URL ให้เป็น embed URL
  const getEmbedUrl = (url: string): string => {
    // ถ้าเป็น Canva Site URL (xxx.my.canva.site)
    if (url.includes('.my.canva.site')) {
      // ใช้ URL โดยตรง เพราะเป็น published website แล้ว
      return url;
    }
    
    // ถ้าเป็น embed URL อยู่แล้ว ให้ใช้เลย
    if (url.includes('/embed')) {
      return url;
    }
    
    // แปลง URL ปกติเป็น embed URL
    // Format: https://www.canva.com/design/[DESIGN_ID]/view
    // To: https://www.canva.com/design/[DESIGN_ID]/view?embed
    if (url.includes('canva.com/design/')) {
      return url.includes('?') ? `${url}&embed` : `${url}?embed`;
    }
    
    return url;
  };

  const embedUrl = getEmbedUrl(canvaUrl);
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
        <iframe
          src={embedUrl}
          allowFullScreen
          allow="fullscreen"
          className="canva-iframe"
          title={title}
          loading="lazy"
        />
        {isCanvaSite && (
          <div className="canva-hint">
            💡 กด fullscreen icon ที่มุมขวาล่างเพื่อดูแบบเต็มจอ
          </div>
        )}
      </div>
    </div>
  );
};
