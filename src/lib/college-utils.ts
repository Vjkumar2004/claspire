/**
 * Utility function to get college logos based on short name or slug.
 */
export const getCollegeLogo = (shortName: string, slug?: string): string | null => {
  const logos: Record<string, string> = {
    'AAACET': '/aaaclg_logo.jpg',
    'AGPC': '/agpc.jpg',
    'ANJAC': '/anjac.jpg',
    'Kamaraj': '/kamaraj.jpg',
    'KCET': '/kamaraj.jpg',
    'SFR': '/sfr.jpg',
    'SKC': '/skc.jpg',
    'VVVC': '/vvvclogo.png',
    'VHNSN': '/vhnsn_college.jpg'
  }
  
  // Try exact short name match
  if (logos[shortName]) return logos[shortName];
  
  if (slug) {
    // Try exact slug match
    if (logos[slug]) return logos[slug];
    // Try slug uppercase
    if (logos[slug.toUpperCase()]) return logos[slug.toUpperCase()];
    
    // Fuzzy matching for slugs that might be partial
    for (const key of Object.keys(logos)) {
      if (slug.toUpperCase().includes(key.toUpperCase()) || key.toUpperCase().includes(slug.toUpperCase())) {
        return logos[key];
      }
    }
  }
  
  return null;
}
