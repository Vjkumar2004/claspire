/**
 * Resolve college logo from database `logo_url`.
 */
export type CollegeLogoSource = {
  logo_url?: string | null
  short_name?: string | null
  name?: string | null
  slug?: string | null
}

export const getCollegeLogo = (college?: CollegeLogoSource | null): string | null => {
  const url = college?.logo_url?.trim()
  return url || null
}

export const getCollegeInitial = (college?: CollegeLogoSource | null): string => {
  return (
    college?.short_name?.[0] ||
    college?.name?.[0] ||
    college?.slug?.[0]?.toUpperCase() ||
    'C'
  )
}
