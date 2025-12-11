'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CountryCodeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

const countryCodes = [
  { code: '+1', flag: '🇺🇸', country: 'US/Canada' },
  { code: '+91', flag: '🇮🇳', country: 'India' },
  { code: '+44', flag: '🇬🇧', country: 'UK' },
  { code: '+61', flag: '🇦🇺', country: 'Australia' },
  { code: '+86', flag: '🇨🇳', country: 'China' },
  { code: '+81', flag: '🇯🇵', country: 'Japan' },
  { code: '+49', flag: '🇩🇪', country: 'Germany' },
  { code: '+33', flag: '🇫🇷', country: 'France' },
  { code: '+39', flag: '🇮🇹', country: 'Italy' },
  { code: '+34', flag: '🇪🇸', country: 'Spain' },
  { code: '+7', flag: '🇷🇺', country: 'Russia' },
  { code: '+55', flag: '🇧🇷', country: 'Brazil' },
  { code: '+52', flag: '🇲🇽', country: 'Mexico' },
  { code: '+27', flag: '🇿🇦', country: 'South Africa' },
  { code: '+82', flag: '🇰🇷', country: 'South Korea' },
  { code: '+971', flag: '🇦🇪', country: 'UAE' },
  { code: '+966', flag: '🇸🇦', country: 'Saudi Arabia' },
  { code: '+65', flag: '🇸🇬', country: 'Singapore' },
  { code: '+60', flag: '🇲🇾', country: 'Malaysia' },
  { code: '+62', flag: '🇮🇩', country: 'Indonesia' },
  { code: '+84', flag: '🇻🇳', country: 'Vietnam' },
  { code: '+66', flag: '🇹🇭', country: 'Thailand' },
  { code: '+63', flag: '🇵🇭', country: 'Philippines' },
  { code: '+64', flag: '🇳🇿', country: 'New Zealand' },
  { code: '+31', flag: '🇳🇱', country: 'Netherlands' },
  { code: '+46', flag: '🇸🇪', country: 'Sweden' },
  { code: '+47', flag: '🇳🇴', country: 'Norway' },
  { code: '+45', flag: '🇩🇰', country: 'Denmark' },
  { code: '+41', flag: '🇨🇭', country: 'Switzerland' },
  { code: '+32', flag: '🇧🇪', country: 'Belgium' },
  { code: '+351', flag: '🇵🇹', country: 'Portugal' },
  { code: '+353', flag: '🇮🇪', country: 'Ireland' },
  { code: '+358', flag: '🇫🇮', country: 'Finland' },
  { code: '+48', flag: '🇵🇱', country: 'Poland' },
  { code: '+36', flag: '🇭🇺', country: 'Hungary' },
  { code: '+420', flag: '🇨🇿', country: 'Czech Republic' },
  { code: '+43', flag: '🇦🇹', country: 'Austria' },
  { code: '+30', flag: '🇬🇷', country: 'Greece' },
  { code: '+90', flag: '🇹🇷', country: 'Turkey' },
  { code: '+20', flag: '🇪🇬', country: 'Egypt' },
  { code: '+234', flag: '🇳🇬', country: 'Nigeria' },
  { code: '+254', flag: '🇰🇪', country: 'Kenya' },
  { code: '+212', flag: '🇲🇦', country: 'Morocco' },
  { code: '+54', flag: '🇦🇷', country: 'Argentina' },
  { code: '+56', flag: '🇨🇱', country: 'Chile' },
  { code: '+57', flag: '🇨🇴', country: 'Colombia' },
  { code: '+51', flag: '🇵🇪', country: 'Peru' },
  { code: '+58', flag: '🇻🇪', country: 'Venezuela' },
];

export function CountryCodeSelector({ value, onChange, disabled, className }: CountryCodeSelectorProps) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className={className || "w-[140px] border-gray-200 focus:border-purple-300 focus:ring-purple-200"}>
        <SelectValue placeholder="Code" />
      </SelectTrigger>
      <SelectContent className="max-h-[300px]">
        {countryCodes.map((country) => (
          <SelectItem key={country.code} value={country.code}>
            <span className="flex items-center gap-2">
              <span>{country.flag}</span>
              <span>{country.code}</span>
              <span className="text-xs text-gray-500">({country.country})</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

