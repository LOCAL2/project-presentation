-- สร้างตาราง members สำหรับข้อมูลสมาชิกทีม
CREATE TABLE IF NOT EXISTS members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  nickname TEXT,
  student_id TEXT,
  role TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- สร้าง index สำหรับการเรียงลำดับ
CREATE INDEX IF NOT EXISTS idx_members_order ON members(order_index);

-- สร้าง trigger สำหรับ members (ใช้ function ที่มีอยู่แล้ว)
DROP TRIGGER IF EXISTS update_members_updated_at ON members;
CREATE TRIGGER update_members_updated_at 
    BEFORE UPDATE ON members 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- สร้าง Storage bucket สำหรับเก็บรูปโปรไฟล์ (ถ้ายังไม่มี)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('members', 'members', true)
ON CONFLICT (id) DO NOTHING;

-- สร้าง policy สำหรับ Storage
DROP POLICY IF EXISTS "Allow public read access on members bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public upload to members bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete from members bucket" ON storage.objects;

CREATE POLICY "Allow public read access on members bucket" ON storage.objects FOR SELECT USING (bucket_id = 'members');
CREATE POLICY "Allow public upload to members bucket" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'members');
CREATE POLICY "Allow public delete from members bucket" ON storage.objects FOR DELETE USING (bucket_id = 'members');

-- Enable Row Level Security (RLS)
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- ลบ policy เก่าก่อน (ถ้ามี)
DROP POLICY IF EXISTS "Allow read access for all users" ON members;
DROP POLICY IF EXISTS "Allow insert for all users" ON members;
DROP POLICY IF EXISTS "Allow update for all users" ON members;
DROP POLICY IF EXISTS "Allow delete for all users" ON members;

-- สร้าง policy สำหรับการอ่านข้อมูล (อนุญาตทุกคน)
CREATE POLICY "Allow read access for all users" ON members FOR SELECT USING (true);

-- สร้าง policy สำหรับการเขียนข้อมูล (อนุญาตทุกคน - สำหรับ demo)
CREATE POLICY "Allow insert for all users" ON members FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for all users" ON members FOR UPDATE USING (true);
CREATE POLICY "Allow delete for all users" ON members FOR DELETE USING (true);

-- เพิ่มข้อมูลสมาชิกตัวอย่าง (ถ้ายังไม่มี)
INSERT INTO members (name, nickname, student_id, role, email, order_index) 
VALUES 
('นายสมชาย ใจดี', 'ชาย', '65010001', 'Project Manager', 'somchai@example.com', 0),
('นางสาวสมหญิง รักเรียน', 'หญิง', '65010002', 'Developer', 'somying@example.com', 1),
('นายสมศักดิ์ ขยันเรียน', 'ศักดิ์', '65010003', 'Designer', 'somsak@example.com', 2)
ON CONFLICT (id) DO NOTHING;