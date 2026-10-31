# @desource/phone-mask-angular

> Angular phone input component, headless masking function, directive, and pipe with Google libphonenumber data

[![npm version](https://img.shields.io/npm/v/@desource/phone-mask-angular?color=blue&logo=angular)](https://www.npmjs.com/package/@desource/phone-mask-angular)
[![code coverage](https://img.shields.io/codecov/c/gh/DeSource-Labs/phone-mask?logo=codecov)](https://codecov.io/gh/DeSource-Labs/phone-mask)
[![SonarCloud](https://sonarcloud.io/api/project_badges/measure?project=DeSource-Labs_phone-mask&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=DeSource-Labs_phone-mask)
[![Ask CodeWiki](https://img.shields.io/badge/Ask%20CodeWiki-007af4?logo=googlegemini&logoColor=white)](https://codewiki.google/github.com/desource-labs/phone-mask)
[![Ask Context7](https://img.shields.io/badge/Ask%20Context7-059669.svg?logo=data:image/svg%2bxml;base64,PHN2ZyB3aWR0aD0iMjgiIGhlaWdodD0iMjgiIHZpZXdCb3g9IjAgMCAyOCAyOCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTI0IDBINEMxLjc5MDg2IDAgMCAxLjc5MDg2IDAgNFYyNEMwIDI2LjIwOTEgMS43OTA4NiAyOCA0IDI4SDI0QzI2LjIwOTEgMjggMjggMjYuMjA5MSAyOCAyNFY0QzI4IDEuNzkwODYgMjYuMjA5MSAwIDI0IDBaIiBmaWxsPSIjRjdGMkU4IiBmaWxsLW9wYWNpdHk9IjAuNjUiLz4KPHBhdGggZD0iTTEwLjYgMTUuMjk5MkMxMC42IDE3LjQ5OTIgOS43MDAwNSAxOS4zOTkyIDguMjAwMDUgMjEuMDk5MkgxMS42VjIyLjc5OTJINi4zMDAwNVYyMS4xOTkyQzguMDAwMDUgMTkuMzk5MiA4LjYwMDA1IDE3Ljg5OTIgOC42MDAwNSAxNS4yOTkySDEwLjZaTTE3LjQgMTUuMjk5MkMxNy40IDE3LjQ5OTIgMTguMyAxOS4zOTkyIDE5LjggMjEuMDk5MkgxNi40VjIyLjc5OTJIMjEuN1YyMS4xOTkyQzIwIDE5LjM5OTIgMTkuNCAxNy44OTkyIDE5LjQgMTUuMjk5MkgxNy40Wk0xMC42IDEyLjY5OTJDMTAuNiAxMC40OTkyIDkuNzAwMDUgOC41OTkyMiA4LjIwMDA1IDYuODk5MjJIMTEuNlY1LjE5OTIySDYuMzAwMDVWNi43OTkyMkM4LjAwMDA1IDguNTk5MjIgOC42MDAwNSAxMC4wOTkyIDguNjAwMDUgMTIuNjk5MkgxMC42Wk0xNy40IDEyLjY5OTJDMTcuNCAxMC40OTkyIDE4LjMgOC41OTkyMiAxOS44IDYuODk5MjJIMTYuNFY1LjE5OTIySDIxLjdWNi43OTkyMkMyMCA4LjU5OTIyIDE5LjQgMTAuMDk5MiAxOS40IDEyLjY5OTJIMTcuNFoiIGZpbGw9ImJsYWNrIi8+Cjwvc3ZnPgo=)](https://context7.com/desource-labs/phone-mask)
[![Ask DeepWiki](https://img.shields.io/badge/Ask%20DeepWiki-1c398e.svg?logo=data:image/svg%2bxml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0iI2NiY2JjYiIgYXJpYS1oaWRkZW49InRydWUiPjxwYXRoIGQ9Ik0xOC42IDIwLjFxMS0uNiAyLjItLjZoLjNhNCA0IDAgMCAxIDIgLjdoLjJ2LjFsMSAxaC4xdi4yaC4xbC4xLjF2LjFxLjcgMSAuNyAyLjN0LS42IDIuMnYuMWwtLjIuMkE0IDQgMCAwIDEgMjMgMjhoLS4ydi4xbC0xLjQuNGgtLjVxLTEuMyAwLTIuMy0uNWwtNC4xLTIuNC04LjMgNC44djkuNWw4LjMgNC44IDguMi00LjhWMzVxMC0xLjIuNi0yLjJ2LS4xbC4yLS4yYTQgNCAwIDAgMSAxLjctMS41bDEuMy0uNGguNnExLjMgMCAyLjMuNmw0LjIgMi4zIDguMi00Ljd2LTkuNmwtOC4yLTQuNy00LjIgMi4zcS0xIC42LTIuMi42aC0uM2E0IDQgMCAwIDEtMi0uNmwtLjItLjEtMS0xaC0uMXYtLjJoLS4xbC0uMS0uMnYtLjFxLS43LTEtLjctMi4yVjguMmwtOC4yLTQuNy04LjMgNC43djkuNWw4LjIgNC44eiIvPjwvc3ZnPg==)](https://deepwiki.com/DeSource-Labs/phone-mask)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/DeSource-Labs/phone-mask/blob/main/LICENSE)

A standalone, signal-based phone input for Angular 19–22, powered by the shared phone-mask core.

## ✨ Features

- Standalone component with signal inputs, two-way binding, and `OnPush` change detection.
- SSR and hydration support, including formatted server HTML.
- Zoneless operation: the library does not import or require `zone.js`.
- Reactive and template-driven Angular Forms through `ControlValueAccessor`.
- Country search, keyboard navigation, smart cursor handling, and paste formatting.
- Light/dark themes, copy and clear actions, and validation feedback.
- Optional GeoIP detection and localized country names.
- Separate CSS and a tree-shakeable Angular Package Format build produced by `ng-packagr`.

## 📦 Installation

```bash
npm install @desource/phone-mask-angular
# or
yarn add @desource/phone-mask-angular
# or
pnpm add @desource/phone-mask-angular
```

The package supports Angular 19–22. Keep `@angular/common`, `@angular/core`, and `@angular/forms` on matching versions in your application.

Import component styles once in your global stylesheet:

```css
@import '@desource/phone-mask-angular/assets/lib.css';
```

The directive, headless masking function, and pipe do not require these styles.

## 🚀 Quick Start

### Importing

```ts
import { PhoneInputComponent, PhoneMaskDirective, PhonePipe, usePhoneMask } from '@desource/phone-mask-angular';
```

Add the component, directive, or pipe to your standalone component's `imports`. Call `usePhoneMask()` in an injection context when building a custom input.

### Component Mode

```ts
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PhoneInputComponent } from '@desource/phone-mask-angular';

@Component({
  selector: 'app-profile',
  imports: [PhoneInputComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label for="mobile">Mobile number</label>
    <phone-input id="mobile" name="mobile" country="US" [(value)]="phone" />
    <p>Digits without calling code: {{ phone() }}</p>
  `
})
export class Profile {
  readonly phone = signal('2025550123');
}
```

`value` contains digits without the country calling code. Use `phoneChange` for the full international number:

```html
<phone-input [(value)]="phone" (phoneChange)="savePhone($event.full)" />
```

Pasting a complete international number beginning with `+` detects its country from existing masks, replaces the whole input, and updates the country before formatting. This applies to the component, directive, and `usePhoneMask()`, even with `country` supplied or GeoIP `detect` disabled. Ambiguous masks use a default country, such as US for `+1`. Other pastes keep the current country and use normal insertion behavior.

## 📖 Component API

### Inputs

| Input                  | Type                               | Default                                                 |
| ---------------------- | ---------------------------------- | ------------------------------------------------------- |
| `value`                | `string`                           | `''`                                                    |
| `country`              | ISO country code                   | Unspecified; country selection is available             |
| `detect`               | `boolean`                          | `true`                                                  |
| `locale`               | `string`                           | English on the server, browser language after rendering |
| `theme`                | `'auto' \| 'light' \| 'dark'`      | `'auto'`                                                |
| `size`                 | `'compact' \| 'normal' \| 'large'` | `'normal'`                                              |
| `id`, `name`           | `string`                           | Unspecified; applied to the native input                |
| `disabled`, `readonly` | `boolean`                          | `false`                                                 |
| `showCopy`             | `boolean`                          | `true`                                                  |
| `showClear`            | `boolean`                          | `false`                                                 |
| `withValidity`         | `boolean`                          | `true`                                                  |
| `searchPlaceholder`    | `string`                           | `'Search country or code...'`                           |
| `noResultsText`        | `string`                           | `'No countries found'`                                  |
| `clearButtonLabel`     | `string`                           | `'Clear phone number'`                                  |
| `dropdownClass`        | `string`                           | `''`                                                    |
| `disableDefaultStyles` | `boolean`                          | `false`                                                 |

Setting `country` locks the country selector. Omit it to let users choose a country; use `selectCountry()` to set an initial selection without locking it.

### Outputs

| Output                    | Value                                            |
| ------------------------- | ------------------------------------------------ |
| `valueChange`             | Digits without the calling code, for `[(value)]` |
| `phoneChange`             | `{ digits, full, fullFormatted }`                |
| `countryChange`           | Country metadata (`PMaskFull`)                   |
| `validationChange`        | Whether all required digits are present          |
| `phoneFocus`, `phoneBlur` | Native `FocusEvent`                              |
| `touchedChange`           | `true` on blur, for Signal Forms compatibility   |
| `copied`                  | Copied phone number                              |
| `cleared`                 | No payload                                       |

### Exposed Methods

Access the component through an Angular template reference or `viewChild`:

```html
<phone-input #phoneInput [(value)]="phone" />
<button type="button" (click)="phoneInput.focus()">Focus</button>
<button type="button" (click)="phoneInput.selectCountry('GB')">Use UK</button>
<button type="button" (click)="phoneInput.clear()">Clear</button>
```

Also available: `blur()`, `getDigits()`, `getFullNumber()`, `getFullFormattedNumber()`, `isComplete()`, and `isValid()`. Completeness checks digit count against the selected mask; it does not verify that a number is assigned or reachable.

### Custom Templates

Pass an Angular `TemplateRef` through `flagTemplate`, `copyTemplate`, `clearTemplate`, or `actionsTemplate`. The flag template receives the country as `$implicit` and `country`; the copy template receives the copied state as `$implicit` and `copied`.

```html
<ng-template #flag let-country>{{ country.id }}</ng-template>
<ng-template #actions><button class="pi-btn" type="button" (click)="openHelp()">Help</button></ng-template>
<phone-input [(value)]="phone" [flagTemplate]="flag" [actionsTemplate]="actions" />
```

`actionsTemplate` appears before the built-in buttons and reserves one action's width. Override `--pi-actions-count` if your template needs more space.

## 📝 Angular Forms

Import `ReactiveFormsModule` alongside the component:

```ts
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { PhoneInputComponent } from '@desource/phone-mask-angular';

@Component({
  selector: 'app-contact-form',
  imports: [ReactiveFormsModule, PhoneInputComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<phone-input country="US" [formControl]="phone" />`
})
export class ContactForm {
  readonly phone = new FormControl('', { nonNullable: true });
}
```

Form values contain digits without the country calling code. The component propagates changes, touched state, and disabled state. Add your application's validators to the control; visual completeness feedback does not register a form validator.

Supply digits valid for the selected country, excluding the calling code. Programmatic values are formatted and clamped for display without rewriting your form model; use the `phoneChange` event's `digits` field to observe the canonical value.

Template-driven forms also work with `FormsModule` and `[(ngModel)]`. Choose a form binding or `[(value)]` for each input so one owner controls the value.

Signal Forms also work through the component's existing bindings: Angular 21.0 uses `Field` / `[field]`; Angular 22 uses `FormField` / `[formField]`. Use the API available in your installed Angular version. The `touchedChange` output preserves blur handling for Angular 21's integration.

## 🧩 Directive API

Use a native input with your own markup and styles. Import `PhoneMaskDirective` into the component's `imports`:

```html
<input [phoneMask]="{ country: 'US' }" [(ngModel)]="phone" />
```

For a fixed country, `phoneMask="US"` is equivalent. The directive integrates with Angular Forms and emits digits without the calling code through its value accessor. Its options accept `country`, `locale`, `detect`, `onChange`, and `onCountryChange`. Detection defaults to `false` for the directive.

```html
<input [phoneMask]="{ country: selectedCountry(), onChange: onPhoneChange }" />
```

`onChange` receives `{ digits, full, fullFormatted }`; `onCountryChange` receives country metadata.

## 🪝 Headless API

`usePhoneMask()` is a headless masking function that exposes a signal-based API for custom inputs. Call it in an Angular injection context, such as a component field initializer. State and cleanup belong to that component instance.

```ts
import { ChangeDetectionStrategy, Component, ElementRef, signal, viewChild } from '@angular/core';
import { usePhoneMask } from '@desource/phone-mask-angular';

@Component({
  selector: 'app-custom-phone',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <input
      #input
      type="tel"
      [value]="mask.displayValue()"
      [placeholder]="mask.displayPlaceholder()"
      aria-label="Phone number"
    />
    <p>{{ mask.fullFormatted() }}</p>
    <button type="button" (click)="mask.setCountry('GB')">Use UK</button>
  `
})
export class CustomPhone {
  readonly input = viewChild<ElementRef<HTMLInputElement>>('input');
  readonly digits = signal('');
  readonly mask = usePhoneMask({
    input: () => this.input()?.nativeElement,
    value: this.digits,
    onChange: (digits) => this.digits.set(digits),
    country: 'US'
  });
}
```

Bind `displayValue` and `displayPlaceholder` in the template to render the custom input's value during SSR. The function attaches editing behavior after browser rendering and removes listeners when the input or component is destroyed.

`value` and `onChange` are required. Pass an `input` getter to attach editing behavior to a native input; omit it when only consuming the formatted signals. Options `country`, `locale`, and `detect` accept a plain value, signal, or getter. Detection defaults to `false`. Optional callbacks are `onPhoneChange` and `onCountryChange`.

The return value exposes signals for `digits`, `displayValue`, `displayPlaceholder`, `full`, `fullFormatted`, `country`, `locale`, `formatter`, `isComplete`, `isEmpty`, and `shouldShowWarn`, and the `setCountry(code)` / `clear()` methods.

## 🔤 Pipe API

Import `PhonePipe` into your component's `imports` to display a phone number. International values beginning with `+` can detect the country from their mask and length. Pass an ISO country code for numbers without a calling code or to resolve countries sharing a calling code:

```html
{{ '+12345678888' | phone }}
<!-- +1 234 567 8888 -->
{{ '+12345678888' | phone: 'US': { code: false } }}
<!-- 234 567 8888 -->
{{ '+12345678888' | phone: 'US': { flag: true } }}
<!-- 🇺🇸 +1 234 567 8888 -->
{{ '+12345678888' | phone: 'US': { code: false, flag: true } }}
<!-- 🇺🇸 234 567 8888 -->
```

Digits without a calling code (`'2345678888'`) and preformatted values (`'234 567 8888'` or `'+1 234 567 8888'`) produce the same output. The pipe uses the selected country's mask groups, separated by spaces.

The optional second argument accepts the exported `PhonePipeOptions` type:

| Option | Type      | Default | Effect                            |
| ------ | --------- | ------- | --------------------------------- |
| `code` | `boolean` | `true`  | Include the country calling code. |
| `flag` | `boolean` | `false` | Prepend the country flag emoji.   |

Only an explicit `+` calling code is removed from the input; bare digits are treated as a number without a calling code. Without a country, numbers lacking a calling code and unsuccessful detection return the original value. Mask detection uses a default country for ties, such as US for `+1`; it does not inspect area-code allocations. Pass `undefined` or `null` as the country to combine detection with options.

A supplied country takes priority when its calling code matches the value, so `CA` keeps the Canadian flag for `+1`. If the calling code differs, successful detection takes priority: `'+7 123 456 7788' | phone: 'US'` displays `+7 123 456 7788` using KZ. If detection fails, the original value is preserved.

The pipe preserves significant leading zeros and does not infer trunk prefixes or extensions. Empty, whitespace-only, `null`, and `undefined` values render as `''`. Unsupported countries, invalid characters, extensions, and numbers exceeding the selected mask's length return the original value unchanged.

The pipe is pure and works during SSR without browser APIs. Angular formats again when the value, country, or options reference changes. Inline options work as shown above; replace a stored options object when changing its properties.

## 🌐 SSR and Zoneless Applications

Use your application's normal Angular SSR and hydration setup. The library does not require `ngSkipHydration`, browser-only wrappers, or Zone.js.

Server rendering uses deterministic defaults: English country names and a light theme when `theme="auto"`. After browser rendering, the component applies the browser's locale and color preference. GeoIP requests run only in the browser. Set `country`, `locale`, and an explicit `theme` when the server already knows those preferences and you want the same initial appearance.

Angular 21+ uses zoneless change detection by default. Earlier versions need the matching bootstrap provider: `provideExperimentalZonelessChangeDetection()` on Angular 19 and early Angular 20, or `provideZonelessChangeDetection()` where available. See [Angular's zoneless guide](https://angular.dev/guide/zoneless) and [hydration guide](https://angular.dev/guide/hydration).

## 🎨 Component Styling

Styles are opt-in through `assets/lib.css`. Set CSS custom properties on `.desource-phone-input` and `.desource-phone-dropdown`:

```css
.desource-phone-input,
.desource-phone-dropdown {
  --pi-radius: 6px;
  --pi-border-focus: #2563eb;
  --pi-font-size: 16px;
}
```

The dropdown is attached to `document.body` to avoid clipping by parent containers. Apply dropdown overrides globally or use `dropdownClass`; component-scoped CSS does not reach the portal.

## 🛠️ Core Utilities

The secondary entry point re-exports the shared core utilities and country data:

```ts
import { getFlagEmoji, formatDigitsWithMap } from '@desource/phone-mask-angular/core';
```

## 📦 What's Included

The published package contains unminified FESM2022 modules, partial Angular declarations, TypeScript declarations, and separate CSS. Angular's application build links and optimizes the library. ESM and Angular's linker are required; no UMD or CommonJS build is provided.

```text
@desource/phone-mask-angular/
├── phone-mask-angular.css                     # Component styles, exported as assets/lib.css
├── core/index.d.ts                            # Core utilities and country data types
├── fesm2022/
│   ├── desource-phone-mask-angular.mjs         # Component, headless API, directive, and pipe
│   └── desource-phone-mask-angular-core.mjs    # Core secondary entry point
├── index.d.ts                                 # Public API declarations
├── README.md
└── package.json
```

## 🔗 Related Packages

- [@desource/phone-mask](https://github.com/DeSource-Labs/phone-mask/blob/main/packages/core) — Core library
- [@desource/phone-mask-react](https://github.com/DeSource-Labs/phone-mask/blob/main/packages/react) — React bindings
- [@desource/phone-mask-svelte](https://github.com/DeSource-Labs/phone-mask/blob/main/packages/svelte) — Svelte bindings
- [@desource/phone-mask-vue](https://github.com/DeSource-Labs/phone-mask/blob/main/packages/vue) — Vue 3 bindings
- [@desource/phone-mask-nuxt](https://github.com/DeSource-Labs/phone-mask/blob/main/packages/nuxt) — Nuxt module

## 📄 License

[MIT](https://github.com/DeSource-Labs/phone-mask/blob/main/LICENSE) © 2026 DeSource Labs

## 🤝 Contributing

See [Contributing Guide](https://github.com/DeSource-Labs/phone-mask/blob/main/CONTRIBUTING.md) for development, testing, and publication checks.

---

<div align="center">
  <sub>Made with ❤️ by <a href="https://github.com/DeSource-Labs">DeSource Labs</a></sub>
</div>
