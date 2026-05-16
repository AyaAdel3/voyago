import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Footer } from "./shared/components/footer/footer";
import { AuthModalService } from './core/services/auth-modal.service';
import { Login } from './core/Auth/login/login';
import { Register } from './core/Auth/register/register';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Footer, Login, Register, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Voyago');

  constructor(public modal: AuthModalService) {}
}