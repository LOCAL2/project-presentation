import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { documentsApi, categoriesApi, type Document, type Category } from '../services/supabase-api';
import { supabase } from '../lib/supabase';
import { storageApi } from '../services/storage';
import { ManageGallery } from './ManageGallery';
import { ManageMembers } from './ManageMembers';
import '../styles/manage.css';

// Sortable Document Card Component
function SortableDocumentCard({ 
  doc, 
  onDelete,
  onEdit,
  isChild = false 
}: { 
  doc: Document; 
  onDelete: (doc: Document) => void;
  onEdit: (doc: Document) => void;
  isChild?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: doc.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`manage-doc-card ${isChild ? 'manage-doc-card--child' : ''}`}
    >
      <div className="manage-doc-card__drag" {...attributes} {...listeners}>
        ⋮⋮
      </div>
      
      <div className="manage-doc-card__icon">
        📄
      </div>
      
      <div className="manage-doc-card__content">
        <h3 className="manage-doc-card__title">{doc.title}</h3>
        <p className="manage-doc-card__meta">
          {doc.type === 'canva' ? 'Canva Presentation' : 'PDF Document'}
        </p>
      </div>
      
      <button 
        className="manage-doc-card__edit"
        onClick={(e) => {
          e.stopPropagation();
          onEdit(doc);
        }}
        title="แก้ไขชื่อเอกสาร"
      >
        ✏️
      </button>
      
      <button 
        className="manage-doc-card__delete"
        onClick={(e) => {
          e.stopPropagation();
          if (confirm(`ต้องการลบเอกสาร "${doc.title}" หรือไม่?`)) {
            onDelete(doc);
          }
        }}
        title="ลบเอกสาร"
      >
        🗑️
      </button>
    </div>
  );
}

