import { useState, useEffect } from 'react';
import { membersApi, type Member } from '../services/members-api';
import { supabase } from '../lib/supabase';

export const ManageMembers = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  
  // Form states
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadMembers();

    const subscription = supabase
      .channel('members-changes-manage')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'members' },
        () => {
          membersApi.getAll().then(setMembers).catch(console.error);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const data = await membersApi.getAll();
      setMembers(data);
      setError(null);
    } catch (err) {
      setError('ไม่สามารถโหลดข้อมูลได้');
      console.error('Error loading members:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !role.trim() || !email.trim()) return;

    try {
      setUploading(true);
      setError(null);

      let avatarUrl: string | undefined;
      
      if (avatarFile) {
        avatarUrl = await membersApi.uploadAvatar(avatarFile);
      }

      if (editingMember) {
        // อัปเดตสมาชิก
        if (avatarFile && editingMember.avatarUrl) {
          await membersApi.deleteAvatar(editingMember.avatarUrl);
        }
        
        await membersApi.update(editingMember.id, {
          name: name.trim(),
          role: role.trim(),
          email: email.trim(),
          avatarUrl: avatarUrl || editingMember.avatarUrl
        });

        setMembers(prev => prev.map(m => 
          m.id === editingMember.id 
            ? { ...m, name: name.trim(), role: role.trim(), email: email.trim(), avatarUrl: avatarUrl || m.avatarUrl }
            : m
        ));
      } else {
        // เพิ่มสมาชิกใหม่
        const maxOrder = Math.max(...members.map(m => m.order), -1);
        const newMember = await membersApi.create({
          name: name.trim(),
          role: role.trim(),
          email: email.trim(),
          avatarUrl,
          order: maxOrder + 1
        });

        setMembers(prev => [...prev, newMember]);
      }

      closeModal();
    } catch (err) {
      console.error('Error saving member:', err);
      setError('ไม่สามารถบันทึกข้อมูลได้');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (member: Member) => {
    setEditingMember(member);
    setName(member.name);
    setRole(member.role);
    setEmail(member.email);
    setAvatarFile(null);
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingMember(null);
    setName('');
    setRole('');
    setEmail('');
    setAvatarFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
      setAvatarFile(file);
    } else {
      alert('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
    }
  };

  if (loading && members.length === 0) {
    return (
      <div className="manage-gallery-loading">
        <div className="manage-spinner"></div>
        <p>กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  return (
    <div className="manage-gallery">
      {/* Header */}
      <div className="manage-gallery-header">
        <div>
          <h2>จัดการสมาชิกทีม</h2>
          <p className="manage-gallery-subtitle">{members.length} คน</p>
        </div>
        <button 
          className="manage-btn manage-btn--primary"
          onClick={() => setShowAddModal(true)}
        >
          + เพิ่มสมาชิก
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="manage-alert manage-alert--error">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="manage-alert__close">×</button>
        </div>
      )}

      {/* Members Grid */}
      {members.length === 0 ? (
        <div className="manage-empty-state">
          <div className="manage-empty-state__icon">👥</div>
          <h3 className="manage-empty-state__title">ยังไม่มีสมาชิก</h3>
          <p className="manage-empty-state__description">
            เริ่มต้นโดยการเพิ่มสมาชิกคนแรก
          </p>
          <button 
            className="manage-btn manage-btn--primary"
            onClick={() => setShowAddModal(true)}
          >
            + เพิ่มสมาชิกคนแรก
          </button>
        </div>
      ) : (
        <div className="manage-gallery-grid">
          {members.map((member) => (
            <div key={member.id} className="manage-gallery-card">
              <div className="manage-gallery-card__media" style={{ 
                background: member.avatarUrl ? 'transparent' : '#1f2937',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}>
                {member.avatarUrl ? (
                  <img src={member.avatarUrl} alt={member.name} style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover' 
                  }} />
                ) : (
                  <div style={{ 
                    fontSize: '4rem', 
                    color: 'white', 
                    fontWeight: 700 
                  }}>
                    {member.name.charAt(0)}
                  </div>
                )}
                {/* ปุ่มแก้ไข */}
                <div style={{ 
                  position: 'absolute', 
                  top: '0.75rem', 
                  right: '0.75rem',
                  zIndex: 10
                }}>
                  <button 
                    className="manage-category-action-btn manage-category-action-btn--edit"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(member);
                    }}
                    title="แก้ไข"
                    style={{ 
                      background: 'rgba(255, 255, 255, 0.95)',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                    }}
                  >
                    ✏️
                  </button>
                </div>
              </div>
              <div className="manage-gallery-card__content">
                <h3>{member.name}</h3>
                <p style={{ marginBottom: '0.5rem' }}>{member.role}</p>
                <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>{member.email}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="manage-modal-overlay" onClick={closeModal}>
          <div className="manage-modal" onClick={(e) => e.stopPropagation()}>
            <div className="manage-modal__header">
              <h2 className="manage-modal__title">
                {editingMember ? 'แก้ไขสมาชิก' : 'เพิ่มสมาชิกใหม่'}
              </h2>
              <button className="manage-modal__close" onClick={closeModal}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="manage-modal__form">
              <div className="manage-form-group">
                <label className="manage-form-label">ชื่อ-นามสกุล *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="manage-form-input"
                  placeholder="กรอกชื่อ-นามสกุล"
                  required
                />
              </div>

              <div className="manage-form-group">
                <label className="manage-form-label">ตำแหน่ง *</label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="manage-form-input"
                  placeholder="เช่น Project Manager, Developer"
                  required
                />
              </div>

              <div className="manage-form-group">
                <label className="manage-form-label">อีเมล *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="manage-form-input"
                  placeholder="example@email.com"
                  required
                />
              </div>

              <div className="manage-form-group">
                <label className="manage-form-label">รูปโปรไฟล์</label>
                <div className={`manage-file-upload ${avatarFile ? 'manage-file-upload--has-file' : ''}`}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="manage-file-upload__input"
                    id="avatar-upload"
                  />
                  <label htmlFor="avatar-upload" className="manage-file-upload__label">
                    {avatarFile ? (
                      <span>✓ {avatarFile.name}</span>
                    ) : (
                      <span>📷 เลือกรูปโปรไฟล์</span>
                    )}
                  </label>
                </div>
                <p className="manage-form-hint">
                  รองรับ: JPG, PNG, GIF (แนะนำขนาด 400x400px)
                </p>
              </div>

              <div className="manage-modal__actions">
                <button 
                  type="button" 
                  onClick={closeModal} 
                  className="manage-btn manage-btn--secondary"
                  disabled={uploading}
                >
                  ยกเลิก
                </button>
                <button 
                  type="submit" 
                  className="manage-btn manage-btn--primary"
                  disabled={uploading || !name.trim() || !role.trim() || !email.trim()}
                >
                  {uploading ? 'กำลังบันทึก...' : (editingMember ? 'บันทึก' : 'เพิ่มสมาชิก')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
