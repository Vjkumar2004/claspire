const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
async function test() {
  const { data, error } = await supabase.from('senior_message_requests').select('*');
  console.log(data, error);
}
test();
