import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Chatbot } from '../../shared/components/chatbot/chatbot';

interface FaqItem { q: string; a: string; open: boolean; }
interface FaqCategory { title: string; items: FaqItem[]; }

@Component({
  selector: 'app-faqs',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './Faqs.html',
  styleUrl: './Faqs.css'
})
export class FaqsComponent {
  @ViewChild(Chatbot) chatbot!: Chatbot;

  faqs: FaqCategory[] = [
    {
      title: '🏨 Hotels & Bookings',
      items: [
        { q: 'How do I book a hotel on Voyago?', a: 'Browse hotels, select your preferred one, choose your dates, and click "Book Now". You\'ll receive a confirmation email shortly after.', open: false },
        { q: 'Can I cancel my hotel reservation?', a: 'Yes. Go to your profile, open "My Bookings", and select the reservation you wish to cancel. Cancellation policies vary by hotel.', open: false },
        { q: 'Are the hotel prices shown final?', a: 'Prices shown include all taxes and fees. The final amount will be confirmed on the booking summary page before payment.', open: false },
      ]
    },
    {
      title: '🍽️ Restaurants',
      items: [
        { q: 'Can I reserve a table at a restaurant?', a: 'Yes, select a restaurant and click "Reserve a Table". Fill in your details and preferred time, and the restaurant will confirm your booking.', open: false },
        { q: 'How are restaurants rated on Voyago?', a: 'Ratings are based on verified user reviews submitted after dining. We display an average score out of 5 stars.', open: false },
      ]
    },
    {
      title: '🗺️ Tourist Attractions & Tour Guides',
      items: [
        { q: 'How do I find attractions near me in Fayum?', a: 'Use the Attractions page and filter by category (nature, history, adventure). You can also ask Emma our chatbot for personalized suggestions.', open: false },
        { q: 'How do I hire a tour guide?', a: 'Visit the Tour Guides page, browse available guides, view their profiles and ratings, then click "Book" to schedule a tour.', open: false },
        { q: 'Are tour guides verified on Voyago?', a: 'Yes. All tour guides listed on Voyago go through a verification process before being published on the platform.', open: false },
      ]
    },
    {
      title: '💰 Budget Planning',
      items: [
        { q: 'What is the Budget Planning feature?', a: 'It helps you estimate the total cost of your trip by calculating hotel, restaurant, and attraction expenses in one place.', open: false },
        { q: 'Can I save my budget plan?', a: 'Yes. Log in to your account and your budget plans will be saved automatically to your profile for future reference.', open: false },
      ]
    },
    {
      title: '👤 Account & Profile',
      items: [
        { q: 'How do I create an account?', a: 'Click "Sign Up" at the top of the page, fill in your details, and verify your email. Your account will be ready instantly.', open: false },
        { q: 'I forgot my password. What should I do?', a: 'Click "Forgot Password" on the login page. Enter your email and we\'ll send you a reset link within a few minutes.', open: false },
        { q: 'How do I update my profile picture?', a: 'Go to your Profile page, click on your avatar, and upload a new photo. You can also crop it to fit perfectly.', open: false },
      ]
    },
    {
      title: '🚨 Emergency Assistance',
      items: [
        { q: 'What should I do in an emergency while traveling in Fayum?', a: 'Open the Voyago chat and ask Emma for emergency help. She provides instant safety instructions and essential contact numbers.', open: false },
        { q: 'Does Voyago provide 24/7 emergency support?', a: 'Yes. Emma, our AI assistant, is available 24/7 to provide emergency guidance, safety tips, and local emergency contacts.', open: false },
      ]
    }
  ];

  toggle(category: FaqCategory, item: FaqItem) {
    item.open = !item.open;
  }

  openChat() {
    this.chatbot?.toggle();
  }

  askEmma(question: string, event: Event) {
    event.stopPropagation();
    if (this.chatbot) {
      if (!this.chatbot.isOpen) this.chatbot.toggle();
      setTimeout(() => {
        this.chatbot.userInput = question;
        this.chatbot.sendMessage();
      }, 300);
    }
  }
}