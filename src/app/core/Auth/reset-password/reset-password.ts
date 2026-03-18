import { Component, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthModalService } from '../../services/auth-modal.service';
import { LanguageService } from '../../services/language.service';

function strongPassword(c: AbstractControl): ValidationErrors | null {
  const v = c.value || '';
  return (!/[A-Z]/.test(v) || !/[0-9]/.test(v) || !/[@#$%!&*]/.test(v)) ? { weakPassword: true } : null;
}
function passwordMatch(g: AbstractControl): ValidationErrors | null {
  return g.get('password')?.value !== g.get('confirmPassword')?.value ? { passwordMismatch: true } : null;
}

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css',
  encapsulation: ViewEncapsulation.None
})
export class ResetPassword {
  form: FormGroup;
  showPassword        = false;
  showConfirmPassword = false;
  isLoading           = false;
  errorMessage        = '';

  constructor(
    private fb: FormBuilder,
    public modal: AuthModalService,
    public lang: LanguageService
  ) {
    this.form = this.fb.group({
      password:        ['', [Validators.required, Validators.minLength(8), strongPassword]],
      confirmPassword: ['', Validators.required]
    }, { validators: passwordMatch });
  }

  get password()        { return this.form.get('password')!; }
  get confirmPassword() { return this.form.get('confirmPassword')!; }

  isInvalid(c: AbstractControl) { return c.invalid && (c.dirty || c.touched); }
  togglePassword()        { this.showPassword        = !this.showPassword; }
  toggleConfirmPassword() { this.showConfirmPassword = !this.showConfirmPassword; }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.isLoading = true;
    setTimeout(() => {
      this.isLoading = false;
      this.modal.openLogin();
    }, 1000);
  }
}