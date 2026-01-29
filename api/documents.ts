import { VercelRequest, VercelResponse } from '@vercel/node';

// ข้อมูลเริ่มต้น (ในการใช้งานจริงควรใช้ database)
let documents = [
  { id: 'cover', title: 'หน้าปก', path: '/source/ปก.pdf', order: 0 },
  { id: '01', title: 'แบบ คง. 01', path: '/source/แบบ-คง.-01.pdf', category: 'forms', order: 1 },
  { id: '02', title: 'แบบ คง. 02', path: '/source/แบบ-คง.-02.pdf', category: 'forms', order: 2 },
  { id: '03', title: 'แบบ คง. 03', path: '/source/แบบ-คง.-03.pdf', category: 'forms', order: 3 },
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
      // ดึงเอกสารทั้งหมด
      const sortedDocs = documents.sort((a, b) => a.order - b.order);
      res.status(200).json(sortedDocs);
      break;

    case 'POST':
      // เพิ่มเอกสารใหม่
      const newDoc = {
        ...req.body,
        id: Date.now().toString(),
      };
      documents.push(newDoc);
      res.status(201).json(newDoc);
      break;

    case 'PATCH':
      // อัพเดทเอกสาร (สำหรับอัพเดทลำดับ)
      if (req.body.updateOrder) {
        // อัพเดทลำดับทั้งหมด
        const updatedDocs = req.body.documents;
        documents = updatedDocs.map((doc: any, index: number) => ({
          ...doc,
          order: index
        }));
        res.status(200).json({ message: 'Order updated successfully' });
      } else {
        // อัพเดทเอกสารเดี่ยว
        const { id } = req.query;
        const docIndex = documents.findIndex(doc => doc.id === id);
        if (docIndex !== -1) {
          documents[docIndex] = { ...documents[docIndex], ...req.body };
          res.status(200).json(documents[docIndex]);
        } else {
          res.status(404).json({ error: 'Document not found' });
        }
      }
      break;

    case 'DELETE':
      // ลบเอกสาร
      const { id } = req.query;
      const initialLength = documents.length;
      documents = documents.filter(doc => doc.id !== id);
      
      if (documents.length < initialLength) {
        res.status(200).json({ message: 'Document deleted successfully' });
      } else {
        res.status(404).json({ error: 'Document not found' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PATCH', 'DELETE']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}