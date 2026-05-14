import { Component, ViewEncapsulation, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { AuthModalService } from '../../services/auth-modal.service';
import { LanguageService } from '../../services/language.service';
import { AuthService } from '../../services/auth.service';

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
  isLoading    = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    public modal: AuthModalService,
    public lang: LanguageService,
    private auth: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(4)]]
    });
  }

  get code() { return this.form.get('code')!; }
  isInvalid(c: AbstractControl) { return c.invalid && (c.dirty || c.touched); }

  onSubmit(): void {
    this.errorMessage = '';
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.isLoading = true;

    this.auth.verifyOtp(this.code.value).subscribe({
      next: () => {
        this.isLoading = false;
        this.modal.openResetPassword();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        if (err.status === 0) {
          this.errorMessage = 'Connection error. Please try again later.';
        } else if (err.status === 400) {
          this.errorMessage = 'Invalid or expired code.';
        } else {
          const msg: string = err?.error?.message ?? '';
          this.errorMessage = msg || 'Something went wrong. Please try again.';
        }
        this.cdr.detectChanges();
      }
    });
  }

  resendCode(): void {
    this.modal.openForgotPassword();
  }
}