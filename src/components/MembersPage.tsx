import { Link } from 'react-router-dom';

export const MembersPage = () => {
  const members = [
    {
      id: 1,
      name: 'สมชาย ใจดี',
      role: 'Project Manager',
      email: 'somchai@example.com',
      avatar: 'SC'
    },
    {
      id: 2,
      name: 'สมหญิง รักงาน',
      role: 'Developer',
      email: 'somying@example.com',
      avatar: 'SY'
    },
    {
      id: 3,
      name: 'วิชัย เก่งมาก',
      role: 'Designer',
      email: 'wichai@example.com',
      avatar: 'WC'
    },
    {
      id: 4,
      name: 'สุดา ขยัน',
      role: 'Tester',
      email: 'suda@example.com',
      avatar: 'SD'
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
