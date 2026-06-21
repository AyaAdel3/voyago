import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-terms-and-conditions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './terms-and-conditions.html',
  styleUrl: './terms-and-conditions.css'
})
export class TermsAndConditionsComponent {
  sections = [
    { id: 'acceptance', title: '1. Acceptance of Terms' },
    { id: 'services',   title: '2. Description of Services' },
    { id: 'accounts',   title: '3. User Accounts' },
    { id: 'bookings',   title: '4. Bookings & Reservations' },
    { id: 'conduct',    title: '5. User Conduct' },
    { id: 'content',    title: '6. Content & IP' },
    { id: 'disclaimer', title: '7. Disclaimer' },
    { id: 'liability',  title: '8. Limitation of Liability' },
    { id: 'changes',    title: '9. Changes to Terms' },
    { id: 'contact',    title: '10. Contact Us' },
  ];
}