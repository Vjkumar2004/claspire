export function sanitizeSearchInput(input: string, maxLength = 100): string {
  return input.replace(/[%_()=',;|$^*{}[\]\\`"<>]/g, '').slice(0, maxLength)
}

export function sanitizeOrFilterValue(value: string): string {
  return value.replace(/[%_()=',;|$^*{}[\]\\`"<>]/g, '').slice(0, 100)
}

export function buildSafeOrFilter(
  column: string,
  operator: string,
  value: string
): string {
  const safe = sanitizeOrFilterValue(value)
  return `${column}.${operator}.%${safe}%`
}
