import { useState, useEffect, useMemo } from 'react';
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
  const [pdfFile, setPdfFile] = useState<string | null>(null);

  // Memoize options เพื่อป้องกัน unnecessary reloads
  const options = useMemo(() => ({
    cMapUrl: `https://unpkg.com/pdfjs-dist@5.4.296/cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `https://unpkg.com/pdfjs-dist@5.4.296/standard_fonts/`,
  }), []);

  // โหลดไฟล์ PDF และจัดการ CORS
  useEffect(() => {
    const loadPdfFile = async () => {
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
    console.log('PDF loaded successfully:', { filePath, numPages });
  }

  function onDocumentLoadError(error: Error): void {
    console.error('PDF load error:', error);
    console.log('Failed to load PDF:', { filePath, pdfFile });
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
        <div className="pdf-loading">กำลังโหลด PDF...</div>
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
          file={pdfFile}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={<div className="pdf-loading">กำลังโหลด PDF...</div>}
          error={<div className="pdf-error">ไม่สามารถโหลด PDF ได้<br/>Path: {filePath}</div>}
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
                  loading={<div className="pdf-loading">กำลังโหลดหน้า {pageNumber}...</div>}
                  error={<div className="pdf-error">ไม่สามารถโหลดหน้า {pageNumber} ได้</div>}
                />
              </div>
            ))}
          </div>
        </Document>
      </div>
    </div>
  );
};
