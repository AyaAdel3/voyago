import { Component, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule, FormBuilder, FormGroup,
  Validators, AbstractControl, ValidationErrors
} from '@angular/forms';
import { AuthModalService } from '../../services/auth-modal.service';
import { AuthService } from '../../services/auth.service';

function alphabeticOnly(c: AbstractControl): ValidationErrors | null {
  return /^[a-zA-Z\s]+$/.test(c.value || '') ? null : { alphabeticOnly: true };
}
function strongPassword(c: AbstractControl): ValidationErrors | null {
  const v = c.value || '';
  return (!/[A-Z]/.test(v) || !/[0-9]/.test(v) || !/[@#$%!&*]/.test(v))
    ? { weakPassword: true } : null;
}
function passwordMatch(g: AbstractControl): ValidationErrors | null {
  return g.get('password')?.value !== g.get('confirmPassword')?.value
    ? { passwordMismatch: true } : null;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
  encapsulation: ViewEncapsulation.None
})
export class Register {
  form: FormGroup;
  showPassword = false;
  showConfirmPassword = false;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  emailTaken = false;
  phoneTaken = false;

  constructor(
    private fb: FormBuilder,
    public modal: AuthModalService,
    private auth: AuthService
  ) {
    this.form = this.fb.group({
      fullName:        ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30), alphabeticOnly]],
      email:           ['', [Validators.required, Validators.email]],
      phone:           ['', [Validators.required, Validators.pattern(/^01[0125][0-9]{8}$/)]],
      password:        ['', [Validators.required, Validators.minLength(8), strongPassword]],
      confirmPassword: ['', Validators.required]
    }, { validators: passwordMatch });
  }

  get fullName()        { return this.form.get('fullName')!; }
  get email()           { return this.form.get('email')!; }
  get phone()           { return this.form.get('phone')!; }
  get password()        { return this.form.get('password')!; }
  get confirmPassword() { return this.form.get('confirmPassword')!; }

  isInvalid(c: AbstractControl) { return c.invalid && (c.dirty || c.touched); }
  togglePassword()        { this.showPassword = !this.showPassword; }
  toggleConfirmPassword() { this.showConfirmPassword = !this.showConfirmPassword; }

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.emailTaken = false;
    this.phoneTaken = false;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    const result = this.auth.register({
      fullName: this.fullName.value,
      email:    this.email.value,
      phone:    this.phone.value,
      password: this.password.value
    });

    this.isLoading = false;

    if (result.success) {
  this.modal.openLogin();
      setTimeout(() => this.modal.openLogin(), 1000);
    } else if (result.message.includes('email')) {
      this.emailTaken = true;
    } else if (result.message.includes('phone')) {
      this.phoneTaken = true;
    }
  }

  loginWithGoogle():   void { console.log('Google'); }
  loginWithFacebook(): void { console.log('Facebook'); }
  loginWithApple():    void { console.log('Apple'); }
}