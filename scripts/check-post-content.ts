import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SECRET_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkPosts() {
  console.log('Fetching recent posts to check content format...\n')

  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, title, content')
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) {
    console.error('Failed to fetch posts:', error)
    process.exit(1)
  }

  console.log(`Found ${posts.length} posts\n`)

  for (const post of posts) {
    console.log('='.repeat(80))
    console.log(`Post ID: ${post.id}`)
    console.log(`Title: ${post.title}`)
    console.log('\nContent (raw from DB):')
    console.log('-'.repeat(80))
    console.log(post.content)
    console.log('-'.repeat(80))
    console.log('\n')
  }
}

checkPosts().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
