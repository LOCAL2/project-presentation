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
          <Link to="/" className="back-link">
            ←
          </Link>
          <h1>สมาชิกทีม</h1>
        </div>
      </div>

      <div className="members-content">
        <div className="members-grid">
          {members.map((member) => (
            <div key={member.id} className="member-card">
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
              <div className="member-info">
                <h3 className="member-name">{member.name}</h3>
                <p className="member-role">{member.role}</p>
                <a href={`mailto:${member.email}`} className="member-email">
                  {member.email}
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
