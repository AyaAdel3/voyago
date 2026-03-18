import { Component, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { AuthModalService } from '../../services/auth-modal.service';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
  encapsulation: ViewEncapsulation.None
})
export class ForgotPassword {
  form: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor(private fb: FormBuilder, public modal: AuthModalService , public lang: LanguageService) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  get email() { return this.form.get('email')!; }
  isInvalid(c: AbstractControl) { return c.invalid && (c.dirty || c.touched); }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.isLoading = true;
    setTimeout(() => {
      this.isLoading = false;
      this.modal.openEnterCode();
    }, 1000);
  }
}