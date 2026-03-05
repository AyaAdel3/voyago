import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  isDarkMode = false;

ngOnInit(): void {
  const savedMode = localStorage.getItem('darkMode');
  if (savedMode === 'true') {
    this.isDarkMode = true;
    this.applyDarkMode();
  }
}

toggleDarkMode(): void {
  this.isDarkMode = !this.isDarkMode;
  this.applyDarkMode();
  localStorage.setItem('darkMode', this.isDarkMode.toString());
}

applyDarkMode(): void {
  if (this.isDarkMode) {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }
}

}

