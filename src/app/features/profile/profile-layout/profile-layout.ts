import { Component, inject, signal, effect, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { DarkModeService } from '../../../core/services/dark-mode.service';
import { AuthService } from '../../../core/services/auth.service';
import { ImageCropperComponent, ImageCroppedEvent } from 'ngx-image-cropper';
import { NgZone } from '@angular/core';

@Component({
  selector: 'app-profile-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet, ImageCropperComponent],
  templateUrl: './profile-layout.html',
  styleUrl: './profile-layout.css',
})
export class ProfileLayout {
  private router = inject(Router);
  public darkMode = inject(DarkModeService);
  private auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  profileImage = signal<string>('');
  showCropper = false;
  imageChangedEvent: Event | null = null;
  croppedImage = '';

  titleMap: Record<string, string> = {
    '/profile/personal-information': 'Personal Information',
    '/profile/favorites':            'Favorites',
    '/profile/saved-plan':           'Saved Plan',
    '/profile/my-bookings': 'My Bookings',
  };

  currentTitle = 'Profile';

  constructor() {
    const existing = this.auth.currentUser()?.profileImage;
    if (existing) this.profileImage.set(existing);

    this.updateTitle(this.router.url);
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => this.updateTitle(e.urlAfterRedirects));

    effect(() => {
      const img = this.auth.currentUser()?.profileImage || '';
      this.profileImage.set(img);
    });
  }

  private updateTitle(url: string): void {
    const clean = url.split('?')[0];
    this.currentTitle = this.titleMap[clean] ?? 'Profile';
  }

  get isDarkMode(): boolean { return this.darkMode.isDarkMode(); }

  get userName(): string {
    const user = this.auth.currentUser();
    return user ? `${user.firstName} ${user.lastName}` : '';
  }

  get userInitials(): string {
    const user = this.auth.currentUser();
    if (!user) return 'U';
    return `${user.firstName?.charAt(0) ?? ''}${user.lastName?.charAt(0) ?? ''}`.toUpperCase();
  }

  onImageSelected(event: Event): void {
    this.imageChangedEvent = event;
    this.showCropper = true;
    this.cdr.detectChanges();
  }

  onImageCropped(event: ImageCroppedEvent): void {
    if (event.base64) {
      this.croppedImage = event.base64;
    } else if (event.blob) {
      const reader = new FileReader();
      reader.onload = () => {
        this.croppedImage = reader.result as string;
      };
      reader.readAsDataURL(event.blob);
    }
  }

  saveCrop(): void {
  const imageToSave = this.croppedImage;
  if (imageToSave) {
    // عرض محلي فوري
    this.auth.updateProfileImage(imageToSave);
    this.profileImage.set(imageToSave);

    // حوّل base64 لـ File وابعته للـ API
    fetch(imageToSave)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], 'profile.jpg', { type: 'image/jpeg' });
        this.auth.uploadProfilePicture(file).subscribe({
          next: () => {
            this.auth.getProfile().subscribe();
          },
          error: err => console.error('Failed to upload profile picture:', err)
        });
      });
  }

  this.showCropper = false;
  this.croppedImage = '';
  this.imageChangedEvent = null;
  this.cdr.detectChanges();
}

  cancelCrop(): void {
    this.showCropper = false;
    this.imageChangedEvent = null;
    this.croppedImage = '';
  }

  removeProfileImage(): void {
    this.auth.updateProfileImage('');
    this.profileImage.set('');
    this.cdr.detectChanges();
  }

  // ✅ استنى الـ revoke يخلص الأول، بعدين روح لـ home
  logout(): void {
    this.auth.logout().subscribe({
      complete: () => this.router.navigate(['/home'])
    });
  }
}