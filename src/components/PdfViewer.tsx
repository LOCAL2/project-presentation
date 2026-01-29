import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// ตั้งค่า worker ให้ใช้ไฟล์ local
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

interface PdfViewerProps {
  filePath: string;
  title: string;
  onNextDocument?: () => void;
  hasNextDocument?: boolean;
}

export const PdfViewer = ({ filePath, title, onNextDocument, hasNextDocument }: PdfViewerProps) => {
  const [numPages, setNumPages] = useState<number>();
  const [scale] = useState<number>(0.97);
  const [currentVisiblePage, setCurrentVisiblePage] = useState<number>(1);
  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages);
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
  }, []);

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
              ไปยังบทถัดไป →
            </button>
          ) : (
            <span className="next-page-text">
              เลื่อนลงเพื่อดูหน้าถัดไป
            </span>
          )}
        </div>
      </div>
      
      <div className="pdf-document">
        <Document
          file={filePath}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={<div className="pdf-loading">กำลังโหลด PDF...</div>}
          error={<div className="pdf-error">ไม่สามารถโหลด PDF ได้</div>}
        >
          <div className="pdf-pages">
            {pageNumbers.map(pageNumber => (
              <div key={pageNumber} className="pdf-page-container">
                <Page 
                  pageNumber={pageNumber} 
                  scale={scale}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              </div>
            ))}
          </div>
        </Document>
      </div>
    </div>
  );
};
