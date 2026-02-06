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
  const [nickname, setNickname] = useState('');
  const [studentId, setStudentId] = useState('');
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [gmailUrl, setGmailUrl] = useState('');
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
          nickname: nickname.trim() || undefined,
          studentId: studentId.trim() || undefined,
          role: role.trim(),
          email: email.trim(),
          facebookUrl: facebookUrl.trim() || undefined,
          instagramUrl: instagramUrl.trim() || undefined,
          gmailUrl: gmailUrl.trim() || undefined,
          avatarUrl: avatarUrl || editingMember.avatarUrl
        });

        setMembers(prev => prev.map(m => 
          m.id === editingMember.id 
            ? { 
                ...m, 
                name: name.trim(), 
                nickname: nickname.trim() || undefined,
                studentId: studentId.trim() || undefined,
                role: role.trim(), 
                email: email.trim(),
                facebookUrl: facebookUrl.trim() || undefined,
                instagramUrl: instagramUrl.trim() || undefined,
                gmailUrl: gmailUrl.trim() || undefined,
                avatarUrl: avatarUrl || m.avatarUrl 
              }
            : m
        ));
      } else {
        // เพิ่มสมาชิกใหม่
        const maxOrder = Math.max(...members.map(m => m.order), -1);
        const newMember = await membersApi.create({
          name: name.trim(),
          nickname: nickname.trim() || undefined,
          studentId: studentId.trim() || undefined,
          role: role.trim(),
          email: email.trim(),
          facebookUrl: facebookUrl.trim() || undefined,
          instagramUrl: instagramUrl.trim() || undefined,
          gmailUrl: gmailUrl.trim() || undefined,
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
    setNickname(member.nickname || '');
    setStudentId(member.studentId || '');
    setRole(member.role);
    setEmail(member.email);
    setFacebookUrl(member.facebookUrl || '');
    setInstagramUrl(member.instagramUrl || '');
    setGmailUrl(member.gmailUrl || '');
    setAvatarFile(null);
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingMember(null);
    setName('');
    setNickname('');
    setStudentId('');
    setRole('');
    setEmail('');
    setFacebookUrl('');
    setInstagramUrl('');
    setGmailUrl('');
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
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            gap: '2rem',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'flex-start'
          }}>
            {members.map((member) => (
              <div 
                key={member.id} 
                className="manage-gallery-card"
                style={{
                  width: '350px',
                  minHeight: '450px',
                  flexShrink: 0,
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
              <div className="manage-gallery-card__media" style={{ 
                background: member.avatarUrl ? 'transparent' : '#1f2937',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}>
                {member.avatarUrl ? (
                  <img 
                    src={member.avatarUrl} 
                    alt={member.name} 
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover'
                    }}
                  />
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
              <div className="manage-gallery-card__content" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h3>
                    {member.name}
                    {member.nickname && (
                      <span style={{ fontWeight: 400, color: '#6b7280', fontSize: '0.9em', marginLeft: '0.5rem' }}>
                        ({member.nickname})
                      </span>
                    )}
                  </h3>
                  {member.studentId && (
                    <p style={{ 
                      fontSize: '0.875rem', 
                      color: '#374151', 
                      margin: '0 0 0.5rem 0',
                      background: '#f9fafb',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '6px',
                      border: '1px solid #e5e7eb',
                      display: 'inline-block'
                    }}>
                      รหัส: {member.studentId}
                    </p>
                  )}
                  <p style={{ 
                    marginBottom: '0.75rem',
                    color: '#374151',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    textAlign: 'center'
                  }}>{member.role}</p>
                </div>
                
                {/* ช่องทางติดต่อ */}
                <div style={{ 
                  marginTop: '0.75rem',
                  padding: '0.75rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  backgroundColor: '#f9fafb'
                }}>
                  <h4 style={{ 
                    margin: '0 0 0.5rem 0',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    textAlign: 'center'
                  }}>
                    ช่องทางการติดต่อ
                  </h4>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center' }}>
                    {member.facebookUrl && (
                      <a 
                        href={member.facebookUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '32px',
                          height: '32px',
                          background: '#1877f2',
                          color: 'white',
                          borderRadius: '6px',
                          textDecoration: 'none',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                        title="Facebook"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                      </a>
                    )}
                    {member.instagramUrl && (
                      <a 
                        href={member.instagramUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '32px',
                          height: '32px',
                          background: 'linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)',
                          color: 'white',
                          borderRadius: '6px',
                          textDecoration: 'none',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                        title="Instagram"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                      </a>
                    )}
                    {member.gmailUrl && (
                      <a 
                        href={member.gmailUrl.startsWith('mailto:') ? member.gmailUrl : `mailto:${member.gmailUrl}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '32px',
                          height: '32px',
                          background: '#ea4335',
                          color: 'white',
                          borderRadius: '6px',
                          textDecoration: 'none',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                        title={`ส่งอีเมลถึง ${member.gmailUrl.replace('mailto:', '')}`}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.910 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/>
                        </svg>
                      </a>
                    )}
                    {!member.facebookUrl && !member.instagramUrl && !member.gmailUrl && (
                      <span style={{ fontSize: '0.85rem', color: '#9ca3af', fontStyle: 'italic' }}>
                        ไม่มีช่องทางติดต่อ
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
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
                <label className="manage-form-label">ชื่อเล่น</label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="manage-form-input"
                  placeholder="ชื่อเล่น (ไม่บังคับ)"
                />
              </div>

              <div className="manage-form-group">
                <label className="manage-form-label">รหัสประจำตัวนักศึกษา</label>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="manage-form-input"
                  placeholder="เช่น 65010001 (ไม่บังคับ)"
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
                <label className="manage-form-label">ช่องทางติดต่อ</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <input
                    type="url"
                    value={facebookUrl}
                    onChange={(e) => setFacebookUrl(e.target.value)}
                    className="manage-form-input"
                    placeholder="🔗 Facebook URL (เช่น https://facebook.com/username)"
                  />
                  <input
                    type="url"
                    value={instagramUrl}
                    onChange={(e) => setInstagramUrl(e.target.value)}
                    className="manage-form-input"
                    placeholder="🔗 Instagram URL (เช่น https://instagram.com/username)"
                  />
                  <input
                    type="email"
                    value={gmailUrl}
                    onChange={(e) => setGmailUrl(e.target.value)}
                    className="manage-form-input"
                    placeholder="📧 อีเมล (เช่น example@gmail.com)"
                  />
                </div>
                <p className="manage-form-hint">
                  ใส่ URL ของช่องทางติดต่อที่ต้องการ (ไม่บังคับ) - สำหรับอีเมลใส่แค่ที่อยู่อีเมลเท่านั้น
                </p>
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
