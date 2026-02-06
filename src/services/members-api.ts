import { supabase } from '../lib/supabase';

export interface Member {
  id: string;
  name: string;
  nickname?: string;
  studentId?: string;
  role: string;
  email: string;
  avatarUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  gmailUrl?: string;
  order: number;
}

export const membersApi = {
  // ดึงสมาชิกทั้งหมด
  async getAll(): Promise<Member[]> {
    // ชั่วคราว: ตรวจสอบว่าคอลัมน์ nickname และ student_id มีอยู่หรือไม่
    try {
      // ลองดึงข้อมูลพร้อมคอลัมน์ใหม่
      const { data, error } = await supabase
        .from('members')
        .select('id, name, nickname, student_id, role, email, avatar_url, facebook_url, instagram_url, gmail_url, order_index')
        .order('order_index', { ascending: true });

      if (error) {
        // ถ้า error เกี่ยวกับคอลัมน์ไม่มี ให้ใช้ query แบบเก่า
        if (error.message.includes('does not exist')) {
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('members')
            .select('id, name, role, email, avatar_url, order_index')
            .order('order_index', { ascending: true });

          if (fallbackError) throw new Error(`Failed to fetch members: ${fallbackError.message}`);
          if (!fallbackData) return [];

          return fallbackData.map(item => ({
            id: item.id,
            name: item.name,
            nickname: undefined,
            studentId: undefined,
            role: item.role,
            email: item.email,
            avatarUrl: item.avatar_url || undefined,
            facebookUrl: undefined,
            instagramUrl: undefined,
            gmailUrl: undefined,
            order: item.order_index
          }));
        }
        throw new Error(`Failed to fetch members: ${error.message}`);
      }

      if (!data) return [];
      
      return data.map(item => ({
        id: item.id,
        name: item.name,
        nickname: item.nickname || undefined,
        studentId: item.student_id || undefined,
        role: item.role,
        email: item.email,
        avatarUrl: item.avatar_url || undefined,
        facebookUrl: item.facebook_url || undefined,
        instagramUrl: item.instagram_url || undefined,
        gmailUrl: item.gmail_url || undefined,
        order: item.order_index
      }));
    } catch (err) {
      throw err;
    }
  },

  // เพิ่มสมาชิกใหม่
  async create(member: Omit<Member, 'id'>): Promise<Member> {
    const { data, error } = await supabase
      .from('members')
      .insert({
        name: member.name,
        nickname: member.nickname || null,
        student_id: member.studentId || null,
        role: member.role,
        email: member.email,
        avatar_url: member.avatarUrl || null,
        facebook_url: member.facebookUrl || null,
        instagram_url: member.instagramUrl || null,
        gmail_url: member.gmailUrl || null,
        order_index: member.order
      })
      .select('id, name, nickname, student_id, role, email, avatar_url, facebook_url, instagram_url, gmail_url, order_index')
      .single();

    if (error) throw new Error(`Failed to create member: ${error.message}`);
    if (!data) throw new Error('No data returned from create');
    
    return {
      id: data.id,
      name: data.name,
      nickname: data.nickname || undefined,
      studentId: data.student_id || undefined,
      role: data.role,
      email: data.email,
      avatarUrl: data.avatar_url || undefined,
      facebookUrl: data.facebook_url || undefined,
      instagramUrl: data.instagram_url || undefined,
      gmailUrl: data.gmail_url || undefined,
      order: data.order_index
    };
  },

  // อัปเดตข้อมูลสมาชิก
  async update(id: string, updates: Partial<Omit<Member, 'id'>>): Promise<void> {
    const updateData: any = {};
    
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.nickname !== undefined) updateData.nickname = updates.nickname || null;
    if (updates.studentId !== undefined) updateData.student_id = updates.studentId || null;
    if (updates.role !== undefined) updateData.role = updates.role;
    if (updates.email !== undefined) updateData.email = updates.email;
    if (updates.avatarUrl !== undefined) updateData.avatar_url = updates.avatarUrl || null;
    if (updates.facebookUrl !== undefined) updateData.facebook_url = updates.facebookUrl || null;
    if (updates.instagramUrl !== undefined) updateData.instagram_url = updates.instagramUrl || null;
    if (updates.gmailUrl !== undefined) updateData.gmail_url = updates.gmailUrl || null;
    if (updates.order !== undefined) updateData.order_index = updates.order;

    const { error } = await supabase
      .from('members')
      .update(updateData)
      .eq('id', id);

    if (error) throw new Error(`Failed to update member: ${error.message}`);
  },

  // ลบสมาชิก
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('members')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete member: ${error.message}`);
  },

  // อัปโหลดรูปโปรไฟล์
  async uploadAvatar(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('members')
      .upload(filePath, file, {
        cacheControl: 'public, max-age=31536000, immutable',
        upsert: false,
        contentType: file.type
      });

    if (uploadError) throw new Error(`Failed to upload avatar: ${uploadError.message}`);

    const { data } = supabase.storage
      .from('members')
      .getPublicUrl(filePath);

    return data.publicUrl;
  },

  // ลบรูปโปรไฟล์
  async deleteAvatar(avatarUrl: string): Promise<void> {
    const path = avatarUrl.split('/members/')[1];
    if (!path) return;

    const { error } = await supabase.storage
      .from('members')
      .remove([path]);

    if (error) console.error('Failed to delete avatar:', error);
  }
};
