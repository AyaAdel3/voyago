import { Component, OnDestroy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule, FormBuilder, FormGroup,
  Validators, AbstractControl, ValidationErrors
} from '@angular/forms';
import { AuthModalService } from '../../services/auth-modal.service';
import { AuthService } from '../../services/auth.service';
import { LanguageService } from '../../services/language.service';

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
export class Register implements OnDestroy {
  form: FormGroup;
  showPassword = false;
  showConfirmPassword = false;
  isLoading = false;
  errorMessage = '';
  emailTaken = false;
  phoneTaken = false;

  constructor(
    private fb: FormBuilder,
    public modal: AuthModalService,
    private auth: AuthService,
    public lang: LanguageService
  ) {
    document.body.classList.add('modal-open');
    this.form = this.fb.group({
      firstName:       ['', [Validators.required, Validators.minLength(2), Validators.maxLength(30), alphabeticOnly]],
      lastName:        ['', [Validators.required, Validators.minLength(2), Validators.maxLength(30), alphabeticOnly]],
      email:           ['', [Validators.required, Validators.email]],
      phone:           ['', [Validators.required, Validators.pattern(/^01[0125][0-9]{8}$/)]],
      password:        ['', [Validators.required, Validators.minLength(8), strongPassword]],
      confirmPassword: ['', Validators.required]
    }, { validators: passwordMatch });
  }

  ngOnDestroy() {
    document.body.classList.remove('modal-open');
  }

  get firstName()       { return this.form.get('firstName')!; }
  get lastName()        { return this.form.get('lastName')!; }
  get email()           { return this.form.get('email')!; }
  get phone()           { return this.form.get('phone')!; }
  get password()        { return this.form.get('password')!; }
  get confirmPassword() { return this.form.get('confirmPassword')!; }

  isInvalid(c: AbstractControl) { return c.invalid && (c.dirty || c.touched); }
  togglePassword()        { this.showPassword = !this.showPassword; }
  toggleConfirmPassword() { this.showConfirmPassword = !this.showConfirmPassword; }

  onSubmit(): void {
    this.errorMessage = '';
    this.emailTaken   = false;
    this.phoneTaken   = false;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    this.auth.register({
      firstName:   this.firstName.value,
      lastName:    this.lastName.value,
      email:       this.email.value,
      PhoneNumber: this.phone.value,
      password:    this.password.value
    }).subscribe({
      next: (res) => {
        this.isLoading = false;

        localStorage.setItem('voyago_token', res.token);
        localStorage.setItem('voyago_refresh_token', res.refreshToken);

        // ✅ FIX: أضفنا roles
        const user = {
          firstName: res.firstName,
          lastName:  res.lastName,
          email:     res.email,
          phone:     this.phone.value,
          roles:     res.roles ?? []
        };
        localStorage.setItem('voyago_current_user', JSON.stringify(user));
        this.auth.currentUser.set(user);

        this.modal.openLogin();
      },
      error: (err) => {
        this.isLoading = false;
        const msg: string = err?.error?.message ?? '';
        if (msg.toLowerCase().includes('email')) {
          this.emailTaken = true;
        } else if (msg.toLowerCase().includes('phone')) {
          this.phoneTaken = true;
        } else {
          this.errorMessage = msg || 'Something went wrong. Please try again.';
        }
      }
    });
  }

  loginWithGoogle():   void { console.log('Google'); }
  loginWithFacebook(): void { console.log('Facebook'); }
  loginWithApple():    void { console.log('Apple'); }
}