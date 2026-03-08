import { Component, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { AuthModalService } from '../../services/auth-modal.service';

@Component({
  selector: 'app-enter-code',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './enter-code.html',
  styleUrl: './enter-code.css',
  encapsulation: ViewEncapsulation.None
})
export class EnterCode {
  form: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor(private fb: FormBuilder, public modal: AuthModalService) {
    this.form = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(4)]]
    });
  }

  get code() { return this.form.get('code')!; }
  isInvalid(c: AbstractControl) { return c.invalid && (c.dirty || c.touched); }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.isLoading = true;
    setTimeout(() => {
      this.isLoading = false;
      this.modal.openResetPassword();
    }, 1000);
  }

  resendCode(): void {
    this.modal.openForgotPassword();
  }
}