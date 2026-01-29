import { useState, useEffect } from 'react';
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
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { documentsApi, categoriesApi, type Document, type Category } from '../services/supabase-api';
import { supabase } from '../lib/supabase';
import { storageApi } from '../services/storage';

// Modern Icons
const Icons = {
  Document: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14,2 14,8 20,8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10,9 9,9 8,9"/>
    </svg>
  ),
  Folder: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  ChevronDown: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="6,9 12,15 18,9"/>
    </svg>
  ),
  Plus: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  Trash: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3,6 5,6 21,6"/>
      <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
      <line x1="10" y1="11" x2="10" y2="17"/>
      <line x1="14" y1="11" x2="14" y2="17"/>
    </svg>
  ),
  GripVertical: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="12" r="1"/>
      <circle cx="9" cy="5" r="1"/>
      <circle cx="9" cy="19" r="1"/>
      <circle cx="15" cy="12" r="1"/>
      <circle cx="15" cy="5" r="1"/>
      <circle cx="15" cy="19" r="1"/>
    </svg>
  ),
  Upload: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17,8 12,3 7,8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  ),
  X: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  Check: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20,6 9,17 4,12"/>
    </svg>
  )
};

// Placeholder Component สำหรับ drop zones
function PlaceholderItem({ id }: { id: string }) {
  const {
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="drop-placeholder"
    />
  );
}

// Modern Document Item Component
function DocumentItem({ 
  doc, 
  onDelete,
  isChild = false 
}: { 
  doc: Document; 
  onDelete: (doc: Document) => void;
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
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`ต้องการลบเอกสาร "${doc.title}" หรือไม่?`)) {
      onDelete(doc);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`document-item ${isChild ? 'document-item--child' : ''} ${isDragging ? 'document-item--dragging' : ''}`}
    >
      <div className="document-item__content">
        <div className="document-item__icon">
          <Icons.Document />
        </div>
        <div className="document-item__info">
          <h3 className="document-item__title">{doc.title}</h3>
          <p className="document-item__meta">PDF Document</p>
        </div>
      </div>
      
      <div className="document-item__actions">
        <button 
          className="document-item__drag-handle"
          {...attributes}
          {...listeners}
          title="ลากเพื่อจัดเรียง"
        >
          <Icons.GripVertical />
        </button>
        <button 
          className="document-item__delete"
          onClick={handleDelete}
          title="ลบเอกสาร"
        >
          <Icons.Trash />
        </button>
      </div>
    </div>
  );
}

