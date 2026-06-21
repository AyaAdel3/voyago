import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chatbot } from '../../shared/components/chatbot/chatbot';

@Component({
  selector: 'app-contact-us',
  standalone: true,
  imports: [CommonModule, FormsModule, Chatbot],
  templateUrl: './contact-us.html',
  styleUrl: './contact-us.css'
})
export class ContactUsComponent {
  @ViewChild(Chatbot) chatbot!: Chatbot;

  name         = '';
  email        = '';
  subject      = '';
  message      = '';
  isSubmitting = false;
  submitted    = false;

  submitForm() {
    if (!this.name || !this.email || !this.message) return;
    this.isSubmitting = true;
    setTimeout(() => {
      this.isSubmitting = false;
      this.submitted    = true;
      this.name = this.email = this.subject = this.message = '';
    }, 1500);
  }

  openChat() {
    this.chatbot?.toggle();
  }
}