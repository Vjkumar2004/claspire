const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('route.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const dir = path.join(__dirname, 'src/app/api/groups');
const files = walk(dir);

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    const originalContent = content;
    
    // Replace process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! with process.env.SUPABASE_SECRET_KEY!
    content = content.replace(/process\.env\.NEXT_PUBLIC_SUPABASE_ANON_KEY!/g, 'process.env.SUPABASE_SECRET_KEY!');
    
    // Handle the fallback case: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
    content = content.replace(/process\.env\.NEXT_PUBLIC_SUPABASE_ANON_KEY\s*\|\|\s*'placeholder'/g, "process.env.SUPABASE_SECRET_KEY || 'placeholder'");
    
    if (content !== originalContent) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Updated:', file);
    }
});
