import { useState, useEffect } from 'react';
import { PdfViewer } from './PdfViewer';
import { documentsApi, categoriesApi, type Document, type Category } from '../services/supabase-api';
import { supabase } from '../lib/supabase';

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
        if (docsData.length > 0) {
          const firstDoc = docsData[0];
          setSelectedDoc(firstDoc);

          if (firstDoc.category) {
            const updatedCats = catsData.map(cat => 
              cat.id === firstDoc.category 
                ? { ...cat, expanded: true }
                : cat
            );
            setCategories(updatedCats);

            try {
              await categoriesApi.update(firstDoc.category, { expanded: true });
            } catch (err) {
              console.error('Error updating category:', err);
            }
          }
        }
        
        setError(null);
      } catch (err) {
        setError('ไม่สามารถโหลดข้อมูลได้ กรุณาตรวจสอบการเชื่อมต่อ Supabase');
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();

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
    setIsMobileMenuOpen(false); 

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
      <div className="loading-message">
        <h2>กำลังโหลดข้อมูล...</h2>
        <div className="loading-spinner"></div>
        <div className="loading-progress">
          <div className="loading-progress-bar"></div>
        </div>
        <p style={{marginTop: '1rem', opacity: 0.8}}>กำลังเชื่อมต่อกับ Database</p>
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
            <li>ตาราง documents และ categories ถูกสร้างใน Supabase แล้ว</li>
          </ul>
          <button 
            onClick={() => window.location.reload()} 
            style={{
              marginTop: '1rem',
              padding: '0.75rem 1.5rem',
              background: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            ลองใหม่อีกครั้ง
          </button>
        </div>
      </div>
    );
  }

  const hasDocuments = documents.length > 0;
  const hasCategories = categories.length > 0;

  console.log('ViewPage data:', { 
    documentsCount: documents.length, 
    categoriesCount: categories.length,
    documents,
    categories 
  });

  return (
    <div className="app-container">
      <header className="mobile-header">
        <div className="mobile-header__content">
          <h1 className="mobile-header__title">
            {selectedDoc ? selectedDoc.title : 'Smoke Detect'}
          </h1>
          <button 
            className="mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </div>
      </header>

      <div 
        className={`sidebar-overlay ${isMobileMenuOpen ? 'active' : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}
      ></div>
      
      <aside className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <h1>Smoke Detect</h1>
        </div>
        
        {!hasDocuments && !hasCategories ? (
          <div style={{
            padding: '2rem 1rem',
            textAlign: 'center',
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '0.9rem'
          }}>
            <p>ไม่มีเอกสารในระบบ</p>
            <p style={{marginTop: '0.5rem', fontSize: '0.8rem'}}>
              กรุณาเพิ่มเอกสารผ่านหน้า Manage
            </p>
            <a 
              href="/manage" 
              style={{
                display: 'inline-block',
                marginTop: '1rem',
                padding: '0.5rem 1rem',
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '6px',
                fontSize: '0.85rem'
              }}
            >
              ไปที่หน้า Manage
            </a>
          </div>
        ) : (
          <nav className="doc-list">
          {getUncategorizedDocuments().map((doc) => (
            <SortableItem
              key={doc.id}
              doc={doc}
              isSelected={selectedDoc?.id === doc.id}
              onSelect={handleDocumentSelect}
            />
          ))}

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
        )}
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