const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

const MISSING_DATA = [
  {
    slug: "sfr",
    name: "The Standard Fireworks Rajaratnam College for Women",
    short_name: "SFR College",
    location: "Sivakasi, Tamil Nadu",
    type: "Arts",
    state: "Tamil Nadu",
    display_name: "SFR College Hub"
  }
];

async function seed() {
  for (const item of MISSING_DATA) {
    console.log(`Processing ${item.name}...`);
    
    // Check college
    let { data: college } = await supabase
      .from('colleges')
      .select('id')
      .eq('name', item.name)
      .single();

    if (!college) {
      console.log(`Inserting college ${item.name}...`);
      const { data: newCollege, error } = await supabase
        .from('colleges')
        .insert({
          name: item.name,
          short_name: item.short_name,
          location: item.location,
          type: item.type,
          state: item.state
        })
        .select()
        .single();
      
      if (error) {
        console.error('College insert error:', error);
        continue;
      }
      college = newCollege;
    }

    // Check community
    const { data: community } = await supabase
      .from('communities')
      .select('id')
      .eq('slug', item.slug)
      .single();

    if (!community && college) {
      console.log(`Inserting community ${item.slug}...`);
      const { error } = await supabase
        .from('communities')
        .insert({
          slug: item.slug,
          display_name: item.display_name,
          college_id: college.id,
          member_count: 750,
          senior_count: 25,
          doubt_count: 45
        });
      
      if (error) console.error('Community insert error:', error);
    } else {
      console.log(`Community ${item.slug} already exists.`);
    }
  }
  console.log('Done.');
}

seed();
