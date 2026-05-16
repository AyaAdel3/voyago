import { Component, OnDestroy, ViewEncapsulation, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule, FormBuilder, FormGroup,
  Validators, AbstractControl
} from '@angular/forms';
import { AuthModalService } from '../../services/auth-modal.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
  encapsulation: ViewEncapsulation.None
})
export class Login implements OnDestroy {
  form: FormGroup;
  showPassword = false;
  isLoading    = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    public modal: AuthModalService,
    private auth: AuthService,
    private router: Router,
    public lang: LanguageService,
    private cdr: ChangeDetectorRef
  ) {
    document.body.classList.add('modal-open');
    this.form = this.fb.group({
      identifier: ['', [Validators.required, Validators.email]],
      password:   ['', Validators.required]
    });
  }

  ngOnDestroy(): void {
    document.body.classList.remove('modal-open');
  }

  get identifier() { return this.form.get('identifier')!; }
  get password()   { return this.form.get('password')!; }

  isInvalid(c: AbstractControl) { return c.invalid && (c.dirty || c.touched); }
  togglePassword() { this.showPassword = !this.showPassword; }

  onSubmit(): void {
    this.errorMessage = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    this.auth.login(
      this.identifier.value,
      this.password.value
    ).subscribe({
      next: (result) => {
        this.isLoading = false;
        if (result.success) {
          this.modal.close();
          // ✅ الأدمن يروح dashboard، غيره يروح home
          if (this.auth.isAdmin()) {
            this.router.navigate(['/admin/dashboard']);
          } else {
            this.router.navigate(['/home']);
          }
        } else {
          this.errorMessage = result.message;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        this.isLoading = false;
        if (err.status === 0) {
          this.errorMessage = 'Connection error. Please try again later.';
        } else if (err.status === 401 || err.status === 400) {
          this.errorMessage = 'Invalid email or password.';
        } else {
          const msg: string = err?.error?.message ?? '';
          this.errorMessage = msg || 'Something went wrong. Please try again.';
        }
        this.cdr.detectChanges();
      }
    });
  }

  loginWithGoogle():   void { console.log('Google'); }
  loginWithFacebook(): void { console.log('Facebook'); }
  loginWithApple():    void { console.log('Apple'); }
}