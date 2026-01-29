# การตั้งค่า Supabase

## ขั้นตอนการตั้งค่า

### 1. สร้างโปรเจค Supabase
1. เข้า [supabase.com](https://supabase.com)
2. สร้างบัญชีและ Login
3. คลิก "New Project"
4. ตั้งชื่อโปรเจค และเลือก region
5. รอให้โปรเจคสร้างเสร็จ (2-3 นาที)

### 2. รัน SQL Schema
1. เข้าไปที่ SQL Editor ในแดชบอร์ด Supabase
2. Copy โค้ดจากไฟล์ `supabase-schema.sql`
3. Paste และกด "Run"
4. ตรวจสอบว่าตาราง `categories`, `documents` และ Storage bucket `documents` ถูกสร้างแล้ว

### 3. ตรวจสอบ Storage
1. ไปที่ Storage ในแดชบอร์ด Supabase
2. ควรเห็น bucket ชื่อ "documents"
3. ตรวจสอบว่า bucket เป็น public (สำหรับการดาวน์โหลดไฟล์)

### 4. ตั้งค่า Environment Variables
1. ไปที่ Settings > API ในแดชบอร์ด Supabase
2. Copy `Project URL` และ `anon public key`
3. สร้างไฟล์ `.env.local` ในโปรเจค:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 5. ทดสอบการเชื่อมต่อ
```bash
npm run dev
```

## โครงสร้าง Database

### ตาราง `categories`
- `id` (UUID, Primary Key)
- `title` (TEXT) - ชื่อหมวดหมู่
- `expanded` (BOOLEAN) - สถานะการขยาย
- `created_at`, `updated_at` (TIMESTAMP)

### ตาราง `documents`
- `id` (UUID, Primary Key)
- `title` (TEXT) - ชื่อเอกสาร
- `path` (TEXT) - URL ของไฟล์ใน Storage
- `category_id` (UUID, Foreign Key) - อ้างอิงหมวดหมู่
- `order_index` (INTEGER) - ลำดับการแสดงผล
- `created_at`, `updated_at` (TIMESTAMP)

### Storage Bucket `documents`
- เก็บไฟล์ PDF ที่ผู้ใช้อัพโหลด
- Public access สำหรับการดาวน์โหลด
- Auto-generated URLs

## ฟีเจอร์ที่รองรับ

✅ **Real-time Sync**: ข้อมูลจะ sync ระหว่าง users ทันที
✅ **Persistent Data**: ข้อมูลจะไม่หายหลัง deploy ใหม่
✅ **File Storage**: ไฟล์ PDF เก็บใน Supabase Storage
✅ **Scalable**: รองรับผู้ใช้หลายคนพร้อมกัน
✅ **Backup**: Supabase มี backup อัตโนมัติ
✅ **Free Tier**: ใช้ฟรีได้ถึง 500MB database + 1GB storage

## การ Deploy

### Vercel
1. เพิ่ม Environment Variables ใน Vercel Dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
2. Deploy ตามปกติ

### Netlify
1. เพิ่ม Environment Variables ใน Netlify Dashboard
2. Deploy ตามปกติ

## Security Notes

⚠️ **Row Level Security (RLS)** ถูกเปิดใช้งานแล้ว
- ตอนนี้อนุญาตให้ทุกคนอ่าน/เขียนได้ (สำหรับ demo)
- Storage bucket เป็น public สำหรับการดาวน์โหลดไฟล์
- ในการใช้งานจริงควรปรับ policies ให้เหมาะสม

## การทดสอบ File Upload

1. คลิกปุ่ม + ในแอป
2. กรอกชื่อเอกสาร
3. เลือกไฟล์ PDF
4. คลิก "เพิ่มเอกสาร"
5. ระบบจะอัพโหลดไฟล์ไปยัง Supabase Storage
6. เอกสารใหม่จะปรากฏในรายการและสามารถดูได้ทันที

## การอัพเกรด

หากต้องการฟีเจอร์เพิ่มเติม:
- **Authentication**: เพิ่มระบบ login/register
- **File Management**: ลบไฟล์เก่าเมื่อลบเอกสาร
- **File Validation**: ตรวจสอบขนาดและประเภทไฟล์
- **Advanced Permissions**: ตั้งค่าสิทธิ์ผู้ใช้แบบละเอียด
- **CDN**: ใช้ Supabase CDN สำหรับการโหลดไฟล์เร็วขึ้น