// Modern Category Component
function CategorySection({ 
  category, 
  documents, 
  onToggle, 
  onDeleteDocument 
}: { 
  category: Category;
  documents: Document[];
  onToggle: (id: string) => void;
  onDeleteDocument: (doc: Document) => void;
}) {
  return (
    <div className="category-section">
      <button
        className="category-header"
        onClick={() => onToggle(category.id)}
      >
        <div className="category-header__icon">
          <Icons.Folder />
        </div>
        <div className="category-header__content">
          <h2 className="category-header__title">{category.title}</h2>
          <span className="category-header__count">{documents.length} เอกสาร</span>
        </div>
        <div className={`category-header__chevron ${category.expanded ? 'category-header__chevron--expanded' : ''}`}>
          <Icons.ChevronDown />
        </div>
      </button>
      
      {category.expanded && (
        <div className="category-content">
          {documents.map((doc) => (
            <DocumentItem
              key={doc.id}
              doc={doc}
              onDelete={onDeleteDocument}
              isChild={true}
            />
          ))}
          {documents.length === 0 && (
            <div className="category-empty">
              <p>ไม่มีเอกสารในหมวดหมู่นี้</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Modern Add Document Modal
function AddDocumentModal({ 
  isOpen, 
  onClose, 
  onAdd, 
  categories, 
  loading 
}: {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: { title: string; file: File; category?: string; newCategory?: string }) => void;
  categories: Category[];
  loading: boolean;
}) {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !file) return;
    
    onAdd({
      title: title.trim(),
      file,
      category: selectedCategory || undefined,
      newCategory: newCategory.trim() || undefined
    });
    
    // Reset form
    setTitle('');
    setFile(null);
    setSelectedCategory('');
    setNewCategory('');
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0] && files[0].type === 'application/pdf') {
      setFile(files[0]);
      if (!title) {
        setTitle(files[0].name.replace('.pdf', ''));
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      if (!title) {
        setTitle(selectedFile.name.replace('.pdf', ''));
      }
    } else {
      alert('กรุณาเลือกไฟล์ PDF เท่านั้น');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">เพิ่มเอกสารใหม่</h2>
          <button className="modal__close" onClick={onClose}>
            <Icons.X />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal__form">
          <div className="form-group">
            <label className="form-label">ชื่อเอกสาร</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-input"
              placeholder="กรอกชื่อเอกสาร"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">หมวดหมู่</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="form-select"
            >
              <option value="">ไม่มีหมวดหมู่</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.title}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">หรือสร้างหมวดหมู่ใหม่</label>
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="form-input"
              placeholder="ชื่อหมวดหมู่ใหม่"
            />
          </div>

          <div className="form-group">
            <label className="form-label">ไฟล์ PDF</label>
            <div 
              className={`file-upload ${dragActive ? 'file-upload--active' : ''} ${file ? 'file-upload--has-file' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="file-upload__input"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="file-upload__label">
                {file ? (
                  <div className="file-upload__success">
                    <Icons.Check />
                    <span>{file.name}</span>
                  </div>
                ) : (
                  <div className="file-upload__placeholder">
                    <Icons.Upload />
                    <span>ลากไฟล์ PDF มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์</span>
                  </div>
                )}
              </label>
            </div>
          </div>

          <div className="modal__actions">
            <button 
              type="button" 
              onClick={onClose} 
              className="btn btn--secondary"
              disabled={loading}
            >
              ยกเลิก
            </button>
            <button 
              type="submit" 
              className="btn btn--primary"
              disabled={loading || !title.trim() || !file}
            >
              {loading ? 'กำลังอัพโหลด...' : 'เพิ่มเอกสาร'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export const ManagePage = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // โหลดข้อมูลเริ่มต้น
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
        setError('ไม่สามารถโหลดข้อมูลได้ กรุณาตรวจสอบการเชื่อมต่อ Supabase');
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Subscribe to real-time changes
    const documentsSubscription = supabase
      .channel('documents-changes-manage')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'documents' },
        (payload) => {
          console.log('Documents change received:', payload);
          documentsApi.getAll().then(setDocuments).catch(console.error);
        }
      )
      .subscribe();

    const categoriesSubscription = supabase
      .channel('categories-changes-manage')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'categories' },
        (payload) => {
          console.log('Categories change received:', payload);
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
      const draggedItem = documents.find(item => item.id === active.id);
      if (!draggedItem) return;

      let newItems: Document[];

      if (over.id === 'placeholder-before-categories') {
        const otherItems = documents.filter(item => item.id !== active.id);
        const uncategorizedItems = otherItems.filter(item => !item.category);
        const categorizedItems = otherItems.filter(item => item.category);
        
        newItems = [...uncategorizedItems, draggedItem, ...categorizedItems];
      }
      else if (over.id === 'placeholder-after-categories') {
        const otherItems = documents.filter(item => item.id !== active.id);
        newItems = [...otherItems, draggedItem];
      }
      else {
        const oldIndex = documents.findIndex((item) => item.id === active.id);
        const newIndex = documents.findIndex((item) => item.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          newItems = arrayMove(documents, oldIndex, newIndex);
        } else {
          return;
        }
      }

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
  };

  const handleDeleteDocument = async (doc: Document) => {
    try {
      setLoading(true);
      
      // ลบไฟล์จาก Storage (ถ้าเป็นไฟล์ที่อัพโหลด)
      if (doc.path.includes('supabase')) {
        await storageApi.deleteFile(doc.path);
      }
      
      // ลบจากฐานข้อมูล
      await documentsApi.delete(doc.id);
      
      // อัพเดท state
      setDocuments(prev => prev.filter(d => d.id !== doc.id));
      setError(null);
    } catch (err) {
      console.error('Error deleting document:', err);
      setError('ไม่สามารถลบเอกสารได้: ' + (err as Error).message);
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
      setError('ไม่สามารถบันทึกสถานะหมวดหมู่ได้');
    }
  };

  const getDocumentsByCategory = (categoryId: string) => {
    return documents.filter(doc => doc.category === categoryId);
  };

  const getUncategorizedDocuments = () => {
    return documents.filter(doc => !doc.category);
  };

  const placeholderItems = [
    'placeholder-before-categories',
    'placeholder-after-categories'
  ];

  const allSortableItems = [
    ...documents.map(doc => doc.id),
    ...placeholderItems
  ];

  const handleAddDocument = async (data: { title: string; file: File; category?: string; newCategory?: string }) => {
    try {
      setLoading(true);
      
      const fileUrl = await storageApi.uploadPDF(data.file);
      
      let categoryId = data.category;
      
      if (data.newCategory) {
        const newCat = await categoriesApi.create({
          title: data.newCategory,
          expanded: true
        });
        categoryId = newCat.id;
        setCategories(prev => [...prev, newCat]);
      }
      
      const maxOrder = Math.max(...documents.map(doc => doc.order), -1);
      
      const newDocument = await documentsApi.create({
        title: data.title,
        path: fileUrl,
        category: categoryId || undefined,
        order: maxOrder + 1
      });

      setDocuments(prev => [...prev, newDocument]);
      setShowAddModal(false);
      setError(null);
    } catch (err) {
      console.error('Error adding document:', err);
      setError('ไม่สามารถเพิ่มเอกสารได้: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Filter documents based on search query
  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUncategorized = getUncategorizedDocuments().filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && documents.length === 0) {
    return (
      <div className="manage-page">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="manage-page">
      <div className="manage-header">
        <div className="manage-header__content">
          <h1 className="manage-header__title">จัดการเอกสาร</h1>
          <p className="manage-header__subtitle">จัดการ จัดเรียง และเพิ่มเอกสาร PDF</p>
        </div>
        
        <div className="manage-header__actions">
          <div className="search-box">
            <input
              type="text"
              placeholder="ค้นหาเอกสาร..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          <button 
            className="btn btn--primary btn--large"
            onClick={() => setShowAddModal(true)}
          >
            <Icons.Plus />
            เพิ่มเอกสาร
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert--error">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="alert__close">
            <Icons.X />
          </button>
        </div>
      )}

      <div className="manage-content">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card__icon">
              <Icons.Document />
            </div>
            <div className="stat-card__content">
              <h3 className="stat-card__number">{documents.length}</h3>
              <p className="stat-card__label">เอกสารทั้งหมด</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card__icon">
              <Icons.Folder />
            </div>
            <div className="stat-card__content">
              <h3 className="stat-card__number">{categories.length}</h3>
              <p className="stat-card__label">หมวดหมู่</p>
            </div>
          </div>
        </div>

        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={allSortableItems}
            strategy={verticalListSortingStrategy}
          >
            <div className="documents-container">
              {/* เอกสารที่ไม่มีหมวดหมู่ */}
              {filteredUncategorized.length > 0 && (
                <div className="uncategorized-section">
                  <h2 className="section-title">เอกสารทั่วไป</h2>
                  <div className="documents-grid">
                    {filteredUncategorized.map((doc) => (
                      <DocumentItem
                        key={doc.id}
                        doc={doc}
                        onDelete={handleDeleteDocument}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Placeholder ก่อนหมวดหมู่ */}
              <PlaceholderItem id="placeholder-before-categories" />

              {/* หมวดหมู่และเอกสารในหมวดหมู่ */}
              {categories.map((category) => {
                const categoryDocs = getDocumentsByCategory(category.id).filter(doc =>
                  doc.title.toLowerCase().includes(searchQuery.toLowerCase())
                );
                
                if (searchQuery && categoryDocs.length === 0) return null;
                
                return (
                  <CategorySection
                    key={category.id}
                    category={category}
                    documents={categoryDocs}
                    onToggle={toggleCategory}
                    onDeleteDocument={handleDeleteDocument}
                  />
                );
              })}

              {/* Placeholder หลังหมวดหมู่ */}
              <PlaceholderItem id="placeholder-after-categories" />

              {/* Empty State */}
              {filteredDocuments.length === 0 && !loading && (
                <div className="empty-state">
                  <div className="empty-state__icon">
                    <Icons.Document />
                  </div>
                  <h3 className="empty-state__title">
                    {searchQuery ? 'ไม่พบเอกสารที่ค้นหา' : 'ยังไม่มีเอกสาร'}
                  </h3>
                  <p className="empty-state__description">
                    {searchQuery 
                      ? `ไม่พบเอกสารที่มีชื่อ "${searchQuery}"`
                      : 'เริ่มต้นโดยการเพิ่มเอกสาร PDF แรกของคุณ'
                    }
                  </p>
                  {!searchQuery && (
                    <button 
                      className="btn btn--primary"
                      onClick={() => setShowAddModal(true)}
                    >
                      <Icons.Plus />
                      เพิ่มเอกสารแรก
                    </button>
                  )}
                </div>
              )}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      <AddDocumentModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddDocument}
        categories={categories}
        loading={loading}
      />
    </div>
  );
};