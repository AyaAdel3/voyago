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
    firstName: 'Mariam',
    lastName: 'Yousif',
    email: 'Mariammyousiff9@gmail.com',  // ثابت مش بيتغير
    phone: '01045983677'
  };

  editData = {
    firstName: '',
    lastName: '',
    phone: ''
    // مفيش email هنا عشان مش بيتعدل
  };

  phoneError = '';

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
    const phoneValid = this.validatePhone();
    if (!phoneValid) return;

    // بنحدث الاسم والتليفون بس — الـ email مش بيتغير
    if (this.editData.firstName.trim()) this.user.firstName = this.editData.firstName;
    if (this.editData.lastName.trim()) this.user.lastName = this.editData.lastName;
    this.user.phone = this.editData.phone;

    this.isEditing = false;
    console.log('Profile Updated Successfully!');
  }
}