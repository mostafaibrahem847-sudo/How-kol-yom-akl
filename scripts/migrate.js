// Run after: supabase db reset / apply schema
// Uses the anon key from .env / app.json extra

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://lawoormzqfeyafjrptwc.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_hmUpy67-fc1dlFXICZ2Scw_9M7k12lq';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Import placeholder recipes from src/data/recipes.ts (or hardcode here for script simplicity)
const recipes = [
  { id: 'okra', title: 'طاجن بامية باللحمة الضاني', subtitle: 'مع الرز بالشعرية المفلفل والليمون المعصفر', description: 'بالطشة البلدي والليمون المعصفر، ريحة تجيب آخر الشارع', category: 'طواجن أصيلة', minutes: 45, persons: 5, difficulty: 'متوسطة', rating: 4.9, audio_available: true, occasion: 'محبوبة العيلة', category_color: 'olive' },
  { id: 'molokhia', title: 'ملوخية خضرا بالطشة مع فراخ محمرة', description: 'سر عِرق الملوخية المظبوط وطشة التوم بالكزبرة الناشفة', category: 'أكلة الأسبوع', minutes: 35, persons: 4, difficulty: 'سهلة', audio_available: true, category_color: 'olive' },
  // ... add full list when ready
];

async function migrate() {
  console.log('Starting migration...');
  for (const r of recipes) {
    const { error } = await supabase.from('recipes').upsert({ ...r, id: r.id }, { onConflict: 'id' });
    if (error) console.error('Recipe error:', r.id, error.message);
    else console.log('Inserted:', r.id);
  }
  console.log('Migration complete.');
}

migrate();
