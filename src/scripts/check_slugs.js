const fetchColleges = async () => {
  try {
    const res = await fetch('http://localhost:3000/api/colleges');
    const data = await res.json();
    if (data.success) {
      console.log('Communities:');
      data.communities.forEach(c => {
        console.log(`- Slug: ${c.slug}, College: ${c.colleges?.name}`);
      });
    }
  } catch (err) {
    console.error('Error:', err);
  }
};
fetchColleges();
