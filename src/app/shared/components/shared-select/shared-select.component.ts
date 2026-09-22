import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

@Component({
  selector: 'app-shared-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './shared-select.component.html',
  styleUrls: ['./shared-select.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SharedSelectComponent),
      multi: true
    }
  ]
})
export class SharedSelectComponent implements ControlValueAccessor {
  @Input() options: any[] = [];
  @Input() disabled: boolean = false;
  @Input() name: string = '';
  @Input() placeholder?: string;
  @Input() cssClass: string = '';
  
  @Output() valueChange = new EventEmitter<any>();

  value: any = null;

  onChange: any = () => {};
  onTouch: any = () => {};

  writeValue(value: any): void {
    this.value = value;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouch = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onModelChange(val: any) {
    this.value = val;
    this.onChange(val);
    this.valueChange.emit(val);
  }
}
