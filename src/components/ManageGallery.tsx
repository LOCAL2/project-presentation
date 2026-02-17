import { useState, useEffect } from 'react';
import { galleryApi, type GalleryItem } from '../services/gallery-api';
import { supabase } from '../lib/supabase';
import heic2any from 'heic2any';

export const ManageGallery = () => {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Form states
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

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

  const convertHeicToJpeg = async (file: File): Promise<File> => {
    try {
      const convertedBlob = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.9
      });

      // heic2any อาจคืนค่าเป็น Blob หรือ Blob[] ขึ้นอยู่กับไฟล์
      const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
      
      // สร้าง File object ใหม่จาก Blob
      const fileName = file.name.replace(/\.heic$/i, '.jpg').replace(/\.heif$/i, '.jpg');
      return new File([blob], fileName, { type: 'image/jpeg' });
    } catch (error) {
      console.error('Error converting HEIC:', error);
      throw new Error('ไม่สามารถแปลงไฟล์ HEIC ได้');
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) return;

    try {
      setUploading(true);
      setError(null);
      setUploadProgress(0);

      const maxOrder = Math.max(...items.map(item => item.order), -1);
      const newItems: GalleryItem[] = [];

      // อัปโหลดทีละไฟล์
      for (let i = 0; i < files.length; i++) {
        let file = files[i];
        
        // ตรวจสอบและแปลงไฟล์ HEIC
        const isHEIC = file.name.toLowerCase().endsWith('.heic') || 
                       file.name.toLowerCase().endsWith('.heif');
        
        if (isHEIC) {
          file = await convertHeicToJpeg(file);
        }
        
        const fileType = file.type.startsWith('image/') ? 'image' : 'video';
        
        // อัปโหลดไฟล์
        const fileUrl = await galleryApi.uploadFile(file, fileType);

        // สร้างชื่อจากชื่อไฟล์
        const title = file.name.replace(/\.[^/.]+$/, '');

        // สร้างรายการใหม่
        const newItem = await galleryApi.create({
          title,
          fileUrl,
          fileType,
          order: maxOrder + i + 1
        });

        newItems.push(newItem);
        setUploadProgress(Math.round(((i + 1) / files.length) * 100));
      }

      setItems(prev => [...prev, ...newItems]);
      setShowAddModal(false);
      resetForm();
    } catch (err) {
      console.error('Error adding items:', err);
      setError(err instanceof Error ? err.message : 'ไม่สามารถเพิ่มรายการได้');
    } finally {
      setUploading(false);
      setUploadProgress(0);
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
    setFiles([]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    // กรองเฉพาะไฟล์รูปภาพและวิดีโอ (รวม HEIC)
    const validFiles = selectedFiles.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const isHEIC = file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');
      return isImage || isVideo || isHEIC;
    });

    if (validFiles.length !== selectedFiles.length) {
      alert('บางไฟล์ไม่ใช่รูปภาพหรือวิดีโอ จะถูกข้ามไป');
    }

    setFiles(prev => [...prev, ...validFiles]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    const validFiles = droppedFiles.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const isHEIC = file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');
      return isImage || isVideo || isHEIC;
    });

    if (validFiles.length !== droppedFiles.length) {
      alert('บางไฟล์ไม่ใช่รูปภาพหรือวิดีโอ จะถูกข้ามไป');
    }

    setFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
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

      {/* Gallery Grid - 4 columns */}
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
        <div className="manage-gallery-grid manage-gallery-grid--4col">
          {items.map((item) => (
            <div key={item.id} className="manage-gallery-card">
              <div className="manage-gallery-card__media">
                {item.fileType === 'image' ? (
                  <img src={item.fileUrl} alt={item.title} loading="lazy" />
                ) : (
                  <div className="manage-gallery-card__video">
                    <video src={item.fileUrl} />
                    <div className="manage-gallery-card__play">▶</div>
                  </div>
                )}
              </div>
              <button 
                className="manage-gallery-card__delete"
                onClick={() => {
                  if (confirm(`ต้องการลบรูปภาพนี้หรือไม่?`)) {
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
              <h2 className="manage-modal__title">เพิ่มรูปภาพ</h2>
              <button className="manage-modal__close" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            
            <form onSubmit={handleAddItem} className="manage-modal__form">
              <div className="manage-form-group">
                <label className="manage-form-label">เลือกรูปภาพ *</label>
                <div 
                  className={`manage-file-dropzone ${isDragging ? 'manage-file-dropzone--dragging' : ''} ${files.length > 0 ? 'manage-file-dropzone--has-files' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    accept="image/*,.heic,.heif"
                    onChange={handleFileChange}
                    className="manage-file-upload__input"
                    id="gallery-file-upload"
                    multiple
                  />
                  <label htmlFor="gallery-file-upload" className="manage-file-dropzone__label">
                    {files.length === 0 ? (
                      <>
                        <div className="manage-file-dropzone__icon">📁</div>
                        <div className="manage-file-dropzone__text">
                          <strong>คลิกเพื่อเลือกรูปภาพ</strong> หรือลากไฟล์มาวางที่นี่
                        </div>
                        <div className="manage-file-dropzone__hint">
                          รองรับ: JPG, PNG, GIF, HEIC (สามารถเลือกหลายไฟล์พร้อมกัน)
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="manage-file-dropzone__icon">✓</div>
                        <div className="manage-file-dropzone__text">
                          <strong>เลือกแล้ว {files.length} ไฟล์</strong>
                        </div>
                        <div className="manage-file-dropzone__hint">
                          คลิกเพื่อเพิ่มรูปภาพเพิ่มเติม
                        </div>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* File Preview */}
              {files.length > 0 && (
                <div className="manage-form-group">
                  <label className="manage-form-label">รูปภาพที่เลือก ({files.length})</label>
                  <div className="manage-file-preview-grid">
                    {files.map((file, index) => (
                      <div key={index} className="manage-file-preview-item">
                        <img 
                          src={URL.createObjectURL(file)} 
                          alt={file.name}
                          onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
                        />
                        <button
                          type="button"
                          className="manage-file-preview-item__remove"
                          onClick={() => removeFile(index)}
                          title="ลบ"
                        >
                          ×
                        </button>
                        <div className="manage-file-preview-item__name">{file.name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Progress */}
              {uploading && (
                <div className="manage-form-group">
                  <div className="manage-upload-progress">
                    <div className="manage-upload-progress__bar" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                  <p className="manage-upload-progress__text">
                    กำลังอัพโหลด... {uploadProgress}%
                  </p>
                </div>
              )}

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
                  disabled={uploading || files.length === 0}
                >
                  {uploading ? `กำลังอัพโหลด... (${uploadProgress}%)` : `เพิ่ม ${files.length} รูปภาพ`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
