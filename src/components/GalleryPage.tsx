import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { galleryApi, type GalleryItem } from '../services/gallery-api';
import { supabase } from '../lib/supabase';
import DomeGallery from './DomeGallery';

export const GalleryPage = () => {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // แปลง GalleryItem เป็น format ที่ DomeGallery ต้องการ (ต้องอยู่ก่อน useEffect)
  const images = items.map(item => ({
    src: item.fileUrl,
    alt: item.title
  }));

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

  // Preload รูปแรกๆ เพื่อให้โหลดเร็ว
  useEffect(() => {
    if (images.length > 0) {
      const preloadCount = Math.min(15, images.length);
      images.slice(0, preloadCount).forEach(img => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = img.src;
        document.head.appendChild(link);
      });
    }
  }, [images.length]); // เปลี่ยนจาก images เป็น images.length เพื่อไม่ให้ re-run บ่อย

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
    <div style={{ width: '100vw', height: '100vh', position: 'relative', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
      {/* Header */}
      <header style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        padding: '1rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/" className="back-link" style={{
            background: '#f8f9fa',
            color: '#495057',
            border: '1px solid #dee2e6',
            padding: '0.5rem 0.75rem',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 600,
            transition: 'all 0.2s'
          }}>←</Link>
          <div>
            <h1 style={{ color: '#1a202c', margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>บรรยากาศการทำโปรเจค</h1>
            <p style={{ color: '#6c757d', margin: 0, fontSize: '0.875rem' }}>
              {items.length} รายการ
            </p>
          </div>
        </div>
        <Link 
          to="/data" 
          className="next-document-btn" 
          style={{ 
            textDecoration: 'none',
            background: '#495057',
            color: 'white',
            padding: '0.75rem 1.5rem',
            borderRadius: '10px',
            border: 'none',
            fontWeight: 600,
            transition: 'all 0.2s',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
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
          color: '#495057'
        }}>
          <div style={{ fontSize: '5rem', marginBottom: '1rem', opacity: 0.6 }}>📸</div>
          <h2 style={{ fontSize: '1.5rem', margin: '0 0 0.5rem 0', color: '#1a202c' }}>ยังไม่มีรูปภาพหรือวิดีโอ</h2>
          <p style={{ margin: 0, opacity: 0.8 }}>เพิ่มรูปภาพหรือวิดีโอผ่านหน้า Manage</p>
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
