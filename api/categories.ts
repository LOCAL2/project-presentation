import { VercelRequest, VercelResponse } from '@vercel/node';

// ข้อมูลเริ่มต้น
let categories = [
  { id: 'forms', title: 'เอกสาร คง.', expanded: true },
];

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { method } = req;

  switch (method) {
    case 'GET':
      // ดึงหมวดหมู่ทั้งหมด
      res.status(200).json(categories);
      break;

    case 'POST':
      // เพิ่มหมวดหมู่ใหม่
      const newCategory = {
        ...req.body,
        id: `cat_${Date.now()}`,
      };
      categories.push(newCategory);
      res.status(201).json(newCategory);
      break;

    case 'PATCH':
      // อัพเดทหมวดหมู่
      const { id } = req.query;
      const categoryIndex = categories.findIndex(cat => cat.id === id);
      if (categoryIndex !== -1) {
        categories[categoryIndex] = { ...categories[categoryIndex], ...req.body };
        res.status(200).json(categories[categoryIndex]);
      } else {
        res.status(404).json({ error: 'Category not found' });
      }
      break;

    case 'DELETE':
      // ลบหมวดหมู่
      const { id: deleteId } = req.query;
      const initialLength = categories.length;
      categories = categories.filter(cat => cat.id !== deleteId);
      
      if (categories.length < initialLength) {
        res.status(200).json({ message: 'Category deleted successfully' });
      } else {
        res.status(404).json({ error: 'Category not found' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PATCH', 'DELETE']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}