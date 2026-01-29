import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seedData() {
  console.log('Starting data seeding...');

  try {
    // ลบข้อมูลเก่า
    console.log('Clearing old data...');
    await supabase.from('documents').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('categories').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // เพิ่มหมวดหมู่
    console.log('Adding categories...');
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .insert({
        id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'เอกสาร คง.',
        expanded: true
      })
      .select()
      .single();

    if (categoryError) {
      console.error('Error adding category:', categoryError);
      throw categoryError;
    }

    console.log('Category added:', category);

    // เพิ่มเอกสาร
    console.log('Adding documents...');
    const documents = [
      {
        title: 'หน้าปก',
        path: '/source/ปก.pdf',
        category_id: null,
        order_index: 0
      },
      {
        title: 'แบบ คง. 01',
        path: '/source/แบบ-คง.-01.pdf',
        category_id: '550e8400-e29b-41d4-a716-446655440000',
        order_index: 1
      },
      {
        title: 'แบบ คง. 02',
        path: '/source/แบบ-คง.-02.pdf',
        category_id: '550e8400-e29b-41d4-a716-446655440000',
        order_index: 2
      },
      {
        title: 'แบบ คง. 03',
        path: '/source/แบบ-คง.-03.pdf',
        category_id: '550e8400-e29b-41d4-a716-446655440000',
        order_index: 3
      }
    ];

    const { data: docs, error: docsError } = await supabase
      .from('documents')
      .insert(documents)
      .select();

    if (docsError) {
      console.error('Error adding documents:', docsError);
      throw docsError;
    }

    console.log('Documents added:', docs);
    console.log('✅ Data seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

seedData();
