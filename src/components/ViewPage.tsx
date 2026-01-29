import { useState, useEffect } from 'react';
import { PdfViewer } from './PdfViewer';
import { documentsApi, categoriesApi, type Document, type Category } from '../services/supabase-api';
import { supabase } from '../lib/supabase';

// Sortable Item Component สำหรับหน้า View (ไม่มี drag & drop)
function SortableItem({ 
  doc, 
  isSelected, 
  onSelect, 
  isChild = false 
}: { 
  doc: Document; 
  isSelected: boolean; 
  onSelect: (doc: Document) => void;
  isChild?: boolean;
}) {
  return (
    <div
      className={`doc-item ${isChild ? 'doc-item-child' : ''} ${isSelected ? 'active' : ''}`}
      onClick={() => onSelect(doc)}
    >
      <div className="doc-content">
        <div className="doc-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14,2 14,8 20,8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10,9 9,9 8,9"></polyline>
          </svg>
        </div>
        <span className="doc-title">{doc.title}</span>
      </div>
    </div>
  );
}

export const ViewPage = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      .channel('documents-changes-view')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'documents' },
        (payload) => {
          console.log('Documents change received:', payload);
          documentsApi.getAll().then(setDocuments).catch(console.error);
        }
      )
      .subscribe();

    const categoriesSubscription = supabase
      .channel('categories-changes-view')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'categories' },
        (payload) => {
          console.log('Categories change received:', payload);
          categoriesApi.getAll().then(setCategories).catch(console.error);
        }
      )
      .subscribe();

    // Cleanup subscriptions
    return () => {
      supabase.removeChannel(documentsSubscription);
      supabase.removeChannel(categoriesSubscription);
    };
  }, []);

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

  const handleDocumentSelect = async (doc: Document) => {
    setSelectedDoc(doc);
    
    // ถ้าเอกสารอยู่ในหมวดหมู่ ให้ขยายหมวดหมู่นั้นโดยอัตโนมัติ
    if (doc.category) {
      const category = categories.find(cat => cat.id === doc.category);
      if (category && !category.expanded) {
        const updatedCategories = categories.map(cat => 
          cat.id === doc.category 
            ? { ...cat, expanded: true }
            : cat
        );
        setCategories(updatedCategories);

        try {
          await categoriesApi.update(doc.category, { expanded: true });
        } catch (err) {
          console.error('Error updating category:', err);
        }
      }
    }
  };

  const handleNextDocument = async () => {
    if (!selectedDoc) return;
    
    const currentIndex = documents.findIndex(doc => doc.id === selectedDoc.id);
    const nextIndex = currentIndex + 1;
    
    if (nextIndex < documents.length) {
      const nextDoc = documents[nextIndex];
      setSelectedDoc(nextDoc);
        
      if (nextDoc.category) {
        const category = categories.find(cat => cat.id === nextDoc.category);
        if (category && !category.expanded) {
          const updatedCategories = categories.map(cat => 
            cat.id === nextDoc.category 
              ? { ...cat, expanded: true }
              : cat
          );
          setCategories(updatedCategories);

          try {
            await categoriesApi.update(nextDoc.category, { expanded: true });
          } catch (err) {
            console.error('Error updating category:', err);
          }
        }
      }
    }
  };

  const hasNextDocument = selectedDoc ? 
    documents.findIndex(doc => doc.id === selectedDoc.id) < documents.length - 1 : false;

  if (loading) {
    return (
      <div className="app-container">
        <div className="loading-message">
          <h2>กำลังโหลดข้อมูล...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-container">
        <div className="error-message">
          <h2>เกิดข้อผิดพลาด</h2>
          <p>{error}</p>
          <p>กรุณาตรวจสอบ:</p>
          <ul style={{textAlign: 'left', maxWidth: '400px'}}>
            <li>การตั้งค่า Supabase URL และ API Key</li>
            <li>การเชื่อมต่ออินเทอร์เน็ต</li>
            <li>ไฟล์ <code>.env.local</code> มีค่าที่ถูกต้อง</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>Smoke Detect</h1>
        </div>
        
        <nav className="doc-list">
          {/* เอกสารที่ไม่มีหมวดหมู่ */}
          {getUncategorizedDocuments().map((doc) => (
            <SortableItem
              key={doc.id}
              doc={doc}
              isSelected={selectedDoc?.id === doc.id}
              onSelect={handleDocumentSelect}
            />
          ))}

          {/* หมวดหมู่และเอกสารในหมวดหมู่ */}
          {categories.map((category) => (
            <div key={category.id} className="category-section">
              <button
                className="category-header"
                onClick={() => toggleCategory(category.id)}
              >
                <div className="category-icon">
                  <svg 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                    className={`chevron ${category.expanded ? 'expanded' : ''}`}
                  >
                    <polyline points="9,18 15,12 9,6"></polyline>
                  </svg>
                </div>
                <div className="folder-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                  </svg>
                </div>
                <span className="category-title">{category.title}</span>
              </button>
              
              {category.expanded && (
                <div className="category-documents">
                  {getDocumentsByCategory(category.id).map((doc) => (
                    <SortableItem
                      key={doc.id}
                      doc={doc}
                      isSelected={selectedDoc?.id === doc.id}
                      onSelect={handleDocumentSelect}
                      isChild={true}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </aside>
      
      <main className="main-content">
        {selectedDoc ? (
          <PdfViewer 
            filePath={selectedDoc.path}
            title={selectedDoc.title}
            onNextDocument={handleNextDocument}
            hasNextDocument={hasNextDocument}
          />
        ) : (
          <div className="welcome-message">
            <h2>เลือกเอกสารที่ต้องการดูจากเมนูด้านซ้าย</h2>
          </div>
        )}
      </main>
    </div>
  );
};