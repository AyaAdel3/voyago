import { Component, inject, effect, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-personal-information',
  standalone: true,
  imports: [RouterModule, FormsModule, CommonModule],
  templateUrl: './personal-information.html',
  styleUrl: './personal-information.css'
})
export class PersonalInformation {
  private auth = inject(AuthService);

  isEditing = false;

  user = {
    firstName: 'Mariam',
    lastName: 'Yousif',
    email: 'Mariammyousiff9@gmail.com',
    phone: '01045983677'
    
  };

  editData = {
    firstName: '',
    lastName: '',
    phone: ''
  };

  phoneError = '';

  // ✅ بتاخد الصورة من AuthService مباشرة
  get profileImage(): string {
    return this.auth.currentUser()?.profileImage || '';
  }

  // ✅ لما اليوزر يختار صورة بتحدث الـ AuthService
  onImageSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      this.auth.updateProfileImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  onEdit() {
    this.editData = {
      firstName: this.user.firstName,
      lastName: this.user.lastName,
      phone: this.user.phone,
    };
    this.phoneError = '';
    this.isEditing = true;
  }

  validatePhone(): boolean {
    const phoneRegex = /^01[0125][0-9]{8}$/;
    if (!this.editData.phone || !phoneRegex.test(this.editData.phone)) {
      this.phoneError = 'Invalid phone number format';
      return false;
    }
    this.phoneError = '';
    return true;
  }

  onSave() {
    if (!this.validatePhone()) return;
    if (this.editData.firstName.trim()) this.user.firstName = this.editData.firstName;
    if (this.editData.lastName.trim()) this.user.lastName = this.editData.lastName;
    this.user.phone = this.editData.phone;
    this.isEditing = false;
  }
}