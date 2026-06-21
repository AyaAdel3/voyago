import {
  Component,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  AfterViewChecked,
  ViewChild,
  ElementRef,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

interface CardItem {
  id: number;
  name: string;
  rating?: number;
  link?: string;
  item_type?: string;
}

interface Message {
  text: string;
  sender: 'bot' | 'user';
  type?: 'text' | 'card' | 'emergency' | 'fallback';
  cards?: CardItem[];
}

interface ChatResponse {
  response: string;
  intent?: string;
  action?: string;
  navigate_to?: string | null;
  language?: string;
  data?: CardItem[] | { items?: CardItem[] } | null;
}

const HISTORY_KEY = 'voyago_chat_history';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.html',
  styleUrl: './chatbot.css'
})
export class Chatbot implements OnInit, OnDestroy, AfterViewChecked {

  @ViewChild('msgContainer') private msgContainer!: ElementRef;
  @Output() openChange = new EventEmitter<boolean>();

  isOpen           = false;
  isLoading        = false;
  userInput        = '';
  sessionId        = '';
  showClearConfirm = false;

  private shouldScrollToBottom = false;
  private isUserScrollingUp    = false;
  private lastUserId           = '';

  messages: Message[] = [];

  private readonly defaultWelcome: Message = {
    sender: 'bot',
    text:   'Hello! This is Emma from Voyago Support. How can I assist you today?'
  };

 private readonly chatApiUrl = 'http://127.0.0.1:8000/chat';

  constructor(
    private http:        HttpClient,
    private router:      Router,
    private authService: AuthService
  ) {
    effect(() => {
      const user  = this.authService.currentUser();
      const newId = user?.email ?? '';

      if (newId === this.lastUserId) return;

      if (this.lastUserId) this.saveHistoryFor(this.lastUserId);

      this.lastUserId = newId;
      this.loadHistory();

      if (this.isOpen) {
        this.isUserScrollingUp    = false;
        this.shouldScrollToBottom = true;
      }
    });
  }

  // ── User avatar & name ───────────────────────────────────
  get currentUserAvatar(): string {
    return this.authService.currentUser()?.profileImage || '';
  }

  get currentUserInitial(): string {
    return this.authService.currentUser()?.firstName?.charAt(0).toUpperCase() || '';
  }

