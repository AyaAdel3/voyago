import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-personal-information',
  standalone: true,
  imports: [RouterModule, FormsModule, CommonModule],
  templateUrl: './personal-information.html',
  styleUrl: './personal-information.css'
})
export class PersonalInformation {
  isEditing = false;

  user = {
    name: 'Mariam Mahmoud Yousif',
    email: 'Mariammyousiff9@gmail.com',
    phone: '+20 1045983677'
  };

  editData = {
    name: '',
    email: '',
    phone: ''
  };

  emailError = '';
  phoneError = '';

  onEdit() {
    this.editData = { name: '', email: '', phone: '' };
    this.emailError = '';
    this.phoneError = '';
    this.isEditing = true;
  }

  validateEmail(): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.editData.email)) {
      this.emailError = 'Invalid email format';
      return false;
    }
    this.emailError = '';
    return true;
  }

  validatePhone(): boolean {
    const phoneRegex = /^01[0125][0-9]{8}$/;
    if (!phoneRegex.test(this.editData.phone)) {
      this.phoneError = 'Phone must start with 010, 011, 012, or 015 followed by 8 digits';
      return false;
    }
    this.phoneError = '';
    return true;
  }

  onSave() {
    const emailValid = this.validateEmail();
    const phoneValid = this.validatePhone();

    if (!emailValid || !phoneValid) return;

    if (this.editData.name.trim()) this.user.name = this.editData.name;
    this.user.email = this.editData.email;
    this.user.phone = this.editData.phone;

    this.isEditing = false;
  }
}
