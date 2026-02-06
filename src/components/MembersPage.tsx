import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { membersApi, type Member } from '../services/members-api';
import { supabase } from '../lib/supabase';

export const MembersPage = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMembers();

    const subscription = supabase
      .channel('members-changes')
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
    } catch (err) {
      console.error('Error loading members:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-message">
        <div className="loading-spinner"></div>
        <p>กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  return (
    <div className="members-container">
      <div className="members-header">
        <div className="members-header-content">
          <Link to="/data" className="back-link">
            ←
          </Link>
          <h1>สมาชิกทีม</h1>
        </div>
      </div>

      <div className="members-content" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '70vh'
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
              className="member-card"
              style={{
                width: '350px',
                minHeight: '450px',
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div className="member-avatar">
                {member.avatarUrl ? (
                  <img 
                    src={member.avatarUrl}
                    alt={member.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: '50%'
                    }}
                  />
                ) : (
                  member.name.charAt(0)
                )}
              </div>
              <div className="member-info" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h3 className="member-name">
                    {member.name}
                    {member.nickname && (
                      <span className="member-nickname">({member.nickname})</span>
                    )}
                  </h3>
                  {member.studentId && (
                    <p className="member-student-id">รหัสนักศึกษา: {member.studentId}</p>
                  )}
                  <p className="member-role" style={{
                    color: '#374151',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    textAlign: 'center',
                    margin: '0.5rem 0'
                  }}>{member.role}</p>
                </div>
                
                {/* ช่องทางติดต่อ */}
                <div style={{ 
                  marginTop: '1rem',
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
                          width: '36px',
                          height: '36px',
                          background: '#1877f2',
                          color: 'white',
                          borderRadius: '8px',
                          textDecoration: 'none',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                        title="Facebook"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                        }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
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
                          width: '36px',
                          height: '36px',
                          background: 'linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)',
                          color: 'white',
                          borderRadius: '8px',
                          textDecoration: 'none',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                        title="Instagram"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                        }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
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
                          width: '36px',
                          height: '36px',
                          background: '#ea4335',
                          color: 'white',
                          borderRadius: '8px',
                          textDecoration: 'none',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                        title={`ส่งอีเมลถึง ${member.gmailUrl.replace('mailto:', '')}`}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                        }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.910 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/>
                        </svg>
                      </a>
                    )}
                    {!member.facebookUrl && !member.instagramUrl && !member.gmailUrl && (
                      <span style={{ fontSize: '0.875rem', color: '#9ca3af', fontStyle: 'italic' }}>
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
    </div>
  );
};
