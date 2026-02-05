-- สร้างตาราง members
CREATE TABLE IF NOT EXISTS members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- สร้าง index
CREATE INDEX IF NOT EXISTS idx_members_order ON members(order_index);

-- สร้าง trigger สำหรับ updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_members_updated_at 
    BEFORE UPDATE ON members 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- สร้าง policies
CREATE POLICY "Allow read access for all users" ON members FOR SELECT USING (true);
CREATE POLICY "Allow insert for all users" ON members FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for all users" ON members FOR UPDATE USING (true);
CREATE POLICY "Allow delete for all users" ON members FOR DELETE USING (true);

-- สร้าง Storage bucket สำหรับรูปสมาชิก
INSERT INTO storage.buckets (id, name, public) 
VALUES ('members', 'members', true)
ON CONFLICT (id) DO NOTHING;

-- สร้าง Storage policies
CREATE POLICY "Allow public read access on members bucket" ON storage.objects FOR SELECT USING (bucket_id = 'members');
CREATE POLICY "Allow public upload to members bucket" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'members');
CREATE POLICY "Allow public delete from members bucket" ON storage.objects FOR DELETE USING (bucket_id = 'members');

-- เพิ่มข้อมูลสมาชิกเริ่มต้น
INSERT INTO members (name, role, email, order_index) VALUES
  ('ภูมิรพี พรหมมาศ', 'Project Design', '66209010037@tnk.ac.th', 0),
  ('นภัสพล ผู้แสนสะอาด', 'Project Manager', '66209010031@tnk.ac.th', 1),
  ('วรเดช พันธ์พืช', 'Coding', '66209010040@tnk.ac.th', 2)
ON CONFLICT DO NOTHING;
