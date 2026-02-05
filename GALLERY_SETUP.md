# การตั้งค่า Gallery (รูปภาพและวิดีโอ)

## ขั้นตอนการ Migrate Database

### 1. เข้า Supabase Dashboard
- ไปที่ https://supabase.com/dashboard
- เลือก project ของคุณ
- คลิกเมนู **SQL Editor** (ด้านซ้าย)

### 2. รันคำสั่ง SQL

คัดลอกและวางโค้ดจากไฟล์ `supabase-migration-gallery.sql` แล้วกด **Run**

หรือคัดลอกโค้ดนี้:

```sql
-- สร้างตาราง gallery
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

-- สร้าง index
CREATE INDEX IF NOT EXISTS idx_gallery_order ON gallery(order_index);

-- สร้าง trigger
CREATE TRIGGER update_gallery_updated_at 
    BEFORE UPDATE ON gallery 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;

-- สร้าง policies
CREATE POLICY "Allow read access for all users" ON gallery FOR SELECT USING (true);
CREATE POLICY "Allow insert for all users" ON gallery FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for all users" ON gallery FOR UPDATE USING (true);
CREATE POLICY "Allow delete for all users" ON gallery FOR DELETE USING (true);

-- สร้าง Storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('gallery', 'gallery', true)
ON CONFLICT (id) DO NOTHING;

-- สร้าง Storage policies
CREATE POLICY "Allow public read access on gallery bucket" ON storage.objects FOR SELECT USING (bucket_id = 'gallery');
CREATE POLICY "Allow public upload to gallery bucket" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'gallery');
CREATE POLICY "Allow public delete from gallery bucket" ON storage.objects FOR DELETE USING (bucket_id = 'gallery');
```

---

## วิธีใช้งาน

### 1. เพิ่มรูปภาพหรือวิดีโอ

1. ไปที่หน้า `/manage`
2. คลิกแท็บ **"📸 แกลเลอรี่"**
3. คลิก **"+ เพิ่มรูปภาพ/วิดีโอ"**
4. กรอกข้อมูล:
   - ชื่อ
   - คำอธิบาย (ถ้ามี)
   - เลือกไฟล์ (รูปภาพหรือวิดีโอ)
5. คลิก **"เพิ่ม"**

### 2. ดูแกลเลอรี่

1. ไปที่หน้าหลัก `/`
2. คลิกปุ่ม **"เริ่มต้นใช้งาน"**
3. จะเข้าสู่หน้า `/picture` ที่แสดงรูปภาพและวิดีโอทั้งหมด
4. คลิกที่รูปภาพหรือวิดีโอเพื่อดูแบบเต็มหน้าจอ

---

## ฟีเจอร์

- ✅ อัปโหลดรูปภาพ (JPG, PNG, GIF, etc.)
- ✅ อัปโหลดวิดีโอ (MP4, WebM, etc.)
- ✅ แสดงแบบ Grid Layout
- ✅ Modal สำหรับดูแบบเต็มหน้าจอ
- ✅ Responsive Design
- ✅ Real-time Updates
- ✅ ลบรูปภาพ/วิดีโอได้

---

## หมายเหตุ

- ขนาดไฟล์แนะนำ: รูปภาพไม่เกิน 5MB, วิดีโอไม่เกิน 50MB
- รูปภาพจะแสดงแบบ aspect ratio 4:3
- วิดีโอจะมีไอคอน Play บนภาพ Thumbnail
- คลิกที่รูป/วิดีโอเพื่อดูแบบเต็มหน้าจอ
