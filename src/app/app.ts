import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Footer } from "./shared/components/footer/footer";
import { AuthModalService } from './core/services/auth-modal.service';
import { Login } from './core/Auth/login/login';
import { Register } from './core/Auth/register/register';
import { AttractionService } from './core/services/attraction.service';
import { TourGuideService } from './core/services/tour-guide.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Footer, Login, Register, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('Voyago');

  constructor(
    public modal: AuthModalService,
    private attractionService: AttractionService,
    private tourGuideService: TourGuideService
  ) {}

  ngOnInit() {
    this.attractionService.getAll().subscribe();
    this.tourGuideService.getAll().subscribe();
  }
}