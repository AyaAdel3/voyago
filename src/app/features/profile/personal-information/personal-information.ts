import { Component, inject, OnInit } from '@angular/core';
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
export class PersonalInformation implements OnInit {
  private auth = inject(AuthService);

  isEditing = false;
  isLoading = true;
  error = '';

  user = {
    firstName: '',
    lastName:  '',
    email:     '',
    phone:     ''
  };

  editData = {
    firstName: '',
    lastName:  '',
    phone:     ''
  };

  phoneError = '';

  get profileImage(): string {
    return this.auth.currentUser()?.profileImage || '';
  }

  ngOnInit(): void {
    this.auth.getProfile().subscribe({
      next: (user) => {
        this.user = {
          firstName: user.firstName,
          lastName:  user.lastName,
          email:     user.email,
          phone:     user.phone,
        };
        this.isLoading = false;
      },
      error: () => {
        const cached = this.auth.currentUser();
        if (cached) {
          this.user = {
            firstName: cached.firstName,
            lastName:  cached.lastName,
            email:     cached.email,
            phone:     cached.phone,
          };
        }
        this.isLoading = false;
      }
    });
  }

  removeImage(): void {
    this.auth.updateProfileImage('');
  }

  onImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      this.auth.updateProfileImage(reader.result as string);
    };
    reader.readAsDataURL(file);

    this.auth.uploadProfilePicture(file).subscribe({
      next: () => {
        this.auth.getProfile().subscribe();
      },
      error: err => console.error('Failed to upload profile picture:', err)
    });
  }

  onEdit(): void {
    this.editData = {
      firstName: this.user.firstName,
      lastName:  this.user.lastName,
      phone:     this.user.phone,
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

  onSave(): void {
    if (!this.validatePhone()) return;

    const newData = {
      firstName:   this.editData.firstName.trim() || this.user.firstName,
      lastName:    this.editData.lastName.trim()  || this.user.lastName,
      PhoneNumber: this.editData.phone,
    };

    this.auth.updateProfile(newData).subscribe({
      next: () => {
        this.user.firstName = newData.firstName;
        this.user.lastName  = newData.lastName;
        this.user.phone     = newData.PhoneNumber;

        this.auth.updateLocalUser({
          firstName: newData.firstName,
          lastName:  newData.lastName,
          phone:     newData.PhoneNumber,
        });

        this.isEditing = false;
      },
      error: err => console.error('Failed to update profile:', err)
    });
  }
}