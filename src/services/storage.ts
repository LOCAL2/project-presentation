import { supabase } from '../lib/supabase';

export const storageApi = {
  // อัพโหลดไฟล์ PDF ไปยัง Supabase Storage
  async uploadPDF(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `documents/${fileName}`;

    const { data, error } = await supabase.storage
      .from('documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      });

    if (error) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }

    // ได้ public URL สำหรับไฟล์ โดยไม่มี transformation
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(data.path);

    return publicUrl;
  },

  // ได้ signed URL สำหรับไฟล์ที่ต้องการ authentication
  async getSignedUrl(path: string): Promise<string> {
    try {
      // ถ้าเป็น URL เต็มแล้ว ให้แยก path ออกมา
      if (path.includes('supabase')) {
        const url = new URL(path);
        const pathParts = url.pathname.split('/');
        const fileName = pathParts[pathParts.length - 1];
        path = `documents/${fileName}`;
      }

      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(path, 3600); // 1 hour expiry

      if (error) {
        console.error('Failed to create signed URL:', error);
        return path; // fallback to original path
      }

      return data.signedUrl;
    } catch (err) {
      console.error('Error creating signed URL:', err);
      return path; // fallback to original path
    }
  },

  // ลบไฟล์จาก Storage
  async deleteFile(path: string): Promise<void> {
    try {
      // ตรวจสอบว่าเป็น URL จาก Supabase Storage หรือไม่
      if (!path.includes('supabase')) {
        // ถ้าไม่ใช่ไฟล์จาก Storage (เช่น ไฟล์เริ่มต้น) ไม่ต้องลบ
        return;
      }

      // แยก path จาก URL
      const url = new URL(path);
      const pathParts = url.pathname.split('/');
      const fileName = pathParts[pathParts.length - 1];
      const filePath = `documents/${fileName}`;

      const { error } = await supabase.storage
        .from('documents')
        .remove([filePath]);

      if (error) {
        console.error('Failed to delete file:', error.message);
        // ไม่ throw error เพราะไฟล์อาจถูกลบไปแล้ว
      }
    } catch (err) {
      console.error('Error parsing file path:', err);
      // ไม่ throw error เพราะอาจเป็นไฟล์เก่าที่ไม่ได้อยู่ใน Storage
    }
  }
};