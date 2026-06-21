import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './privacy-policy.html',
  styleUrl: './privacy-policy.css'
})
export class PrivacyPolicyComponent {
  sections = [
    { id: 'intro',        title: '1. Introduction' },
    { id: 'data-collect', title: '2. Data We Collect' },
    { id: 'data-use',     title: '3. How We Use Your Data' },
    { id: 'cookies',      title: '4. Cookies & Local Storage' },
    { id: 'sharing',      title: '5. Data Sharing' },
    { id: 'retention',    title: '6. Data Retention' },
    { id: 'security',     title: '7. Data Security' },
    { id: 'rights',       title: '8. Your Rights' },
    { id: 'children',     title: '9. Children\'s Privacy' },
    { id: 'changes',      title: '10. Changes to This Policy' },
    { id: 'contact',      title: '11. Contact Us' },
  ];
}