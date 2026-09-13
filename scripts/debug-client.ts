import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('--- ALL CLIENTS ---');
  const { data: clients } = await supabase.from('clients').select('*');
  console.log(clients);

  console.log('--- ALL PROFILES ---');
  const { data: profiles } = await supabase.from('user_profiles').select('*');
  console.log(profiles);

  console.log('--- ALL CERTS ---');
  const { data: certs } = await supabase.from('certificates').select('*');
  console.log(certs);

  console.log('--- ALL ACTIVITIES ---');
  const { data: acts } = await supabase.from('activities').select('*');
  console.log(acts);
}

main();
