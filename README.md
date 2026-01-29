# PDF Document Viewer with Supabase

แอปพลิเคชันสำหรับจัดการและดูเอกสาร PDF พร้อมระบบ drag & drop และ real-time sync

## ฟีเจอร์

# PDF Document Viewer with World-Class Management Interface

แอปพลิเคชันสำหรับจัดการและดูเอกสาร PDF พร้อมระบบจัดการที่ทันสมัยและ real-time sync

## ฟีเจอร์

✅ **PDF Viewer** - ดู PDF ได้หลายหน้า พร้อม zoom และ navigation
✅ **Dual Interface** - หน้าหลักสำหรับดูเอกสาร (`/`) และหน้าจัดการสำหรับแก้ไข (`/manage`)
✅ **World-Class Management UI** - ออกแบบตามมาตรฐาน UX/UI ระดับโลก
✅ **Advanced Document Management** - เพิ่ม/ลบเอกสาร พร้อมอัพโหลดไฟล์ PDF
✅ **Drag & Drop Interface** - จัดเรียงลำดับเอกสารด้วยการลาก
✅ **Smart Search** - ค้นหาเอกสารแบบ real-time
✅ **Modern Modal System** - เพิ่มเอกสารผ่าน modal ที่ทันสมัย
✅ **File Upload with Drag & Drop** - อัพโหลดไฟล์ด้วยการลากวาง
✅ **Tree Structure** - จัดกลุ่มเอกสารเป็นหมวดหมู่
✅ **Real-time Sync** - ข้อมูลจะ sync ระหว่าง users ทันที
✅ **Statistics Dashboard** - แสดงสถิติเอกสารและหมวดหมู่
✅ **Responsive Design** - รองรับทุกขนาดหน้าจอ
✅ **File Storage** - เก็บไฟล์ PDF ใน Supabase Storage
✅ **Persistent Storage** - ข้อมูลเก็บใน Supabase Database

## การติดตั้ง

### 1. Clone โปรเจค
```bash
git clone <repository-url>
cd project-presentation
npm install
```

### 2. ตั้งค่า Supabase
ดูรายละเอียดใน [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

### 3. ตั้งค่า Environment Variables
สร้างไฟล์ `.env.local`:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. รันแอปพลิเคชัน
```bash
npm run dev
```

## การ Deploy

### Vercel (แนะนำ)
1. Push โค้ดขึ้น GitHub
2. เชื่อมต่อ repository กับ Vercel
3. เพิ่ม Environment Variables ใน Vercel Dashboard
4. Deploy อัตโนมัติ

### Netlify
1. Build โปรเจค: `npm run build`
2. Upload โฟลเดอร์ `dist` ไปยัง Netlify
3. เพิ่ม Environment Variables

## โครงสร้างโปรเจค

```
src/
├── components/
│   ├── PdfViewer.tsx      # Component สำหรับแสดง PDF
│   ├── ViewPage.tsx       # หน้าหลักสำหรับดูเอกสาร (/)
│   ├── ManagePage.tsx     # หน้าจัดการเอกสาร (/manage) - World-class UI
│   └── DocxViewer.tsx     # (ไม่ใช้แล้ว)
├── lib/
│   └── supabase.ts        # Supabase client configuration
├── services/
│   ├── api.ts             # (เก่า - JSON Server)
│   ├── supabase-api.ts    # Supabase API functions
│   └── storage.ts         # Supabase Storage functions
├── styles/
│   └── manage.css         # Modern CSS สำหรับหน้าจัดการ
├── types/
│   └── mammoth.d.ts       # Type definitions
├── App.tsx                # Main router
├── App.css                # Base styles
└── main.tsx               # Entry point with routing

api/                       # Vercel API routes (ไม่ใช้แล้ว)
├── documents.ts
└── categories.ts

supabase-schema.sql        # Database schema
```

## เทคโนโลยีที่ใช้

- **Frontend**: React 19 + TypeScript + Vite
- **Routing**: React Router DOM
- **PDF Viewer**: react-pdf
- **Drag & Drop**: @dnd-kit
- **Database**: Supabase (PostgreSQL)
- **File Storage**: Supabase Storage
- **Styling**: Modern CSS3 with Gradients & Backdrop Filters
- **Icons**: Custom SVG Icon System
- **Deployment**: Vercel

## การใช้งาน

### หน้าหลัก (View Mode) - `/`
1. **ดูเอกสาร**: คลิกที่เอกสารในเมนูซ้าย
2. **นำทางระหว่างเอกสาร**: ใช้ปุ่ม "ไปยังบทถัดไป" หรือเลื่อน scroll
3. **ขยาย/ย่อหมวดหมู่**: คลิกที่ชื่อหมวดหมู่

### หน้าจัดการ (Management Mode) - `/manage`
1. **เข้าหน้าจัดการ**: พิมพ์ URL `/manage` ในแถบที่อยู่
2. **ดูสถิติ**: ดูจำนวนเอกสารและหมวดหมู่ทั้งหมด
3. **ค้นหาเอกสาร**: ใช้ช่องค้นหาด้านบน
4. **เพิ่มเอกสาร**: คลิกปุ่ม "เพิ่มเอกสาร" เพื่อเปิด modal
   - ลากไฟล์ PDF มาวางในพื้นที่อัพโหลด
   - หรือคลิกเพื่อเลือกไฟล์
   - กรอกชื่อเอกสารและเลือกหมวดหมู่
5. **จัดเรียงลำดับ**: ลากไอคอน grip (⋮⋮) เพื่อเปลี่ยนลำดับ
6. **ลบเอกสาร**: คลิกไอคอนถังขยะเพื่อลบเอกสาร
7. **จัดการหมวดหมู่**: ขยาย/ย่อหมวดหมู่และดูจำนวนเอกสาร

## การพัฒนาต่อ

### เพิ่มฟีเจอร์ Authentication
```bash
# ติดตั้ง Supabase Auth helpers
npm install @supabase/auth-helpers-react
```

### เพิ่ม File Upload ไปยัง Supabase Storage
```bash
# ใช้ Supabase Storage สำหรับเก็บไฟล์ PDF
# แทนการใช้ URL.createObjectURL
```

### เพิ่ม Real-time Notifications
```bash
# ใช้ Supabase Realtime สำหรับแจ้งเตือนเมื่อมีการเปลี่ยนแปลง
```

## License

MIT License