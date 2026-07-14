import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
  console.log('Inspecting skin_images...');
  const { data: images, error: err1 } = await supabase.from('skin_images').select('*');
  console.log('Error 1:', err1?.message);
  console.log('Images count:', images?.length);
  if (images && images.length > 0) {
    console.log('Sample image:', { ...images[0], image_url: images[0].image_url.slice(0, 50) + '...' });
  }

  console.log('Inspecting ai_skin_analyses...');
  const { data: analyses, error: err2 } = await supabase.from('ai_skin_analyses').select('*');
  console.log('Error 2:', err2?.message);
  console.log('Analyses count:', analyses?.length);
  if (analyses && analyses.length > 0) {
    console.log('Sample analysis:', analyses[0]);
  }
}

inspect();
