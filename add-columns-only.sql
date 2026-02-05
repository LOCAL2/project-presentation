-- เพิ่มคอลัมน์ nickname และ student_id ในตาราง members ที่มีอยู่แล้ว
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS nickname TEXT,
ADD COLUMN IF NOT EXISTS student_id TEXT;

-- อัปเดตข้อมูลตัวอย่าง (ถ้ามีข้อมูลอยู่แล้ว)
UPDATE members SET 
  nickname = 'วัศ',
  student_id = '65010001'
WHERE name = 'กุลวัศ พรมมณศ';

UPDATE members SET 
  nickname = 'พล',
  student_id = '65010002'
WHERE name = 'นรัสพล ผุ้มและราวา';

UPDATE members SET 
  nickname = 'เซฟ',
  student_id = '65010003'
WHERE name = 'วาเซฟ พันธุ์พัฒ';