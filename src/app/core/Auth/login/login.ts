import { Component, OnDestroy, ViewEncapsulation } from '@angular/core';
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
    public lang: LanguageService
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

    const result = this.auth.login(
      this.identifier.value,
      this.password.value
    );

    this.isLoading = false;

    if (result.success) {
      this.modal.close();
      this.router.navigate(['/home']);
    } else {
      this.errorMessage = result.message;
    }
  }

  loginWithGoogle():   void { console.log('Google'); }
  loginWithFacebook(): void { console.log('Facebook'); }
  loginWithApple():    void { console.log('Apple'); }
}