import { Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  PhoneInputComponent,
  PhoneMaskDirective,
  PhonePipe,
  usePhoneMask,
  type PhoneNumber,
  type PhonePipeOptions
} from '@desource/phone-mask-angular';
import { getFlagEmoji } from '@desource/phone-mask-angular/core';

@Component({
  selector: 'consumer-app',
  imports: [PhoneInputComponent, PhoneMaskDirective, PhonePipe, ReactiveFormsModule],
  template: `
    <phone-input country="US" [value]="digits()" (valueChange)="digits.set($event)" (phoneChange)="changed($event)" />
    <phone-input country="US" [formControl]="control" />
    <phone-input value="2125557890" />
    <input [phoneMask]="{ country: 'US' }" [formControl]="directiveControl" />
    <p>{{ '+12345678888' | phone: undefined : phoneOptions }}</p>
    <p>{{ '+7 123 456 7788' | phone: 'US' : phoneOptions }}</p>
    <p>{{ '234 567 8888' | phone: 'US' : { code: false, flag: true } }}</p>
    <p>{{ mask.fullFormatted() }}</p>
    <p>{{ flag('US') }}</p>
  `
})
export class Consumer {
  readonly phoneOptions: PhonePipeOptions = { flag: true };
  readonly flag = getFlagEmoji;
  readonly digits = signal('2025550123');
  readonly control = new FormControl('4155552671', { nonNullable: true });
  readonly directiveControl = new FormControl('6505551234', { nonNullable: true });
  readonly mask = usePhoneMask({ value: this.digits, onChange: (value) => this.digits.set(value), country: 'US' });
  changed(phone: PhoneNumber): void {
    this.digits.set(phone.digits);
  }
}
