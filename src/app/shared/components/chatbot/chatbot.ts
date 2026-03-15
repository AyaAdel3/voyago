import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Message {
  text: string;
  sender: 'bot' | 'user';
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.html',
  styleUrl: './chatbot.css'
})
export class Chatbot {
  isOpen = false;
  userInput = '';
  messages: Message[] = [
    { sender: 'bot', text: 'Hello! This is Emma from Voyago Support. How can I assist you today?' }
  ];

  @Output() openChange = new EventEmitter<boolean>();

  toggle() {
    this.isOpen = !this.isOpen;
    this.openChange.emit(this.isOpen);
  }

  close() {
    this.isOpen = false;
    this.openChange.emit(false);
  }

  sendMessage() {
    const text = this.userInput.trim();
    if (!text) return;
    this.messages.push({ sender: 'user', text });
    this.userInput = '';
    setTimeout(() => {
      this.messages.push({ sender: 'bot', text: this.getResponse(text) });
    }, 500);
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter') this.sendMessage();
  }

  private getResponse(input: string): string {
    const msg = input.toLowerCase();

    if (msg.includes('ambulance') || msg.includes('اسعاف'))
      return '🚨 Ambulance: 123\nCall immediately and stay calm. Keep the patient still and breathing.';
    if (msg.includes('police') || msg.includes('شرطة'))
      return '🚨 Police: 122\nStay safe and move to a secure location if possible.';
    if (msg.includes('fire') || msg.includes('حريق'))
      return '🚨 Fire Department: 180\nEvacuate immediately. Do not use elevators.';
    if (msg.includes('hospital') || msg.includes('مستشفى'))
      return '🏥 Fayoum General Hospital: 084-6342000\nAl-Salam Hospital: 084-6330000';
    if (msg.includes('pharmacy') || msg.includes('صيدلية'))
      return '💊 24/7 Pharmacies: Al-Ezaby & Seif Pharmacy\nCall 16229 for nearest pharmacy.';
    if (msg.includes('emergency') || msg.includes('طوارئ'))
      return '🆘 Emergency Numbers:\n• Ambulance: 123\n• Police: 122\n• Fire: 180\n• Tourist Police: 126';
    if (msg.includes('hotel') || msg.includes('فندق'))
      return 'To book a hotel:\n1. Go to Hotels page\n2. Choose a hotel & click "Show hotel"\n3. Select check-in/check-out dates\n4. Choose room type & features\n5. Click "Book Now"';
    if (msg.includes('restaurant') || msg.includes('مطعم'))
      return 'To reserve a restaurant:\n1. Go to Restaurants page\n2. Click on a restaurant\n3. Click "Book Table"\n4. Enter date, time & guests\n5. Confirm reservation';
    if (msg.includes('tour guide') || msg.includes('guide') || msg.includes('مرشد'))
      return 'To book a tour guide:\n1. Go to Tour Guide page\n2. Click "Show more" on a guide\n3. Select date & number of days\n4. Choose payment method\n5. Click "Book Now"';
    if (msg.includes('attraction') || msg.includes('معلم'))
      return 'Explore attractions from the Attractions page. Click any attraction to see details, images & ticket price.';
    if (msg.includes('budget') || msg.includes('ميزانية') || msg.includes('plan'))
      return 'To use Budget Planning:\n1. Go to Budget Planning page\n2. Enter budget & number of days\n3. Click "Generate Plan"\n4. Select hotels, restaurants & attractions\n5. Save your plan';
    if (msg.includes('favorite') || msg.includes('save') || msg.includes('مفضلة'))
      return 'Click the ❤️ icon on any card to save it. View saved items in Profile → Favorites tab.';
    if (msg.includes('payment') || msg.includes('pay') || msg.includes('دفع'))
      return 'We support:\n• 💳 Pay Online (card details)\n• 🏠 Pay on Arrival\nSelect your preferred method during booking.';
    if (msg.includes('login') || msg.includes('sign up') || msg.includes('register') || msg.includes('تسجيل'))
      return 'Click "Log in" or "Sign up" in the navbar.\nSign up requires: name, email, phone & password.';
    if (msg.includes('forgot') || msg.includes('password') || msg.includes('reset') || msg.includes('كلمة السر'))
      return 'Click "Forgot Password?" on the login page. Enter your email, receive a code, then reset your password.';
    if (msg.includes('مرحبا') || msg.includes('هلو') || msg.includes('السلام'))
      return 'أهلاً! أنا إيما من دعم Voyago. كيف أقدر أساعدك اليوم؟';
    if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey'))
      return 'Hello! 👋 How can I help you? Ask me about hotels, restaurants, tour guides, attractions, budget planning or emergencies.';
    if (msg.includes('thank') || msg.includes('شكرا'))
      return "You're welcome! 😊 Feel free to ask anything else.";

    return "Sorry, I didn't understand your question. Can you rephrase it?\nYou can ask about:\n• Hotel booking\n• Restaurant reservation\n• Tour guides\n• Tourist attractions\n• Budget planning\n• Emergency numbers";
  }
}