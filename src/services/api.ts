const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : 'http://localhost:3001';

export interface Document {
  id: string;
  title: string;
  path: string;
  category?: string;
  order: number;
}

export interface Category {
  id: string;
  title: string;
  expanded: boolean;
}

// Documents API
export const documentsApi = {
  // ดึงเอกสารทั้งหมด
  async getAll(): Promise<Document[]> {
    const response = await fetch(`${API_BASE_URL}/documents`);
    if (!response.ok) throw new Error('Failed to fetch documents');
    return response.json();
  },

  // เพิ่มเอกสารใหม่
  async create(document: Omit<Document, 'id'>): Promise<Document> {
    const response = await fetch(`${API_BASE_URL}/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(document),
    });
    if (!response.ok) throw new Error('Failed to create document');
    return response.json();
  },

  // อัพเดทเอกสาร
  async update(id: string, document: Partial<Document>): Promise<Document> {
    const response = await fetch(`${API_BASE_URL}/documents?id=${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(document),
    });
    if (!response.ok) throw new Error('Failed to update document');
    return response.json();
  },

  // อัพเดทลำดับเอกสารทั้งหมด
  async updateOrder(documents: Document[]): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/documents`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        updateOrder: true, 
        documents 
      }),
    });
    if (!response.ok) throw new Error('Failed to update document order');
  },

  // ลบเอกสาร
  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/documents?id=${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete document');
  },
};

// Categories API
export const categoriesApi = {
  // ดึงหมวดหมู่ทั้งหมด
  async getAll(): Promise<Category[]> {
    const response = await fetch(`${API_BASE_URL}/categories`);
    if (!response.ok) throw new Error('Failed to fetch categories');
    return response.json();
  },

  // เพิ่มหมวดหมู่ใหม่
  async create(category: Omit<Category, 'id'>): Promise<Category> {
    const response = await fetch(`${API_BASE_URL}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(category),
    });
    if (!response.ok) throw new Error('Failed to create category');
    return response.json();
  },

  // อัพเดทหมวดหมู่
  async update(id: string, category: Partial<Category>): Promise<Category> {
    const response = await fetch(`${API_BASE_URL}/categories?id=${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(category),
    });
    if (!response.ok) throw new Error('Failed to update category');
    return response.json();
  },

  // ลบหมวดหมู่
  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/categories?id=${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete category');
  },
};