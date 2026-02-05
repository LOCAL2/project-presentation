-- เพิ่มคอลัมน์ช่องทางติดต่อในตาราง members
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS facebook_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT,
ADD COLUMN IF NOT EXISTS gmail_url TEXT;

-- อัปเดตข้อมูลตัวอย่าง (ถ้าต้องการ)
UPDATE members SET 
  facebook_url = 'https://facebook.com/kulwas.prommanot',
  instagram_url = 'https://instagram.com/kulwas_pm',
  gmail_url = 'mailto:kulwas@gmail.com'
WHERE name = 'กุลวัศ พรมมณศ';

UPDATE members SET 
  facebook_url = 'https://facebook.com/naraspon.poom',
  instagram_url = 'https://instagram.com/naraspon_dev',
  gmail_url = 'mailto:naraspon@gmail.com'
WHERE name = 'นรัสพล ผุ้มและราวา';

UPDATE members SET 
  facebook_url = 'https://facebook.com/wasef.panpat',
  instagram_url = 'https://instagram.com/wasef_code',
  gmail_url = 'mailto:wasef@gmail.com'
WHERE name = 'วาเซฟ พันธุ์พัฒ';