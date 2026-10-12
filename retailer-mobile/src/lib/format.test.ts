import { formatNumberIN, formatRupees, initialsOf, pluralizeUnit } from './format';

describe('formatNumberIN', () => {
  it.each([
    [0, '0'],
    [420, '420'],
    [8082, '8,082'],
    [145000, '1,45,000'],
    [12345678, '1,23,45,678'],
  ])('%p -> %p', (value, expected) => expect(formatNumberIN(value)).toBe(expected));
});

describe('formatRupees', () => {
  it('drops paise for whole rupees', () => expect(formatRupees(1450)).toBe('₹1,450'));
  it('keeps paise when present', () => expect(formatRupees(1886.85)).toBe('₹1,886.85'));
});

describe('initialsOf', () => {
  it('uses the first two words', () => expect(initialsOf('Ganesh Traders')).toBe('GT'));
  it('handles a single word', () => expect(initialsOf('ganesh')).toBe('G'));
});

describe('pluralizeUnit', () => {
  it.each([
    ['bag', 5, 'bags'],
    ['box', 10, 'boxes'],
    ['pouch', 50, 'pouches'],
    ['kg', 50, 'kg'],
    ['bag', 1, 'bag'],
  ])('%s x%p -> %s', (unit, qty, expected) => expect(pluralizeUnit(unit, qty)).toBe(expected));
});
