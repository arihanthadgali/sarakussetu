/**
 * Indian-grouped rupee formatting (1,45,000) implemented without Intl so the
 * output is identical on every Android/Hermes build.
 */
export function formatNumberIN(value: number, fractionDigits = 0): string {
  const negative = value < 0;
  const fixed = Math.abs(value).toFixed(fractionDigits);
  const [whole = '0', fraction] = fixed.split('.');

  const lastThree = whole.slice(-3);
  const rest = whole.slice(0, -3);
  const grouped = rest
    ? `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${lastThree}`
    : lastThree;

  return `${negative ? '-' : ''}${grouped}${fraction ? `.${fraction}` : ''}`;
}

/** ₹1,450 for whole rupees, ₹32.50 when paise are present. */
export function formatRupees(value: number): string {
  const hasPaise = Math.round(value * 100) % 100 !== 0;
  return `₹${formatNumberIN(value, hasPaise ? 2 : 0)}`;
}

/** Up to two initials for an avatar: "Example Store" -> "ES". */
export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const letters = words.slice(0, 2).map((word) => word[0] ?? '');
  return letters.join('').toUpperCase() || '?';
}

const UNCOUNTED_UNITS = new Set(['kg', 'g', 'l', 'ml', 'litre']);

/** "bag" -> "bags", "box" -> "boxes", "pouch" -> "pouches"; weights/volumes stay as-is. */
export function pluralizeUnit(unit: string, quantity: number): string {
  if (quantity === 1 || UNCOUNTED_UNITS.has(unit.toLowerCase())) return unit;
  if (/(s|x|z|ch|sh)$/i.test(unit)) return `${unit}es`;
  return `${unit}s`;
}
