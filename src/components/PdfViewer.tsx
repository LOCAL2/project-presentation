import { useState, useEffect, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

interface PdfViewerProps {
  filePath: string;
  title: string;
  onNextDocument?: () => void;
  hasNextDocument?: boolean;
}

export const PdfViewer = ({ filePath, title, onNextDocument, hasNextDocument }: PdfViewerProps) => {
  const [numPages, setNumPages] = useState<number>();
  const [scale, setScale] = useState<number>(0.97);
  const [currentVisiblePage, setCurrentVisiblePage] = useState<number>(1);
  const [pdfFile, setPdfFile] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLoading, setShowLoading] = useState(false);

  const handleDownload = async (): Promise<void> => {
    try {
      const response = await fetch(filePath);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('ไม่สามารถดาวน์โหลดไฟล์ได้');
    }
  };

  // Memoize options เพื่อป้องกัน unnecessary reloads
  const options = useMemo(() => ({
    cMapUrl: `https://unpkg.com/pdfjs-dist@5.4.296/cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `https://unpkg.com/pdfjs-dist@5.4.296/standard_fonts/`,
    disableStream: false,
    disableAutoFetch: false,
  }), []);

  // Auto-adjust scale based on screen size
  useEffect(() => {
    const updateScale = () => {
      const isMobile = window.innerWidth <= 768;
      const isSmallMobile = window.innerWidth <= 480;
      
      if (isSmallMobile) {
        setScale(0.8);
      } else if (isMobile) {
        setScale(0.9);
      } else {
        setScale(0.97);
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  // Delay showing loading state
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (isLoading) {
      // แสดง loading หลังจาก 300ms เท่านั้น (ถ้าโหลดเร็วกว่านี้จะไม่แสดง)
      timer = setTimeout(() => {
        setShowLoading(true);
      }, 300);
    } else {
      setShowLoading(false);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isLoading]);

  // โหลดไฟล์ PDF และจัดการ CORS
  useEffect(() => {
    const loadPdfFile = async () => {
      setIsLoading(true);
      setPdfFile(null); // Reset pdfFile ก่อนโหลดใหม่
      
      try {
        if (filePath.startsWith('http')) {
          // สำหรับไฟล์จาก Supabase Storage
          const response = await fetch(filePath, {
            mode: 'cors',
            credentials: 'omit'
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          setPdfFile(url);
        } else {
          // สำหรับไฟล์ local
          setPdfFile(filePath);
        }
      } catch (error) {
        console.error('Error loading PDF:', error);
        setPdfFile(filePath); // fallback ให้ลองใช้ path เดิม
        setIsLoading(false); // Set loading เป็น false เมื่อเกิด error
      }
    };

    loadPdfFile();

    // Cleanup blob URL เมื่อ component unmount หรือ filePath เปลี่ยน
    return () => {
      if (pdfFile && pdfFile.startsWith('blob:')) {
        URL.revokeObjectURL(pdfFile);
      }
    };
  }, [filePath]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages);
    setIsLoading(false);
    console.log('PDF loaded successfully:', { filePath, numPages });
  }

  function onDocumentLoadError(error: Error): void {
    console.error('PDF load error:', error);
    console.log('Failed to load PDF:', { filePath, pdfFile });
    setIsLoading(false);
  }

  const pageNumbers = Array.from(new Array(numPages), (_, index) => index + 1);
  const isLastPage = numPages === 1 || currentVisiblePage === numPages;
  
  useEffect(() => {
    const handleScroll = () => {
      const container = document.querySelector('.pdf-document');
      if (!container) return;

      const pages = container.querySelectorAll('.pdf-page-container');
      const containerTop = container.scrollTop;
      const containerHeight = container.clientHeight;

      pages.forEach((page, index) => {
        const pageElement = page as HTMLElement;
        const pageTop = pageElement.offsetTop - containerTop;
        const pageHeight = pageElement.offsetHeight;

        // ถ้าหน้านี้อยู่ในมุมมองส่วนใหญ่
        if (pageTop < containerHeight / 2 && pageTop + pageHeight > containerHeight / 2) {
          setCurrentVisiblePage(index + 1);
        }
      });
    };

    const container = document.querySelector('.pdf-document');
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [numPages]);

  if (!pdfFile) {
    return (
      <div className="react-pdf-viewer">
        {showLoading && (
          <div className="pdf-loading">
            <div>กำลังโหลด PDF...</div>
            <div style={{ fontSize: '0.9rem', marginTop: '0.5rem', opacity: 0.7 }}>
              {title}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="react-pdf-viewer">
      <div className="pdf-controls">
        <div className="page-controls">
          <span className="page-info">
            {title}
          </span>
        </div>
        
        <div className="next-button-container">
          {isLastPage && hasNextDocument ? (
            <button className="next-document-btn" onClick={onNextDocument}>
              <span className="desktop-text">ไปยังบทถัดไป →</span>
              <span className="mobile-text">ถัดไป →</span>
            </button>
          ) : !isLastPage ? (
            <span className="next-page-text">
              <span className="desktop-text">เลื่อนลงเพื่อดูหน้าถัดไป</span>
              <span className="mobile-text">เลื่อนลง</span>
            </span>
          ) : null}
          <button className="download-btn-control" onClick={handleDownload} title="ดาวน์โหลด PDF">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span className="desktop-text">ดาวน์โหลด</span>
          </button>
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
      
      <div className="pdf-document">
        <Document
          file={pdfFile}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={
            <div className="pdf-loading">
              <div>กำลังโหลด PDF...</div>
            </div>
          }
          error={
            <div className="pdf-error">
              <div>ไม่สามารถโหลด PDF ได้</div>
              <div style={{ fontSize: '0.8rem', marginTop: '0.5rem', opacity: 0.7 }}>
                Path: {filePath}
              </div>
            </div>
          }
          options={options}
        >
          <div className="pdf-pages">
            {pageNumbers.map(pageNumber => (
              <div key={pageNumber} className="pdf-page-container">
                <Page 
                  pageNumber={pageNumber} 
                  scale={scale}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  loading={
                    <div className="pdf-loading" style={{ height: '400px' }}>
                      <div>กำลังโหลดหน้า {pageNumber}...</div>
                    </div>
                  }
                  error={
                    <div className="pdf-error" style={{ height: '400px' }}>
                      <div>ไม่สามารถโหลดหน้า {pageNumber} ได้</div>
                    </div>
                  }
                />
                {/* Page number indicator for mobile */}
                <div className="page-number-mobile">
                  หน้า {pageNumber} / {numPages}
                </div>
              </div>
            ))}
          </div>
        </Document>
      </div>
    </div>
  );
};
