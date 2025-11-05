# @desource/phone-mask-react

React component and hook for international phone number input with smart masking and country detection.

## Features

- 🌍 Support for 240+ countries with accurate phone formats
- 🎭 Smart masking that adapts to each country's format
- 🔍 Country search and selection dropdown
- 🎨 Fully customizable with CSS variables
- 🌙 Light and dark theme support
- ♿ Accessible (WCAG 2.1 AA compliant)
- 📱 Mobile-friendly with responsive design
- 🪝 Hook-based API for maximum flexibility
- 🎯 TypeScript support with full type definitions

## Installation

```bash
npm install @desource/phone-mask-react
# or
pnpm add @desource/phone-mask-react
# or
yarn add @desource/phone-mask-react
```

## Usage

### Component Mode

```tsx
import { PhoneInput } from '@desource/phone-mask-react';
import '@desource/phone-mask-react/style.css';

function App() {
  const [phone, setPhone] = React.useState('');

  return (
    <PhoneInput
      value={phone}
      onChange={(data) => {
        setPhone(data.digits);
        console.log('Full:', data.full); // +1234567890
        console.log('Formatted:', data.fullFormatted); // +1 234-567-890
        console.log('Digits:', data.digits); // 234567890
      }}
      country="US"
      detect={true}
      showCopy={true}
      showClear={true}
    />
  );
}
```

### Hook Mode

For custom input implementations:

```tsx
import { usePhoneMask } from '@desource/phone-mask-react';

function CustomPhoneInput() {
  const {
    ref,
    digits,
    full,
    fullFormatted,
    isComplete,
    setCountry,
    country
  } = usePhoneMask({
    country: 'US',
    detect: true,
    onChange: (phone) => {
      console.log(phone.full, phone.digits);
    },
    onCountryChange: (country) => {
      console.log('Selected:', country.name);
    }
  });

  return (
    <div>
      <input
        ref={ref}
        type="tel"
        placeholder="Phone number"
      />
      <p>Formatted: {fullFormatted}</p>
      <p>Valid: {isComplete ? 'Yes' : 'No'}</p>
    </div>
  );
}
```

## API Reference

### PhoneInput Component

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | `''` | Controlled value (digits only) |
| `onChange` | `(data: PhoneNumber) => void` | - | Callback when value changes |
| `onCountryChange` | `(country: MaskFull) => void` | - | Callback when country changes |
| `onValidationChange` | `(isValid: boolean) => void` | - | Callback when validation state changes |
| `onFocus` | `(e: FocusEvent) => void` | - | Focus event handler |
| `onBlur` | `(e: FocusEvent) => void` | - | Blur event handler |
| `onCopy` | `(value: string) => void` | - | Callback when phone is copied |
| `onClear` | `() => void` | - | Callback when input is cleared |
| `country` | `string` | - | ISO 3166-1 alpha-2 country code (e.g., 'US', 'GB') |
| `detect` | `boolean` | `true` | Auto-detect country from geo IP or locale |
| `locale` | `string` | Browser locale | Locale for country names |
| `size` | `'compact' \| 'normal' \| 'large'` | `'normal'` | Size preset |
| `theme` | `'auto' \| 'light' \| 'dark'` | `'auto'` | Theme preset |
| `disabled` | `boolean` | `false` | Disable input |
| `readonly` | `boolean` | `false` | Make input readonly |
| `showCopy` | `boolean` | `true` | Show copy button |
| `showClear` | `boolean` | `false` | Show clear button |
| `withValidity` | `boolean` | `true` | Show validation styles |
| `searchPlaceholder` | `string` | `'Search country or code...'` | Dropdown search placeholder |
| `noResultsText` | `string` | `'No countries found'` | No results text |
| `clearButtonLabel` | `string` | `'Clear phone number'` | Clear button aria label |
| `dropdownClass` | `string` | - | Custom dropdown class |
| `disableDefaultStyles` | `boolean` | `false` | Disable built-in styles |

#### Render Props (Slots)

```tsx
<PhoneInput
  renderFlag={(country) => <CustomFlag country={country} />}
  renderCopySvg={(copied) => copied ? <CheckIcon /> : <CopyIcon />}
  renderClearSvg={() => <XIcon />}
  renderActionsBefore={() => <CustomButton />}
/>
```

#### Ref Methods

```tsx
const phoneInputRef = useRef<PhoneInputRef>(null);

// Available methods:
phoneInputRef.current?.focus();
phoneInputRef.current?.blur();
phoneInputRef.current?.clear();
phoneInputRef.current?.selectCountry('GB');
phoneInputRef.current?.getFullNumber(); // "+1234567890"
phoneInputRef.current?.getFullFormattedNumber(); // "+1 234-567-890"
phoneInputRef.current?.getDigits(); // "234567890"
phoneInputRef.current?.isValid(); // true/false
phoneInputRef.current?.isComplete(); // true/false
```

### usePhoneMask Hook

```tsx
const {
  ref,
  digits,
  full,
  fullFormatted,
  isComplete,
  isEmpty,
  shouldShowWarn,
  country,
  setCountry,
  clear
} = usePhoneMask(options);
```

#### Options

| Option | Type | Description |
|--------|------|-------------|
| `country` | `string` | ISO 3166-1 alpha-2 country code |
| `locale` | `string` | Locale for country names |
| `detect` | `boolean` | Auto-detect country |
| `onChange` | `(phone: PhoneNumber) => void` | Value change callback |
| `onCountryChange` | `(country: MaskFull) => void` | Country change callback |

#### Return Value

| Property | Type | Description |
|----------|------|-------------|
| `ref` | `RefObject<HTMLInputElement>` | Input ref to attach |
| `digits` | `string` | Raw digits without formatting |
| `full` | `string` | Full number with country code |
| `fullFormatted` | `string` | Formatted full number |
| `isComplete` | `boolean` | Whether number is complete |
| `isEmpty` | `boolean` | Whether input is empty |
| `shouldShowWarn` | `boolean` | Whether to show validation warning |
| `country` | `MaskFull` | Current country data |
| `setCountry` | `(code: string) => void` | Change country programmatically |
| `clear` | `() => void` | Clear input |

## Styling

The component uses CSS variables for easy customization:

```css
.phone-input {
  --pi-bg: #ffffff;
  --pi-fg: #111827;
  --pi-border: #e5e7eb;
  --pi-border-focus: #3b82f6;
  --pi-radius: 8px;
  --pi-padding: 12px;
  --pi-font-size: 16px;
  --pi-height: 44px;
  /* ... and many more */
}
```

Apply custom styles:

```css
.phone-input {
  --pi-border-focus: #8b5cf6;
  --pi-radius: 16px;
}
```

Or use `disableDefaultStyles` and provide your own styles completely.

## TypeScript

Full TypeScript support with exported types:

```tsx
import type {
  PhoneInputProps,
  PhoneInputRef,
  PhoneNumber,
  UsePhoneMaskOptions,
  UsePhoneMaskReturn,
  MaskFull
} from '@desource/phone-mask-react';
```

## License

MIT
