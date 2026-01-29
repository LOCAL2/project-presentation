import { supabase } from '../lib/supabase';

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
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('order_index', { ascending: true });

    if (error) throw new Error(`Failed to fetch documents: ${error.message}`);
    
    return data.map(doc => ({
      id: doc.id,
      title: doc.title,
      path: doc.path,
      category: doc.category_id || undefined,
      order: doc.order_index
    }));
  },

  // เพิ่มเอกสารใหม่
  async create(document: Omit<Document, 'id'>): Promise<Document> {
    const { data, error } = await supabase
      .from('documents')
      .insert({
        title: document.title,
        path: document.path,
        category_id: document.category || null,
        order_index: document.order
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create document: ${error.message}`);
    
    return {
      id: data.id,
      title: data.title,
      path: data.path,
      category: data.category_id || undefined,
      order: data.order_index
    };
  },

  // อัพเดทเอกสาร
  async update(id: string, document: Partial<Document>): Promise<Document> {
    const updateData: any = {};
    if (document.title !== undefined) updateData.title = document.title;
    if (document.path !== undefined) updateData.path = document.path;
    if (document.category !== undefined) updateData.category_id = document.category;
    if (document.order !== undefined) updateData.order_index = document.order;

    const { data, error } = await supabase
      .from('documents')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update document: ${error.message}`);
    
    return {
      id: data.id,
      title: data.title,
      path: data.path,
      category: data.category_id || undefined,
      order: data.order_index
    };
  },

  // อัพเดทลำดับเอกสารทั้งหมด
  async updateOrder(documents: Document[]): Promise<void> {
    const updates = documents.map((doc, index) => ({
      id: doc.id,
      order_index: index
    }));

    for (const update of updates) {
      const { error } = await supabase
        .from('documents')
        .update({ order_index: update.order_index })
        .eq('id', update.id);

      if (error) throw new Error(`Failed to update document order: ${error.message}`);
    }
  },

  // ลบเอกสาร
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete document: ${error.message}`);
  },
};

// Categories API
export const categoriesApi = {
  // ดึงหมวดหมู่ทั้งหมด
  async getAll(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw new Error(`Failed to fetch categories: ${error.message}`);
    
    return data.map(cat => ({
      id: cat.id,
      title: cat.title,
      expanded: cat.expanded
    }));
  },

  // เพิ่มหมวดหมู่ใหม่
  async create(category: Omit<Category, 'id'>): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .insert({
        title: category.title,
        expanded: category.expanded
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create category: ${error.message}`);
    
    return {
      id: data.id,
      title: data.title,
      expanded: data.expanded
    };
  },

  // อัพเดทหมวดหมู่
  async update(id: string, category: Partial<Category>): Promise<Category> {
    const updateData: any = {};
    if (category.title !== undefined) updateData.title = category.title;
    if (category.expanded !== undefined) updateData.expanded = category.expanded;

    const { data, error } = await supabase
      .from('categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update category: ${error.message}`);
    
    return {
      id: data.id,
      title: data.title,
      expanded: data.expanded
    };
  },

  // ลบหมวดหมู่
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete category: ${error.message}`);
  },
};