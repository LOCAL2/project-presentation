import { supabase } from '../lib/supabase';

export interface Member {
  id: string;
  name: string;
  role: string;
  email: string;
  avatarUrl?: string;
  order: number;
}

export const membersApi = {
  // ดึงสมาชิกทั้งหมด
  async getAll(): Promise<Member[]> {
    const { data, error } = await supabase
      .from('members')
      .select('id, name, role, email, avatar_url, order_index')
      .order('order_index', { ascending: true });

    if (error) throw new Error(`Failed to fetch members: ${error.message}`);
    if (!data) return [];
    
    return data.map(item => ({
      id: item.id,
      name: item.name,
      role: item.role,
      email: item.email,
      avatarUrl: item.avatar_url || undefined,
      order: item.order_index
    }));
  },

  // เพิ่มสมาชิกใหม่
  async create(member: Omit<Member, 'id'>): Promise<Member> {
    const { data, error } = await supabase
      .from('members')
      .insert({
        name: member.name,
        role: member.role,
        email: member.email,
        avatar_url: member.avatarUrl || null,
        order_index: member.order
      })
      .select('id, name, role, email, avatar_url, order_index')
      .single();

    if (error) throw new Error(`Failed to create member: ${error.message}`);
    if (!data) throw new Error('No data returned from create');
    
    return {
      id: data.id,
      name: data.name,
      role: data.role,
      email: data.email,
      avatarUrl: data.avatar_url || undefined,
      order: data.order_index
    };
  },

  // อัปเดตข้อมูลสมาชิก
  async update(id: string, updates: Partial<Omit<Member, 'id'>>): Promise<void> {
    const updateData: any = {};
    
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.role !== undefined) updateData.role = updates.role;
    if (updates.email !== undefined) updateData.email = updates.email;
    if (updates.avatarUrl !== undefined) updateData.avatar_url = updates.avatarUrl || null;
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
        cacheControl: '3600',
        upsert: false
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
