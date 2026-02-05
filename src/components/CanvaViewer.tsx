interface CanvaViewerProps {
  canvaUrl: string;
  title: string;
  onNextDocument?: () => void;
  hasNextDocument?: boolean;
}

export const CanvaViewer = ({ canvaUrl, title, onNextDocument, hasNextDocument }: CanvaViewerProps) => {
  // แปลง Canva Site URL เป็น embed URL
  const getEmbedUrl = (url: string): string => {
    // ถ้าเป็น Canva Site URL (xxx.my.canva.site/xxx)
    if (url.includes('.my.canva.site')) {
      // ลองเพิ่ม ?embed=1 เพื่อบังคับให้เป็น embed mode
      return url.includes('?') ? `${url}&embed=1` : `${url}?embed=1`;
    }
    
    // ถ้าเป็น embed URL อยู่แล้ว
    if (url.includes('/embed')) {
      return url;
    }
    
    // Canva Design URL
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
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        />
        {isCanvaSite && (
          <div className="canva-fallback-overlay">
            <div className="canva-fallback-content">
              <p className="canva-fallback-text">
                ไม่สามารถแสดง Canva ได้? 
              </p>
              <a 
                href={canvaUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="canva-fallback-btn"
              >
                เปิดในแท็บใหม่ →
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
