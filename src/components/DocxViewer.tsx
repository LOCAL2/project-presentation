import { useState, useEffect } from 'react';
import mammoth from 'mammoth';

interface DocxViewerProps {
  filePath: string;
  title: string;
}

export const DocxViewer = ({ filePath, title }: DocxViewerProps) => {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const loadDocx = async () => {
      try {
        setLoading(true);
        const response = await fetch(filePath);
        const arrayBuffer = await response.arrayBuffer();
        
        const result = await mammoth.convertToHtml({ arrayBuffer });
        setHtmlContent(result.value);
        setError('');
      } catch (err) {
        setError('ไม่สามารถโหลดไฟล์ได้');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadDocx();
  }, [filePath]);

  if (loading) {
    return <div className="loading">กำลังโหลด...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="docx-viewer">
      <h2>{title}</h2>
      <div 
        className="docx-content"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  );
};
