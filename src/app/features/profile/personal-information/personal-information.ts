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

  // البيانات الأساسية اللي بتظهر في الـ View Mode
  user = {
    name: 'Mariam Mahmoud Yousif',
    email: 'Mariammyousiff9@gmail.com',
    phone: '01045983677' // شيلت الـ +20 عشان الـ Validation بتاعك يشتغل صح (01XXXXXXXX)
  };

  // النسخة اللي بنعدل عليها في الـ Edit Mode
  editData = {
    name: '',
    email: '',
    phone: ''
  };

  emailError = '';
  phoneError = '';

  onEdit() {
    // أهم تعديل: بنملى الـ editData ببيانات اليوزر الحالية عشان تظهر في الـ Inputs
    this.editData = { ...this.user }; 
    this.emailError = '';
    this.phoneError = '';
    this.isEditing = true;
  }

  validateEmail(): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!this.editData.email || !emailRegex.test(this.editData.email)) {
      this.emailError = 'Please enter a valid email address';
      return false;
    }
    this.emailError = '';
    return true;
  }

  validatePhone(): boolean {
    // الـ Regex بتاعك ممتاز (بيبدأ بـ 01 وبعده 0-1-2-5 وبعده 8 أرقام)
    const phoneRegex = /^01[0125][0-9]{8}$/;
    if (!this.editData.phone || !phoneRegex.test(this.editData.phone)) {
      this.phoneError = 'Invalid phone number format';
      return false;
    }
    this.phoneError = '';
    return true;
  }

  onSave() {
    // بنعمل Validate قبل ما نسيف
    const emailValid = this.validateEmail();
    const phoneValid = this.validatePhone();

    if (!emailValid || !phoneValid) return;

    // لو الاسم مش فاضي بنحدثه
    if (this.editData.name.trim()) {
      this.user.name = this.editData.name;
    }
    
    this.user.email = this.editData.email;
    this.user.phone = this.editData.phone;

    this.isEditing = false;
    
    // اختياري: ممكن تعمل Alert بسيط عشان اليوزر يحس إن التغيير حصل
    console.log('Profile Updated Successfully!');
  }
}