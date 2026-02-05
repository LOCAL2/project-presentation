-- สร้างตาราง gallery สำหรับเก็บรูปภาพและวิดีโอ
CREATE TABLE IF NOT EXISTS gallery (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'video')),
  thumbnail_url TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- สร้าง index สำหรับการเรียงลำดับ
CREATE INDEX IF NOT EXISTS idx_gallery_order ON gallery(order_index);

-- สร้าง trigger สำหรับอัพเดท updated_at อัตโนมัติ
CREATE TRIGGER update_gallery_updated_at 
    BEFORE UPDATE ON gallery 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;

-- สร้าง policy สำหรับการอ่านข้อมูล (อนุญาตทุกคน)
CREATE POLICY "Allow read access for all users" ON gallery FOR SELECT USING (true);

-- สร้าง policy สำหรับการเขียนข้อมูล (อนุญาตทุกคน - สำหรับ demo)
CREATE POLICY "Allow insert for all users" ON gallery FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for all users" ON gallery FOR UPDATE USING (true);
CREATE POLICY "Allow delete for all users" ON gallery FOR DELETE USING (true);

-- สร้าง Storage bucket สำหรับเก็บรูปภาพและวิดีโอ
INSERT INTO storage.buckets (id, name, public) 
VALUES ('gallery', 'gallery', true)
ON CONFLICT (id) DO NOTHING;

-- สร้าง policy สำหรับ Storage
CREATE POLICY "Allow public read access on gallery bucket" ON storage.objects FOR SELECT USING (bucket_id = 'gallery');
CREATE POLICY "Allow public upload to gallery bucket" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'gallery');
CREATE POLICY "Allow public delete from gallery bucket" ON storage.objects FOR DELETE USING (bucket_id = 'gallery');
