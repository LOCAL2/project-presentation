import { Link } from 'react-router-dom';

export const MembersPage = () => {
  const members = [
    {
      id: 1,
      name: 'ภูมิรพี พรหมมาศ',
      role: 'Project Design',
      email: '66209010037@tnk.ac.th',
      avatar: 'Poom'
    },
    {
      id: 2,
      name: 'นภัสพล ผู้แสนสะอาด',
      role: 'Project Manager',
      email: '66209010031@tnk.ac.th',
      avatar: 'ST'
    },
    {
      id: 3,
      name: 'วรเดช พันธ์พืช',
      role: 'Coding',
      email: '66209010040@tnk.ac.th',
      avatar: 'WR'
    }
  ];

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
                {member.avatar}
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
