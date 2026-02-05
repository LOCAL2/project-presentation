import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { galleryApi, type GalleryItem } from '../services/gallery-api';
import { supabase } from '../lib/supabase';
import DomeGallery from './DomeGallery';

export const GalleryPage = () => {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);

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

  // แปลง GalleryItem เป็น format ที่ DomeGallery ต้องการ
  const images = items.map(item => ({
    src: item.fileUrl,
    alt: item.title
  }));

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', background: '#ffffff' }}>
      {/* Header */}
      <header style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        padding: '1rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #e5e7eb',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/" className="back-link" style={{
            background: '#f9fafb',
            color: '#374151',
            border: '1px solid #e5e7eb'
          }}>←</Link>
          <div>
            <h1 style={{ color: '#1f2937', margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>บรรยากาศการทำโปรเจค</h1>
            <p style={{ color: '#6b7280', margin: 0, fontSize: '0.875rem' }}>
              {items.length} รายการ
            </p>
          </div>
        </div>
        <Link 
          to="/data" 
          className="next-document-btn" 
          style={{ 
            textDecoration: 'none',
            background: '#1f2937',
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            border: 'none'
          }}
        >
          ไปหน้าถัดไป →
        </Link>
      </header>

      {/* Dome Gallery */}
      {items.length === 0 ? (
        <div className="gallery-empty" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          color: '#1f2937'
        }}>
          <div style={{ fontSize: '5rem', marginBottom: '1rem', opacity: 0.5 }}>📸</div>
          <h2 style={{ fontSize: '1.5rem', margin: '0 0 0.5rem 0' }}>ยังไม่มีรูปภาพหรือวิดีโอ</h2>
          <p style={{ margin: 0, opacity: 0.7 }}>เพิ่มรูปภาพหรือวิดีโอผ่านหน้า Manage</p>
        </div>
      ) : (
        <DomeGallery
          images={images}
          fit={2.756}
          minRadius={600}
          maxVerticalRotationDeg={0}
          segments={34}
          dragDampening={2}
          grayscale={false}
        />
      )}
    </div>
  );
};
