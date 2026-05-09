# @desource/phone-mask-angular

> Angular phone input component, directive, pipe, and service API with smart masking and Google libphonenumber data

[![npm version](https://img.shields.io/npm/v/@desource/phone-mask-angular?color=blue&logo=angular)](https://www.npmjs.com/package/@desource/phone-mask-angular)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/DeSource-Labs/phone-mask/blob/main/LICENSE)

Beautiful, accessible, tree-shakeable Angular phone input with auto-formatting, country selector, validation, forms support, and signal-first APIs.

## Features

- Standalone Angular component, directive, pipe, and `UsePhoneMaskService`
- Signal inputs and `model()` two-way value binding
- Works with Angular forms through `ControlValueAccessor`
- Smart country search with keyboard navigation
- As-you-type formatting with stable caret handling
- Optional GeoIP and locale country detection
- APF package output with partial compilation
- Core mask data and kit utilities re-exported from `@desource/phone-mask-angular/core`

## Installation

```bash
npm install @desource/phone-mask-angular
# or
pnpm add @desource/phone-mask-angular
```

## Quick Start

```ts
import { Component, signal } from '@angular/core';
import { PhoneInputComponent, type PMaskPhoneNumber } from '@desource/phone-mask-angular';

@Component({
  selector: 'app-checkout-phone',
  standalone: true,
  imports: [PhoneInputComponent],
  template: `
    <desource-phone-input
      [(value)]="phoneDigits"
      country="US"
      theme="auto"
      [showClear]="true"
      (phoneChange)="onPhoneChange($event)"
      (validationChange)="isValid.set($event)"
    />

    @if (isValid()) {
      <p>Valid phone number</p>
    }
  `
})
export class CheckoutPhoneComponent {
  readonly phoneDigits = signal('');
  readonly isValid = signal(false);

  onPhoneChange(phone: PMaskPhoneNumber): void {
    console.log(phone.digits, phone.full, phone.fullFormatted);
  }
}
```

The component also works as an Angular form control:

```html
<desource-phone-input formControlName="phone" country="US" />
```

## Directive Mode

Use the directive when you want to own the input markup and styling:

```ts
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PhoneMaskDirective, type PMaskPhoneNumber } from '@desource/phone-mask-angular';

@Component({
  selector: 'app-custom-phone',
  standalone: true,
  imports: [FormsModule, PhoneMaskDirective],
  template: `
    <input phoneMask [(ngModel)]="digits" [phoneMaskCountry]="country()" (phoneMaskChange)="onPhoneChange($event)" />
  `
})
export class CustomPhoneComponent {
  readonly country = signal('US');
  digits = '';

  onPhoneChange(phone: PMaskPhoneNumber): void {
    console.log(phone.fullFormatted);
  }
}
```

You can also bind directive options directly:

```html
<input
  [phoneMask]="{ country: 'GB', detect: false }"
  [(phoneMaskValue)]="digits"
  (phoneMaskCountryChange)="country = $event"
/>
```

## Pipe

```ts
import { Component } from '@angular/core';
import { PhoneMaskPipe } from '@desource/phone-mask-angular';

@Component({
  selector: 'app-phone-summary',
  standalone: true,
  imports: [PhoneMaskPipe],
  template: `
    <p>{{ '2025551234' | phoneMask }}</p>
    <p>{{ '2025551234' | phoneMask: { mode: 'fullFormatted' } }}</p>
  `
})
export class PhoneSummaryComponent {}
```

## Custom Templates

```html
<desource-phone-input [(value)]="digits">
  <ng-template #flag let-country="country">
    <span>{{ country.id }}</span>
  </ng-template>

  <ng-template #actionsBefore>
    <button type="button" class="pi-btn" (click)="openHelp()">?</button>
  </ng-template>
</desource-phone-input>
```

Available template refs are `#flag`, `#actionsBefore`, `#copySvg`, and `#clearSvg`.

## Core Utilities

```ts
import { getFlagEmoji, formatDigitsWithMap } from '@desource/phone-mask-angular/core';
```

## Styles

The component ships its default styles with the component. A compiled stylesheet is also available for manual use:

```ts
import '@desource/phone-mask-angular/assets/lib.css';
```
