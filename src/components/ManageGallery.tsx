import { useState, useEffect } from 'react';
import { galleryApi, type GalleryItem } from '../services/gallery-api';
import { supabase } from '../lib/supabase';

export const ManageGallery = () => {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'image' | 'video'>('image');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadGallery();

    const subscription = supabase
      .channel('gallery-changes-manage')
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
      setError(null);
    } catch (err) {
      setError('ไม่สามารถโหลดข้อมูลได้');
      console.error('Error loading gallery:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !file) return;

    try {
      setUploading(true);
      setError(null);

      // อัปโหลดไฟล์
      const fileUrl = await galleryApi.uploadFile(file, fileType);

      // สร้างรายการใหม่
      const maxOrder = Math.max(...items.map(item => item.order), -1);
      const newItem = await galleryApi.create({
        title: title.trim(),
        description: description.trim() || undefined,
        fileUrl,
        fileType,
        order: maxOrder + 1
      });

      setItems(prev => [...prev, newItem]);
      setShowAddModal(false);
      resetForm();
    } catch (err) {
      console.error('Error adding item:', err);
      setError('ไม่สามารถเพิ่มรายการได้');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteItem = async (item: GalleryItem) => {
    try {
      setLoading(true);
      
      // ลบไฟล์จาก Storage
      await galleryApi.deleteFile(item.fileUrl);
      
      // ลบจาก Database
      await galleryApi.delete(item.id);
      
      setItems(prev => prev.filter(i => i.id !== item.id));
      setError(null);
    } catch (err) {
      console.error('Error deleting item:', err);
      setError('ไม่สามารถลบรายการได้');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setFile(null);
    setFileType('image');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // ตรวจสอบประเภทไฟล์
    if (selectedFile.type.startsWith('image/')) {
      setFileType('image');
      setFile(selectedFile);
      if (!title) setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
    } else if (selectedFile.type.startsWith('video/')) {
      setFileType('video');
      setFile(selectedFile);
      if (!title) setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
    } else {
      alert('กรุณาเลือกไฟล์รูปภาพหรือวิดีโอเท่านั้น');
    }
  };

  if (loading && items.length === 0) {
    return (
      <div className="manage-gallery-loading">
        <div className="manage-spinner"></div>
        <p>กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  return (
    <div className="manage-gallery">
      {/* Header */}
      <div className="manage-gallery-header">
        <div>
          <h2>แกลเลอรี่รูปภาพและวิดีโอ</h2>
          <p className="manage-gallery-subtitle">{items.length} รายการ</p>
        </div>
        <button 
          className="manage-btn manage-btn--primary"
          onClick={() => setShowAddModal(true)}
        >
          + เพิ่มรูปภาพ/วิดีโอ
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="manage-alert manage-alert--error">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="manage-alert__close">×</button>
        </div>
      )}

      {/* Gallery Grid */}
      {items.length === 0 ? (
        <div className="manage-empty-state">
          <div className="manage-empty-state__icon">📸</div>
          <h3 className="manage-empty-state__title">ยังไม่มีรูปภาพหรือวิดีโอ</h3>
          <p className="manage-empty-state__description">
            เริ่มต้นโดยการเพิ่มรูปภาพหรือวิดีโอแรกของคุณ
          </p>
          <button 
            className="manage-btn manage-btn--primary"
            onClick={() => setShowAddModal(true)}
          >
            + เพิ่มรายการแรก
          </button>
        </div>
      ) : (
        <div className="manage-gallery-grid">
          {items.map((item) => (
            <div key={item.id} className="manage-gallery-card">
              <div className="manage-gallery-card__media">
                {item.fileType === 'image' ? (
                  <img src={item.fileUrl} alt={item.title} />
                ) : (
                  <div className="manage-gallery-card__video">
                    <video src={item.fileUrl} />
                    <div className="manage-gallery-card__play">▶</div>
                  </div>
                )}
              </div>
              <div className="manage-gallery-card__content">
                <h3>{item.title}</h3>
                {item.description && <p>{item.description}</p>}
                <span className="manage-gallery-card__type">
                  {item.fileType === 'image' ? '📷 รูปภาพ' : '🎬 วิดีโอ'}
                </span>
              </div>
              <button 
                className="manage-gallery-card__delete"
                onClick={() => {
                  if (confirm(`ต้องการลบ "${item.title}" หรือไม่?`)) {
                    handleDeleteItem(item);
                  }
                }}
                title="ลบ"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="manage-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="manage-modal" onClick={(e) => e.stopPropagation()}>
            <div className="manage-modal__header">
              <h2 className="manage-modal__title">เพิ่มรูปภาพ/วิดีโอ</h2>
              <button className="manage-modal__close" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            
            <form onSubmit={handleAddItem} className="manage-modal__form">
              <div className="manage-form-group">
                <label className="manage-form-label">ชื่อ *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="manage-form-input"
                  placeholder="กรอกชื่อ"
                  required
                />
              </div>

              <div className="manage-form-group">
                <label className="manage-form-label">คำอธิบาย</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="manage-form-input"
                  placeholder="กรอกคำอธิบาย (ถ้ามี)"
                  rows={3}
                />
              </div>

              <div className="manage-form-group">
                <label className="manage-form-label">ไฟล์ *</label>
                <div className={`manage-file-upload ${file ? 'manage-file-upload--has-file' : ''}`}>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    className="manage-file-upload__input"
                    id="gallery-file-upload"
                  />
                  <label htmlFor="gallery-file-upload" className="manage-file-upload__label">
                    {file ? (
                      <span>✓ {file.name}</span>
                    ) : (
                      <span>📁 เลือกรูปภาพหรือวิดีโอ</span>
                    )}
                  </label>
                </div>
                <p className="manage-form-hint">
                  รองรับ: รูปภาพ (JPG, PNG, GIF) และวิดีโอ (MP4, WebM)
                </p>
              </div>

              <div className="manage-modal__actions">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)} 
                  className="manage-btn manage-btn--secondary"
                  disabled={uploading}
                >
                  ยกเลิก
                </button>
                <button 
                  type="submit" 
                  className="manage-btn manage-btn--primary"
                  disabled={uploading || !title.trim() || !file}
                >
                  {uploading ? 'กำลังอัพโหลด...' : 'เพิ่ม'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
