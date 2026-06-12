/**
 * One-time migration: Move embedded profile data from bio to profile_data column.
 *
 * Prerequisites:
 *   1. The profile_data JSONB column must exist on the users table.
 *      Run supabase/migrations/20260612000001_add_profile_data_column.sql
 *      in the Supabase dashboard SQL editor first.
 *
 *   2. Set SUPABASE_URL and SUPABASE_SECRET_KEY environment variables,
 *      or they will be read from .env.local automatically.
 *
 * Usage: node scripts/migrate-profile-data.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const PROFILE_MARKER = '\n\n<!-- claspire-profile:v1 -->';

// Load env from .env.local
const envPath = path.resolve(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SECRET_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
  console.log('Fetching users with embedded profile data...');

  // Get all users whose bio contains the profile marker
  const { data: users, error } = await supabase
    .from('users')
    .select('id, bio')
    .ilike('bio', '%claspire-profile:v1%');

  if (error) {
    console.error('Error fetching users:', error.message);
    process.exit(1);
  }

  console.log(`Found ${users.length} users with embedded data`);

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const user of users) {
    const bio = user.bio || '';
    const markerIdx = bio.indexOf(PROFILE_MARKER);
    if (markerIdx === -1) {
      // Try without preceding newlines (legacy format)
      const altIdx = bio.indexOf('<!-- claspire-profile:v1 -->');
      if (altIdx === -1) {
        skipped++;
        continue;
      }
      const cleanBio = bio.slice(0, altIdx).trim();
      const jsonStr = bio.slice(altIdx + '<!-- claspire-profile:v1 -->'.length).trim();
      try {
        const profileData = JSON.parse(jsonStr);
        if (!profileData.student && !profileData.senior) {
          skipped++;
          continue;
        }
        const { error: updateError } = await supabase
          .from('users')
          .update({ bio: cleanBio, profile_data: profileData })
          .eq('id', user.id);
        if (updateError) {
          console.error(`  Error updating ${user.id}: ${updateError.message}`);
          errors++;
        } else {
          console.log(`  ✓ Migrated ${user.id} (${Object.keys(profileData).join(', ')})`);
          migrated++;
        }
      } catch {
        console.error(`  ✗ Invalid JSON for ${user.id}: ${jsonStr.substring(0, 80)}`);
        errors++;
      }
      continue;
    }

    const cleanBio = bio.slice(0, markerIdx).trim();
    const jsonStr = bio.slice(markerIdx + PROFILE_MARKER.length).trim();

    try {
      const profileData = JSON.parse(jsonStr);
      if (!profileData.student && !profileData.senior) {
        skipped++;
        continue;
      }
      const { error: updateError } = await supabase
        .from('users')
        .update({ bio: cleanBio, profile_data: profileData })
        .eq('id', user.id);
      if (updateError) {
        console.error(`  Error updating ${user.id}: ${updateError.message}`);
        errors++;
      } else {
        console.log(`  ✓ Migrated ${user.id} (${Object.keys(profileData).join(', ')})`);
        migrated++;
      }
    } catch {
      console.error(`  ✗ Invalid JSON for ${user.id}: ${jsonStr.substring(0, 80)}`);
      errors++;
    }
  }

  console.log(`\nDone: ${migrated} migrated, ${skipped} skipped, ${errors} errors`);
}

migrate().catch(console.error);
