import type { DropdownOption } from '../components/Dropdown';

export const PHONE_COUNTRY_CODES: DropdownOption[] = [
  { value: '+66', label: '+66' },
  { value: '+1',  label: '+1'  },
  { value: '+44', label: '+44' },
  { value: '+65', label: '+65' },
  { value: '+81', label: '+81' },
  { value: '+86', label: '+86' },
  { value: '+91', label: '+91' },
  { value: '+61', label: '+61' },
  { value: '+82', label: '+82' },
  { value: '+33', label: '+33' },
  { value: '+49', label: '+49' },
];

const KNOWN_CODES = PHONE_COUNTRY_CODES.map((c) => c.value);

/** Split a stored phone string (e.g. "+66812345678") into { code, number }. */
export function parsePhoneNumber(phone: string): { code: string; number: string } {
  if (!phone) return { code: '+66', number: '' };
  if (phone.startsWith('+')) {
    const matched = KNOWN_CODES.find((c) => phone.startsWith(c));
    if (matched) return { code: matched, number: phone.slice(matched.length).trim() };
  }
  return { code: '+66', number: phone };
}