  // ────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.sessionId  = 'session_' + Math.random().toString(36).substring(2, 11);
    this.lastUserId = this.getUserId();
    this.loadHistory();
  }

  ngOnDestroy(): void {
    this.saveHistory();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom && !this.isUserScrollingUp) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  onScroll(): void {
    const el = this.msgContainer?.nativeElement;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    this.isUserScrollingUp = distanceFromBottom > 60;
  }

  toggle(): void {
    this.isOpen = !this.isOpen;
    this.openChange.emit(this.isOpen);
    if (this.isOpen) {
      this.isUserScrollingUp    = false;
      this.shouldScrollToBottom = true;
    }
  }

  close(): void {
    this.isOpen = false;
    this.openChange.emit(false);
    this.saveHistory();
  }

  sendMessage(): void {
    const text = this.userInput.trim();
    if (!text || this.isLoading) return;

    this.messages.push({ sender: 'user', text });
    this.userInput            = '';
    this.isLoading            = true;
    this.isUserScrollingUp    = false;
    this.shouldScrollToBottom = true;

    this.http
      .post<ChatResponse>(this.chatApiUrl, {
        message:    text,
        session_id: this.sessionId,
        language:   this.detectLanguage(text)
      })
      .subscribe({
        next: (res) => {
          const rawItems = Array.isArray(res.data) 
  ? res.data 
  : (res.data?.items ?? []);

          // استنتج النوع من الـ navigate_to لو الـ item_type مش موجود
          const fallbackType = this.resolveTypeFromRoute(res.navigate_to ?? '');

          // ضيف item_type لكل card لو مش موجود
          const cards: CardItem[] = rawItems.map((item: CardItem) => ({
            ...item,
            item_type: item.item_type ?? fallbackType
          }));

          this.messages.push({
            sender: 'bot',
            text:   res.response,
            type:   cards.length ? 'card' : 'text',
            cards
          });

          this.isLoading            = false;
          this.shouldScrollToBottom = true;
          this.saveHistory();
        },
        error: () => {
          this.messages.push({
            sender: 'bot',
            text:   "Sorry, I'm having trouble connecting. Please try again later.",
            type:   'fallback'
          });
          this.isLoading            = false;
          this.shouldScrollToBottom = true;
        }
      });
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') this.sendMessage();
  }

  // ── Clear History ────────────────────────────────────────
  clearHistory(): void {
    const userId = this.getUserId();
    if (userId) {
      localStorage.removeItem(`${HISTORY_KEY}_${userId}`);
    }
    this.messages             = [{ ...this.defaultWelcome }];
    this.showClearConfirm     = false;
    this.isUserScrollingUp    = false;
    this.shouldScrollToBottom = true;
  }

  navigateToCard(card: CardItem): void {
    this.close();

    const type = this.resolveType(card);
    let path   = '';

    switch (type) {
      case 'hotel':
        path = `/hotels/details/${card.id}`;
        break;
      case 'restaurant':
        path = `/restaurant/details/${card.id}`;
        break;
      case 'attraction':
        path = `/tourist-attraction/details/${card.id}`;
        break;
      case 'tour_guide':
        path = `/tour-guide?openGuide=${card.id}`;
        break;
      default:
        path = '/home';
    }

    this.router.navigateByUrl(path);
  }

  private resolveType(card: CardItem): string {
    // ١. item_type موجود مباشرة في الـ card
    if (card.item_type) return card.item_type.toLowerCase();

    // ٢. استنتاج من الـ link
    if (card.link) {
      const url = card.link.toLowerCase();
      if (url.includes('/hotels/'))       return 'hotel';
      if (url.includes('/restaurants/') || url.includes('/Restaurants/')) return 'restaurant';
      if (url.includes('/attractions/') || url.includes('/Attractions/')) return 'attraction';
      if (url.includes('/tour-guides/') || url.includes('/tour-guide'))   return 'tour_guide';
    }

    return 'unknown';
  }

  // استنتاج النوع من الـ navigate_to اللي بييجي من الـ API response
  private resolveTypeFromRoute(route: string): string {
    const r = route.toLowerCase();
    if (r.includes('restaurant'))  return 'restaurant';
    if (r.includes('hotel'))       return 'hotel';
    if (r.includes('attraction'))  return 'attraction';
    if (r.includes('tour-guide') || r.includes('tour_guide')) return 'tour_guide';
    return 'unknown';
  }

  // ── History ──────────────────────────────────────────────
  private loadHistory(): void {
    const userId = this.getUserId();

    if (!userId) {
      this.messages             = [{ ...this.defaultWelcome }];
      this.shouldScrollToBottom = true;
      return;
    }

    try {
      const key     = `${HISTORY_KEY}_${userId}`;
      const stored  = localStorage.getItem(key);
      const history = stored ? (JSON.parse(stored) as Message[]) : [];
      this.messages = history.length ? history : [{ ...this.defaultWelcome }];
    } catch {
      this.messages = [{ ...this.defaultWelcome }];
    }

    this.shouldScrollToBottom = true;
  }

  private saveHistory(): void {
    this.saveHistoryFor(this.getUserId());
  }

  private saveHistoryFor(userId: string): void {
    if (!userId) return;
    try {
      const key    = `${HISTORY_KEY}_${userId}`;
      const toSave = this.messages.slice(-100);
      localStorage.setItem(key, JSON.stringify(toSave));
    } catch {}
  }

  private getUserId(): string {
    return this.authService.currentUser()?.email ?? '';
  }

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