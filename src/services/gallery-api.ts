import { supabase } from '../lib/supabase';

export interface GalleryItem {
  id: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileType: 'image' | 'video';
  thumbnailUrl?: string;
  order: number;
}

export const galleryApi = {
  // ดึงรายการทั้งหมด
  async getAll(): Promise<GalleryItem[]> {
    const { data, error } = await supabase
      .from('gallery')
      .select('id, title, description, file_url, file_type, thumbnail_url, order_index')
      .order('order_index', { ascending: true });

    if (error) throw new Error(`Failed to fetch gallery: ${error.message}`);
    if (!data) return [];
    
    return data.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description || undefined,
      fileUrl: item.file_url,
      fileType: item.file_type as 'image' | 'video',
      thumbnailUrl: item.thumbnail_url || undefined,
      order: item.order_index
    }));
  },

  // เพิ่มรายการใหม่
  async create(item: Omit<GalleryItem, 'id'>): Promise<GalleryItem> {
    const { data, error } = await supabase
      .from('gallery')
      .insert({
        title: item.title,
        description: item.description || null,
        file_url: item.fileUrl,
        file_type: item.fileType,
        thumbnail_url: item.thumbnailUrl || null,
        order_index: item.order
      })
      .select('id, title, description, file_url, file_type, thumbnail_url, order_index')
      .single();

    if (error) throw new Error(`Failed to create gallery item: ${error.message}`);
    if (!data) throw new Error('No data returned from create');
    
    return {
      id: data.id,
      title: data.title,
      description: data.description || undefined,
      fileUrl: data.file_url,
      fileType: data.file_type as 'image' | 'video',
      thumbnailUrl: data.thumbnail_url || undefined,
      order: data.order_index
    };
  },

  // ลบรายการ
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('gallery')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete gallery item: ${error.message}`);
  },

  // อัพโหลดไฟล์
  async uploadFile(file: File, type: 'image' | 'video'): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `${type}s/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('gallery')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw new Error(`Failed to upload file: ${uploadError.message}`);

    const { data } = supabase.storage
      .from('gallery')
      .getPublicUrl(filePath);

    return data.publicUrl;
  },

  // ลบไฟล์
  async deleteFile(fileUrl: string): Promise<void> {
    const path = fileUrl.split('/gallery/')[1];
    if (!path) return;

    const { error } = await supabase.storage
      .from('gallery')
      .remove([path]);

    if (error) console.error('Failed to delete file:', error);
  }
};