export const ManagePage = () => {
  const [activeTab, setActiveTab] = useState<'documents' | 'gallery' | 'members'>('documents');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [showEditDocumentModal, setShowEditDocumentModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [editDocumentTitle, setEditDocumentTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [documentType, setDocumentType] = useState<'pdf' | 'canva'>('pdf');
  const [canvaUrl, setCanvaUrl] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [docsData, catsData] = await Promise.all([
          documentsApi.getAll(),
          categoriesApi.getAll()
        ]);
        setDocuments(docsData);
        setCategories(catsData);
        setError(null);
      } catch (err) {
        setError('ไม่สามารถโหลดข้อมูลได้');
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    const documentsSubscription = supabase
      .channel('documents-changes-manage')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'documents' },
        () => {
          documentsApi.getAll().then(setDocuments).catch(console.error);
        }
      )
      .subscribe();

    const categoriesSubscription = supabase
      .channel('categories-changes-manage')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'categories' },
        () => {
          categoriesApi.getAll().then(setCategories).catch(console.error);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(documentsSubscription);
      supabase.removeChannel(categoriesSubscription);
    };
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id && over?.id) {
      const oldIndex = documents.findIndex((item) => item.id === active.id);
      const newIndex = documents.findIndex((item) => item.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newItems = arrayMove(documents, oldIndex, newIndex);
        const updatedItems = newItems.map((item, index) => ({
          ...item,
          order: index
        }));

        setDocuments(updatedItems);

        try {
          await documentsApi.updateOrder(updatedItems);
        } catch (err) {
          console.error('Error updating document order:', err);
          setError('ไม่สามารถบันทึกลำดับใหม่ได้');
        }
      }
    }
  };

  const handleDeleteDocument = async (doc: Document) => {
    try {
      setLoading(true);
      
      if (doc.path.includes('supabase')) {
        await storageApi.deleteFile(doc.path);
      }
      
      await documentsApi.delete(doc.id);
      setDocuments(prev => prev.filter(d => d.id !== doc.id));
      setError(null);
    } catch (err) {
      console.error('Error deleting document:', err);
      setError('ไม่สามารถลบเอกสารได้');
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = async (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    if (!category) return;

    const updatedCategory = { ...category, expanded: !category.expanded };
    const updatedCategories = categories.map(cat => 
      cat.id === categoryId ? updatedCategory : cat
    );
    
    setCategories(updatedCategories);

    try {
      await categoriesApi.update(categoryId, { expanded: updatedCategory.expanded });
    } catch (err) {
      console.error('Error updating category:', err);
    }
  };

  const getDocumentsByCategory = (categoryId: string) => {
    return documents.filter(doc => doc.category === categoryId);
  };

  const getUncategorizedDocuments = () => {
    return documents.filter(doc => !doc.category);
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (documentType === 'pdf' && !file) return;
    if (documentType === 'canva' && !canvaUrl.trim()) return;

    try {
      setLoading(true);
      
      let fileUrl = '';
      if (documentType === 'pdf' && file) {
        fileUrl = await storageApi.uploadPDF(file);
      }
      
      let categoryId = selectedCategory;
      
      if (newCategory.trim()) {
        const newCat = await categoriesApi.create({
          title: newCategory.trim(),
          expanded: true
        });
        categoryId = newCat.id;
        setCategories(prev => [...prev, newCat]);
      }
      
      const maxOrder = Math.max(...documents.map(doc => doc.order), -1);
      
      const newDocument = await documentsApi.create({
        title: title.trim(),
        path: fileUrl,
        category: categoryId || undefined,
        order: maxOrder + 1,
        type: documentType,
        canvaUrl: documentType === 'canva' ? canvaUrl.trim() : undefined
      });

      setDocuments(prev => [...prev, newDocument]);
      setShowAddModal(false);
      setTitle('');
      setFile(null);
      setSelectedCategory('');
      setNewCategory('');
      setDocumentType('pdf');
      setCanvaUrl('');
      setError(null);
    } catch (err) {
      console.error('Error adding document:', err);
      const errorMessage = err instanceof Error ? err.message : 'ไม่สามารถเพิ่มเอกสารได้';
      
      if (errorMessage.includes('canva_url') || errorMessage.includes('type') || errorMessage.includes('does not exist')) {
        setError('⚠️ Database ยังไม่รองรับ Canva - กรุณา refresh หน้าเว็บแล้วลองใหม่ หรือตรวจสอบว่ารัน SQL Migration สำเร็จแล้ว');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setEditCategoryName(category.title);
    setShowEditCategoryModal(true);
  };

  const handleEditDocument = (doc: Document) => {
    setEditingDocument(doc);
    setEditDocumentTitle(doc.title);
    setShowEditDocumentModal(true);
  };

  const handleUpdateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDocument || !editDocumentTitle.trim()) return;

    try {
      setLoading(true);
      await documentsApi.update(editingDocument.id, { title: editDocumentTitle.trim() });
      
      setDocuments(prev => prev.map(doc => 
        doc.id === editingDocument.id 
          ? { ...doc, title: editDocumentTitle.trim() }
          : doc
      ));
      
      setShowEditDocumentModal(false);
      setEditingDocument(null);
      setEditDocumentTitle('');
      setError(null);
    } catch (err) {
      console.error('Error updating document:', err);
      setError('ไม่สามารถแก้ไขชื่อเอกสารได้');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editCategoryName.trim()) return;

    try {
      setLoading(true);
      await categoriesApi.update(editingCategory.id, { title: editCategoryName.trim() });
      
      setCategories(prev => prev.map(cat => 
        cat.id === editingCategory.id 
          ? { ...cat, title: editCategoryName.trim() }
          : cat
      ));
      
      setShowEditCategoryModal(false);
      setEditingCategory(null);
      setEditCategoryName('');
      setError(null);
    } catch (err) {
      console.error('Error updating category:', err);
      setError('ไม่สามารถแก้ไขชื่อหมวดหมู่ได้');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (category: Category) => {
    const categoryDocs = getDocumentsByCategory(category.id);
    
    if (categoryDocs.length > 0) {
      if (!confirm(`หมวดหมู่ "${category.title}" มีเอกสาร ${categoryDocs.length} ไฟล์\nเอกสารเหล่านี้จะถูกย้ายไปยัง "เอกสารทั่วไป"\n\nต้องการลบหมวดหมู่นี้หรือไม่?`)) {
        return;
      }
      
      try {
        setLoading(true);
        
        for (const doc of categoryDocs) {
          await documentsApi.update(doc.id, { category: undefined });
        }
        
        await categoriesApi.delete(category.id);
        
        setCategories(prev => prev.filter(cat => cat.id !== category.id));
        setDocuments(prev => prev.map(doc => 
          doc.category === category.id 
            ? { ...doc, category: undefined }
            : doc
        ));
        
        setError(null);
      } catch (err) {
        console.error('Error deleting category:', err);
        setError('ไม่สามารถลบหมวดหมู่ได้');
      } finally {
        setLoading(false);
      }
    } else {
      if (!confirm(`ต้องการลบหมวดหมู่ "${category.title}" หรือไม่?`)) {
        return;
      }
      
      try {
        setLoading(true);
        await categoriesApi.delete(category.id);
        setCategories(prev => prev.filter(cat => cat.id !== category.id));
        setError(null);
      } catch (err) {
        console.error('Error deleting category:', err);
        setError('ไม่สามารถลบหมวดหมู่ได้');
      } finally {
        setLoading(false);
      }
    }
  };

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUncategorized = getUncategorizedDocuments().filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && documents.length === 0) {
    return (
      <div className="manage-page-loading">
        <div className="manage-spinner"></div>
        <p>กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  return (
    <div className="manage-page">
      {/* Header */}
      <header className="manage-header">
        <div className="manage-header__left">
          <Link to="/data" className="manage-back-btn">←</Link>
          <div className="manage-header__title-group">
            <h1 className="manage-header__title">จัดการเนื้อหา</h1>
            <p className="manage-header__subtitle">
              {activeTab === 'documents' 
                ? `${documents.length} เอกสารทั้งหมด` 
                : activeTab === 'gallery'
                ? 'แกลเลอรี่รูปภาพและวิดีโอ'
                : 'จัดการสมาชิกทีม'}
            </p>
          </div>
        </div>
        
        <div className="manage-header__right">
          {activeTab === 'documents' && (
            <>
              <input
                type="text"
                placeholder="ค้นหาเอกสาร..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="manage-search-input"
              />
              <Link to="/data" className="manage-btn manage-btn--secondary">
                👁️ ดูเอกสาร
              </Link>
              <button 
                className="manage-btn manage-btn--primary"
                onClick={() => setShowAddModal(true)}
              >
                + เพิ่มเอกสาร
              </button>
            </>
          )}
          {activeTab === 'gallery' && (
            <Link to="/picture" className="manage-btn manage-btn--secondary">
              👁️ ดูแกลเลอรี่
            </Link>
          )}
          {activeTab === 'members' && (
            <Link to="/members" className="manage-btn manage-btn--secondary">
              👁️ ดูสมาชิก
            </Link>
          )}
        </div>
      </header>

      {/* Tabs */}
      <div className="manage-tabs">
        <button
          className={`manage-tab ${activeTab === 'documents' ? 'manage-tab--active' : ''}`}
          onClick={() => setActiveTab('documents')}
        >
          📄 เอกสาร
        </button>
        <button
          className={`manage-tab ${activeTab === 'gallery' ? 'manage-tab--active' : ''}`}
          onClick={() => setActiveTab('gallery')}
        >
          📸 แกลเลอรี่
        </button>
        <button
          className={`manage-tab ${activeTab === 'members' ? 'manage-tab--active' : ''}`}
          onClick={() => setActiveTab('members')}
        >
          👥 สมาชิก
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="manage-alert manage-alert--error">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="manage-alert__close">×</button>
        </div>
      )}

      {/* Main Content */}
      <main className="manage-content">
        {activeTab === 'members' ? (
          <ManageMembers />
        ) : activeTab === 'gallery' ? (
          <ManageGallery />
        ) : (
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={documents.map(doc => doc.id)}
              strategy={verticalListSortingStrategy}
            >
            {/* Uncategorized Documents */}
            {filteredUncategorized.length > 0 && (
              <section className="manage-section">
                <h2 className="manage-section__title">เอกสารทั่วไป</h2>
                <div className="manage-doc-grid">
                  {filteredUncategorized.map((doc) => (
                    <SortableDocumentCard
                      key={doc.id}
                      doc={doc}
                      onDelete={handleDeleteDocument}
                      onEdit={handleEditDocument}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Categories */}
            {categories.map((category) => {
              const categoryDocs = getDocumentsByCategory(category.id).filter(doc =>
                doc.title.toLowerCase().includes(searchQuery.toLowerCase())
              );
              
              if (searchQuery && categoryDocs.length === 0) return null;
              
              return (
                <section key={category.id} className="manage-section">
                  <div className="manage-category-header-wrapper">
                    <button
                      className="manage-category-header"
                      onClick={() => toggleCategory(category.id)}
                    >
                      <div className="manage-category-header__left">
                        <span className={`manage-category-header__chevron ${category.expanded ? 'manage-category-header__chevron--expanded' : ''}`}>
                          ▼
                        </span>
                        📁
                        <h2 className="manage-category-header__title">{category.title}</h2>
                        <span className="manage-category-header__count">{categoryDocs.length}</span>
                      </div>
                    </button>
                    <div className="manage-category-actions">
                      <button
                        className="manage-category-action-btn manage-category-action-btn--edit"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditCategory(category);
                        }}
                        title="แก้ไขชื่อหมวดหมู่"
                      >
                        ✏️
                      </button>
                      <button
                        className="manage-category-action-btn manage-category-action-btn--delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCategory(category);
                        }}
                        title="ลบหมวดหมู่"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  
                  {category.expanded && (
                    <div className="manage-doc-grid">
                      {categoryDocs.map((doc) => (
                        <SortableDocumentCard
                          key={doc.id}
                          doc={doc}
                          onDelete={handleDeleteDocument}
                          onEdit={handleEditDocument}
                          isChild={true}
                        />
                      ))}
                    </div>
                  )}
                </section>
              );
            })}

            {/* Empty State */}
            {filteredDocuments.length === 0 && !loading && (
              <div className="manage-empty-state">
                <div className="manage-empty-state__icon">📄</div>
                <h3 className="manage-empty-state__title">
                  {searchQuery ? 'ไม่พบเอกสารที่ค้นหา' : 'ยังไม่มีเอกสาร'}
                </h3>
                <p className="manage-empty-state__description">
                  {searchQuery 
                    ? `ไม่พบเอกสารที่มีชื่อ "${searchQuery}"`
                    : 'เริ่มต้นโดยการเพิ่มเอกสาร PDF แรกของคุณ'
                  }
                </p>
                {!searchQuery && (
                  <button 
                    className="manage-btn manage-btn--primary"
                    onClick={() => setShowAddModal(true)}
                  >
                    + เพิ่มเอกสารแรก
                  </button>
                )}
              </div>
            )}
            </SortableContext>
          </DndContext>
        )}
      </main>

      {/* Add Document Modal */}
      {showAddModal && (
        <div className="manage-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="manage-modal" onClick={(e) => e.stopPropagation()}>
            <div className="manage-modal__header">
              <h2 className="manage-modal__title">เพิ่มเอกสารใหม่</h2>
              <button className="manage-modal__close" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            
            <form onSubmit={handleAddDocument} className="manage-modal__form">
              <div className="manage-form-group">
                <label className="manage-form-label">ประเภทเอกสาร *</label>
                <div className="manage-type-selector">
                  <button
                    type="button"
                    className={`manage-type-btn ${documentType === 'pdf' ? 'manage-type-btn--active' : ''}`}
                    onClick={() => setDocumentType('pdf')}
                  >
                    📄 PDF
                  </button>
                  <button
                    type="button"
                    className={`manage-type-btn ${documentType === 'canva' ? 'manage-type-btn--active' : ''}`}
                    onClick={() => setDocumentType('canva')}
                  >
                    🎨 Canva
                  </button>
                </div>
              </div>

              <div className="manage-form-group">
                <label className="manage-form-label">ชื่อเอกสาร *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="manage-form-input"
                  placeholder="กรอกชื่อเอกสาร"
                  required
                />
              </div>

              <div className="manage-form-group">
                <label className="manage-form-label">หมวดหมู่</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="manage-form-input"
                >
                  <option value="">ไม่มีหมวดหมู่</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.title}</option>
                  ))}
                </select>
              </div>

              <div className="manage-form-group">
                <label className="manage-form-label">หรือสร้างหมวดหมู่ใหม่</label>
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="manage-form-input"
                  placeholder="ชื่อหมวดหมู่ใหม่ (ถ้ามี)"
                />
              </div>

              {documentType === 'pdf' ? (
                <div className="manage-form-group">
                  <label className="manage-form-label">ไฟล์ PDF *</label>
                  <div className={`manage-file-upload ${file ? 'manage-file-upload--has-file' : ''}`}>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => {
                        const selectedFile = e.target.files?.[0];
                        if (selectedFile && selectedFile.type === 'application/pdf') {
                          setFile(selectedFile);
                          if (!title) {
                            setTitle(selectedFile.name.replace('.pdf', ''));
                          }
                        } else {
                          alert('กรุณาเลือกไฟล์ PDF เท่านั้น');
                        }
                      }}
                      className="manage-file-upload__input"
                      id="file-upload-modal"
                    />
                    <label htmlFor="file-upload-modal" className="manage-file-upload__label">
                      {file ? (
                        <span>✓ {file.name}</span>
                      ) : (
                        <span>📄 เลือกไฟล์ PDF</span>
                      )}
                    </label>
                  </div>
                </div>
              ) : (
                <div className="manage-form-group">
                  <label className="manage-form-label">Canva URL *</label>
                  <input
                    type="url"
                    value={canvaUrl}
                    onChange={(e) => setCanvaUrl(e.target.value)}
                    className="manage-form-input"
                    placeholder="https://www.canva.com/design/xxx/view?embed"
                    required
                  />
                  <p className="manage-form-hint">
                    💡 <strong>วิธีรับ URL ที่ใช้ embed ได้:</strong><br/>
                    1. เปิด Canva Design<br/>
                    2. คลิก Share → More → Embed<br/>
                    3. คัดลอก URL จาก <code>src="..."</code> ในโค้ด HTML<br/>
                    <br/>
                    ✅ ใช้ได้: <code>canva.com/design/xxx/view?embed</code><br/>
                    ❌ ใช้ไม่ได้: <code>xxx.my.canva.site</code> (มี CSP บล็อก)
                  </p>
                </div>
              )}

              <div className="manage-modal__actions">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)} 
                  className="manage-btn manage-btn--secondary"
                  disabled={loading}
                >
                  ยกเลิก
                </button>
                <button 
                  type="submit" 
                  className="manage-btn manage-btn--primary"
                  disabled={loading || !title.trim() || (documentType === 'pdf' && !file) || (documentType === 'canva' && !canvaUrl.trim())}
                >
                  {loading ? (documentType === 'pdf' ? 'กำลังอัพโหลด...' : 'กำลังบันทึก...') : 'เพิ่มเอกสาร'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {showEditCategoryModal && editingCategory && (
        <div className="manage-modal-overlay" onClick={() => setShowEditCategoryModal(false)}>
          <div className="manage-modal" onClick={(e) => e.stopPropagation()}>
            <div className="manage-modal__header">
              <h2 className="manage-modal__title">แก้ไขชื่อหมวดหมู่</h2>
              <button className="manage-modal__close" onClick={() => setShowEditCategoryModal(false)}>×</button>
            </div>
            
            <form onSubmit={handleUpdateCategory} className="manage-modal__form">
              <div className="manage-form-group">
                <label className="manage-form-label">ชื่อหมวดหมู่ *</label>
                <input
                  type="text"
                  value={editCategoryName}
                  onChange={(e) => setEditCategoryName(e.target.value)}
                  className="manage-form-input"
                  placeholder="กรอกชื่อหมวดหมู่"
                  required
                  autoFocus
                />
              </div>

              <div className="manage-modal__actions">
                <button 
                  type="button" 
                  onClick={() => setShowEditCategoryModal(false)} 
                  className="manage-btn manage-btn--secondary"
                  disabled={loading}
                >
                  ยกเลิก
                </button>
                <button 
                  type="submit" 
                  className="manage-btn manage-btn--primary"
                  disabled={loading || !editCategoryName.trim()}
                >
                  {loading ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Document Modal */}
      {showEditDocumentModal && editingDocument && (
        <div className="manage-modal-overlay" onClick={() => setShowEditDocumentModal(false)}>
          <div className="manage-modal" onClick={(e) => e.stopPropagation()}>
            <div className="manage-modal__header">
              <h2 className="manage-modal__title">แก้ไขชื่อเอกสาร</h2>
              <button className="manage-modal__close" onClick={() => setShowEditDocumentModal(false)}>×</button>
            </div>
            
            <form onSubmit={handleUpdateDocument} className="manage-modal__form">
              <div className="manage-form-group">
                <label className="manage-form-label">ชื่อเอกสาร *</label>
                <input
                  type="text"
                  value={editDocumentTitle}
                  onChange={(e) => setEditDocumentTitle(e.target.value)}
                  className="manage-form-input"
                  placeholder="กรอกชื่อเอกสาร"
                  required
                  autoFocus
                />
              </div>

              <div className="manage-modal__actions">
                <button 
                  type="button" 
                  onClick={() => setShowEditDocumentModal(false)} 
                  className="manage-btn manage-btn--secondary"
                  disabled={loading}
                >
                  ยกเลิก
                </button>
                <button 
                  type="submit" 
                  className="manage-btn manage-btn--primary"
                  disabled={loading || !editDocumentTitle.trim()}
                >
                  {loading ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
