import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LanguageService } from '../../../app/core/services/language.service';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './not-found.html',
  styleUrl: './not-found.css'
})
export class NotFound {
  particles = Array.from({ length: 18 }, () => ({
    x:        Math.random() * 100,
    y:        Math.random() * 100,
    size:     Math.random() * 4 + 2,
    delay:    `${(Math.random() * 5).toFixed(1)}s`,
    duration: `${(Math.random() * 4 + 4).toFixed(1)}s`,
  }));

constructor(private router: Router, public lang: LanguageService) {}
  goHome(): void { this.router.navigate(['/home']); }
}