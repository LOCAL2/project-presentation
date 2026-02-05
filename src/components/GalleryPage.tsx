import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { galleryApi, type GalleryItem } from '../services/gallery-api';
import { supabase } from '../lib/supabase';

export const GalleryPage = () => {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);

  useEffect(() => {
    loadGallery();

    const subscription = supabase
      .channel('gallery-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'gallery' },
        () => {
          galleryApi.getAll().then(setItems).catch(console.error);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const loadGallery = async () => {
    try {
      setLoading(true);
      const data = await galleryApi.getAll();
      setItems(data);
    } catch (err) {
      console.error('Error loading gallery:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="gallery-loading">
        <div className="loading-spinner"></div>
        <p>กำลังโหลดแกลเลอรี่...</p>
      </div>
    );
  }

  return (
    <div className="gallery-container">
      <header className="gallery-header">
        <div className="gallery-header-content">
          <Link to="/" className="back-link">←</Link>
          <div>
            <h1>บรรยากาศการทำโปรเจค</h1>
            <p className="gallery-subtitle">{items.length} รายการ</p>
          </div>
        </div>
      </header>

      {items.length === 0 ? (
        <div className="gallery-empty">
          <div className="gallery-empty-icon">📸</div>
          <h2>ยังไม่มีรูปภาพหรือวิดีโอ</h2>
          <p>เพิ่มรูปภาพหรือวิดีโอผ่านหน้า Manage</p>
          <Link to="/manage" className="gallery-empty-btn">
            ไปที่หน้า Manage
          </Link>
        </div>
      ) : (
        <div className="gallery-grid">
          {items.map((item) => (
            <div 
              key={item.id} 
              className="gallery-item"
              onClick={() => setSelectedItem(item)}
            >
              {item.fileType === 'image' ? (
                <img 
                  src={item.fileUrl} 
                  alt={item.title}
                  className="gallery-item-media"
                />
              ) : (
                <div className="gallery-item-video-preview">
                  <video 
                    src={item.fileUrl}
                    className="gallery-item-media"
                    muted
                  />
                  <div className="gallery-play-icon">▶</div>
                </div>
              )}
              <div className="gallery-item-overlay">
                <h3 className="gallery-item-title">{item.title}</h3>
                {item.description && (
                  <p className="gallery-item-description">{item.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal สำหรับดูรูป/วิดีโอแบบเต็มหน้าจอ */}
      {selectedItem && (
        <div className="gallery-modal" onClick={() => setSelectedItem(null)}>
          <div className="gallery-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="gallery-modal-close" onClick={() => setSelectedItem(null)}>
              ×
            </button>
            <div className="gallery-modal-media">
              {selectedItem.fileType === 'image' ? (
                <img src={selectedItem.fileUrl} alt={selectedItem.title} />
              ) : (
                <video src={selectedItem.fileUrl} controls autoPlay />
              )}
            </div>
            <div className="gallery-modal-info">
              <h2>{selectedItem.title}</h2>
              {selectedItem.description && <p>{selectedItem.description}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
