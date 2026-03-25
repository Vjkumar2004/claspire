
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function listColleges() {
  const { data, error } = await supabase
    .from('colleges')
    .select('name, short_name, slug')
    .order('name')

  if (error) {
    console.error('Error fetching colleges:', error)
    return
  }

  console.log('--- Colleges in Database ---')
  data.forEach(c => {
    console.log(`- ${c.name} | Short: ${c.short_name} | Slug: ${c.slug}`)
  })
}

listColleges()
