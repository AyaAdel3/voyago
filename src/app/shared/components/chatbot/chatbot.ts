import {
  Component,
  Output,
  EventEmitter,
  OnInit,
  AfterViewChecked,
  ViewChild,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface Message {
  text: string;
  sender: 'bot' | 'user';
  type?: 'text' | 'card' | 'emergency' | 'fallback';
  cards?: CardItem[];
}

interface CardItem {
  id: number;
  name: string;
  rating?: number;
  link?: string;
}

interface ChatResponse {
  message: string;
  type: 'text' | 'card' | 'emergency' | 'fallback';
  data?: { items?: CardItem[] };
  intent?: string;
  language?: string;
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.html',
  styleUrl: './chatbot.css'
})
export class Chatbot implements OnInit, AfterViewChecked {
  @ViewChild('msgContainer') private msgContainer!: ElementRef;
  @Output() openChange = new EventEmitter<boolean>();

  isOpen    = false;
  userInput = '';
  isLoading = false;
  sessionId = '';

  messages: Message[] = [
    {
      sender: 'bot',
      text: 'Hello! This is Emma from Voyago Support. How can I assist you today?'
    }
  ];

  // ── غيّري لو الـ FastAPI على سيرفر مختلف ──
private readonly chatApiUrl = 'https://voyago-chatbot-v2-production.up.railway.app/chat';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    // session ID فريد لكل جلسة
    this.sessionId = 'session_' + Math.random().toString(36).substring(2, 11);
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  // ── Toggle / Close ───────────────────────────────────────
  toggle(): void {
    this.isOpen = !this.isOpen;
    this.openChange.emit(this.isOpen);
  }

  close(): void {
    this.isOpen = false;
    this.openChange.emit(false);
  }

  // ── Send ─────────────────────────────────────────────────
  sendMessage(): void {
    const text = this.userInput.trim();
    if (!text || this.isLoading) return;

    this.messages.push({ sender: 'user', text });
    this.userInput = '';
    this.isLoading = true;

    this.http
      .post<ChatResponse>(this.chatApiUrl, {
        message:    text,
        session_id: this.sessionId,
        language:   this.detectLanguage(text)
      })
      .subscribe({
        next: (res) => {
          this.messages.push({
            sender: 'bot',
            text:   res.message,
            type:   res.type,
            cards:  res.data?.items ?? []
          });
          this.isLoading = false;
        },
        error: () => {
          this.messages.push({
            sender: 'bot',
            text:   "Sorry, I'm having trouble connecting. Please try again later.",
            type:   'fallback'
          });
          this.isLoading = false;
        }
      });
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') this.sendMessage();
  }

  // ── Helpers ──────────────────────────────────────────────
  private detectLanguage(text: string): string {
    return /[\u0600-\u06FF]/.test(text) ? 'ar' : 'en';
  }

  private scrollToBottom(): void {
    try {
      const el = this.msgContainer?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    } catch {}
  }
}