/**
 * Migration script: sanitize HTML content in all existing posts.
 *
 * Run: npx tsx scripts/migrate-post-content.ts
 *
 * This connects to Supabase, fetches posts, runs them through the
 * sanitizeHtml function, and updates any that changed.
 *
 * Environment variables required (from .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SECRET_KEY
 */

import { createClient } from '@supabase/supabase-js'
import { sanitizeHtml } from '../src/lib/sanitizeHtml'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SECRET_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function migrate() {
  console.log('Fetching all posts...')

  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, content')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch posts:', error)
    process.exit(1)
  }

  console.log(`Found ${posts.length} posts`)

  let updated = 0
  let skipped = 0
  let errors = 0

  for (const post of posts) {
    try {
      const original = post.content || ''
      const sanitized = sanitizeHtml(original)

      if (sanitized === original) {
        skipped++
        continue
      }

      const { error: updateError } = await supabase
        .from('posts')
        .update({ content: sanitized, updated_at: new Date().toISOString() })
        .eq('id', post.id)

      if (updateError) {
        console.error(`  Failed to update post ${post.id}:`, updateError)
        errors++
      } else {
        updated++
        if (updated <= 5) {
          console.log(`  Updated ${post.id}:`)
          console.log(`    Before (first 200): ${original.slice(0, 200)}`)
          console.log(`    After  (first 200): ${sanitized.slice(0, 200)}`)
        }
      }
    } catch (err) {
      console.error(`  Error processing post ${post.id}:`, err)
      errors++
    }
  }

  console.log(`\nDone. Updated: ${updated}, Skipped: ${skipped}, Errors: ${errors}`)
}

migrate().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
