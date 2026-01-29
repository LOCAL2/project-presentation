-- สร้างตาราง categories
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  expanded BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- สร้างตาราง documents
CREATE TABLE documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  path TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- สร้าง index สำหรับการเรียงลำดับ
CREATE INDEX idx_documents_order ON documents(order_index);
CREATE INDEX idx_documents_category ON documents(category_id);

-- สร้าง function สำหรับอัพเดท updated_at อัตโนมัติ
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- สร้าง trigger สำหรับ categories
CREATE TRIGGER update_categories_updated_at 
    BEFORE UPDATE ON categories 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- สร้าง trigger สำหรับ documents
CREATE TRIGGER update_documents_updated_at 
    BEFORE UPDATE ON documents 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- สร้าง Storage bucket สำหรับเก็บไฟล์ PDF
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true);

-- สร้าง policy สำหรับ Storage
CREATE POLICY "Allow public read access on documents bucket" ON storage.objects FOR SELECT USING (bucket_id = 'documents');
CREATE POLICY "Allow public upload to documents bucket" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents');
CREATE POLICY "Allow public delete from documents bucket" ON storage.objects FOR DELETE USING (bucket_id = 'documents');

-- เพิ่มข้อมูลเริ่มต้น
INSERT INTO categories (id, title, expanded) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'เอกสาร คง.', true);

INSERT INTO documents (title, path, category_id, order_index) VALUES 
('หน้าปก', '/source/ปก.pdf', NULL, 0),
('แบบ คง. 01', '/source/แบบ-คง.-01.pdf', '550e8400-e29b-41d4-a716-446655440000', 1),
('แบบ คง. 02', '/source/แบบ-คง.-02.pdf', '550e8400-e29b-41d4-a716-446655440000', 2),
('แบบ คง. 03', '/source/แบบ-คง.-03.pdf', '550e8400-e29b-41d4-a716-446655440000', 3);

-- Enable Row Level Security (RLS)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- สร้าง policy สำหรับการอ่านข้อมูล (อนุญาตทุกคน)
CREATE POLICY "Allow read access for all users" ON categories FOR SELECT USING (true);
CREATE POLICY "Allow read access for all users" ON documents FOR SELECT USING (true);

-- สร้าง policy สำหรับการเขียนข้อมูล (อนุญาตทุกคน - สำหรับ demo)
-- ในการใช้งานจริงควรจำกัดสิทธิ์
CREATE POLICY "Allow insert for all users" ON categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for all users" ON categories FOR UPDATE USING (true);
CREATE POLICY "Allow delete for all users" ON categories FOR DELETE USING (true);

CREATE POLICY "Allow insert for all users" ON documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for all users" ON documents FOR UPDATE USING (true);
CREATE POLICY "Allow delete for all users" ON documents FOR DELETE USING (true);