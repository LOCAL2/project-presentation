# การ Deploy บน Vercel

## ขั้นตอนการ Deploy

### 1. เตรียมโปรเจค
```bash
npm run build
```

### 2. Deploy ด้วย Vercel CLI
```bash
# ติดตั้ง Vercel CLI (ถ้ายังไม่มี)
npm i -g vercel

# Login เข้า Vercel
vercel login

# Deploy
vercel --prod
```

### 3. หรือ Deploy ผ่าน GitHub
1. Push โค้ดขึ้น GitHub
2. เข้า [vercel.com](https://vercel.com)
3. Import โปรเจคจาก GitHub
4. Deploy อัตโนมัติ

## โครงสร้างไฟล์สำคัญ

- `api/documents.ts` - API สำหรับจัดการเอกสาร
- `api/categories.ts` - API สำหรับจัดการหมวดหมู่
- `vercel.json` - Configuration สำหรับ Vercel
- `src/services/api.ts` - Service สำหรับเรียก API

## การทำงาน

### Development Mode
- ใช้ JSON Server (`npm run json-server`)
- API: `http://localhost:3001`

### Production Mode (Vercel)
- ใช้ Vercel Serverless Functions
- API: `/api/documents`, `/api/categories`

## หมายเหตุ

⚠️ **ข้อมูลใน Production จะเก็บใน Memory เท่านั้น**
- ข้อมูลจะหายเมื่อ serverless function restart
- สำหรับการใช้งานจริงควรใช้ database (เช่น Vercel KV, PlanetScale)

## การอัพเกรดเป็น Database

หากต้องการข้อมูลถาวร แนะนำ:
1. **Vercel KV** (Redis) - สำหรับข้อมูลเล็กๆ
2. **PlanetScale** (MySQL) - สำหรับข้อมูลซับซ้อน
3. **Supabase** (PostgreSQL) - Full-stack solution