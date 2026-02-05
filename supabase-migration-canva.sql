-- เพิ่มฟิลด์สำหรับรองรับ Canva slides
ALTER TABLE documents 
ADD COLUMN type TEXT DEFAULT 'pdf' CHECK (type IN ('pdf', 'canva')),
ADD COLUMN canva_url TEXT;

-- อัพเดทข้อมูลเดิมให้เป็น type 'pdf'
UPDATE documents SET type = 'pdf' WHERE type IS NULL;

-- เพิ่ม comment อธิบายฟิลด์
COMMENT ON COLUMN documents.type IS 'ประเภทของเอกสาร: pdf หรือ canva';
COMMENT ON COLUMN documents.canva_url IS 'URL ของ Canva presentation (ใช้เมื่อ type = canva)';
