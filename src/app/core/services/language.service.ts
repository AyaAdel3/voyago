import { Injectable, signal } from '@angular/core';

export type Lang = 'en' | 'ar';

export const TRANSLATIONS: Record<Lang, Record<string, string>> = {
  en: {
    // Navbar
    'nav.hotels':         'Hotels',
    'nav.restaurants':    'Restaurants',
    'nav.attractions':    'Attractions',
    'nav.tourGuide':      'Tour Guide',
    'nav.budgetPlanning': 'Budget Planning',
    'nav.becomeHost':     'Become a host',
    'nav.login':          'Log in',
    'nav.signup':         'Sign up',
    'nav.search':         'search anything',

    // Register
    'register.title':        "Let's Get Started!",
    'register.firstName':    'First name',
    'register.lastName':     'Last name',
    'register.email':        'Enter your E-Mail',
    'register.phone':        'Enter phone number',
    'register.password':     'Enter password',
    'register.confirmPass':  'Re-Enter password',
    'register.btn':          'Sign up',
    'register.alreadyMember':'already a member?',
    'register.signIn':       'sign in',
    'register.orWith':       'Or Register with',
    // Register errors
    'err.firstNameRequired':  'First name is required.',
    'err.lastNameRequired':   'Last name is required.',
    'err.nameMin':           'Minimum 3 characters.',
    'err.nameMax':           'Maximum 30 characters.',
    'err.nameAlpha':         'Letters only — no numbers or symbols.',
    'err.emailRequired':     'Email is required.',
    'err.emailInvalid':      'Enter a valid email (e.g. example@gmail.com).',
    'err.emailTaken':        'This email is already registered.',
    'err.phoneRequired':     'Phone is required.',
    'err.phoneInvalid':      'Enter a valid Egyptian number (01XXXXXXXXX).',
    'err.phoneTaken':        'This phone number is already registered.',
    'err.passRequired':      'Password is required.',
    'err.passMin':           'Minimum 8 characters.',
    'err.passWeak':          'Must include uppercase, number, and special character (@#$%!&*).',
    'err.confirmRequired':   'Please confirm your password.',
    'err.passMismatch':      'Passwords do not match.',

    // Login
    'login.title':           'Welcome Back!',
    'login.identifier':      'Enter your email',
    'login.password':        'Enter password',
    'login.btn':             'Sign in',
    'login.forgotPass':      'Forgot Password?',
    'login.noAccount':       "Don't have an account?",
    'login.signUp':          'sign up',
    'login.orWith':          'Or Login with',
    'err.identifierRequired':'Email is required.',
    'err.identifierInvalid': 'Enter a valid email address.',

    // Forgot Password
    'forgot.title':          'Reset Your Password',
    'forgot.email':          'Enter your e-mail',
    'forgot.btn':            'Send mail',
    'err.emailRequired2':    'Email is required.',
    'err.emailInvalid2':     'Enter a valid email.',

    // Enter Code
    'code.title':            'Enter Your Code',
    'code.placeholder':      'Code',
    'code.btn':              'Submit',
    'code.noCode':           "Didn't Get Code?",
    'code.resend':           'resend code',
    'err.codeRequired':      'Code is required.',
    'err.codeInvalid':       'Enter a valid code.',

    // Reset Password
    'reset.title':           'Reset Your Password',
    'reset.password':        'Enter password',
    'reset.confirmPass':     'Re-Enter password',
    'reset.btn':             'Save',
    'err.passWeak2':         'Must include uppercase, number & special character.',

     // notfound
    'notFound.lost':   'Lost your way?',
    'notFound.title':  'Page Not Found',
    'notFound.sub':    "Looks like this page has gone exploring without us.\nLet's get you back on track.",
    'notFound.btn':    'Back to Home',
  },

  ar: {
    // Navbar
    'nav.hotels':         'الفنادق',
    'nav.restaurants':    'المطاعم',
    'nav.attractions':    'المعالم',
    'nav.tourGuide':      'المرشد السياحي',
    'nav.budgetPlanning': 'تخطيط الميزانية',
    'nav.becomeHost':     'كن مضيفاً',
    'nav.login':          'تسجيل الدخول',
    'nav.signup':         'إنشاء حساب',
    'nav.search':         'ابحث عن أي شيء',

    // Register
    'register.title':        'ابدأ رحلتك!',
    'register.firstName':    'الاسم الأول',
    'register.lastName':     'اسم العائلة',
    'register.email':        'أدخل البريد الإلكتروني',
    'register.phone':        'أدخل رقم الهاتف',
    'register.password':     'أدخل كلمة المرور',
    'register.confirmPass':  'أعد إدخال كلمة المرور',
    'register.btn':          'إنشاء حساب',
    'register.alreadyMember':'لديك حساب بالفعل؟',
    'register.signIn':       'سجل دخولك',
    'register.orWith':       'أو سجل باستخدام',
    // Register errors
    'err.firstNameRequired':  'الاسم الأول مطلوب.',
    'err.lastNameRequired':   'اسم العائلة مطلوب.',
    'err.nameMin':           'الحد الأدنى 3 أحرف.',
    'err.nameMax':           'الحد الأقصى 30 حرفاً.',
    'err.nameAlpha':         'أحرف فقط — بدون أرقام أو رموز.',
    'err.emailRequired':     'البريد الإلكتروني مطلوب.',
    'err.emailInvalid':      'أدخل بريداً إلكترونياً صحيحاً.',
    'err.emailTaken':        'هذا البريد الإلكتروني مسجل بالفعل.',
    'err.phoneRequired':     'رقم الهاتف مطلوب.',
    'err.phoneInvalid':      'أدخل رقماً مصرياً صحيحاً (01XXXXXXXXX).',
    'err.phoneTaken':        'رقم الهاتف هذا مسجل بالفعل.',
    'err.passRequired':      'كلمة المرور مطلوبة.',
    'err.passMin':           'الحد الأدنى 8 أحرف.',
    'err.passWeak':          'يجب أن تحتوي على حرف كبير ورقم ورمز خاص (@#$%!&*).',
    'err.confirmRequired':   'يرجى تأكيد كلمة المرور.',
    'err.passMismatch':      'كلمتا المرور غير متطابقتين.',

    // Login
    'login.title':           'مرحباً بعودتك!',
    'login.identifier':      'أدخل بريدك الإلكتروني',
    'login.password':        'أدخل كلمة المرور',
    'login.btn':             'تسجيل الدخول',
    'login.forgotPass':      'نسيت كلمة المرور؟',
    'login.noAccount':       'ليس لديك حساب؟',
    'login.signUp':          'سجل الآن',
    'login.orWith':          'أو سجل الدخول باستخدام',
    'err.identifierRequired':'البريد الإلكتروني مطلوب.',
    'err.identifierInvalid': 'أدخل بريداً إلكترونياً صحيحاً.',

    // Forgot Password
    'forgot.title':          'إعادة تعيين كلمة المرور',
    'forgot.email':          'أدخل بريدك الإلكتروني',
    'forgot.btn':            'إرسال',
    'err.emailRequired2':    'البريد الإلكتروني مطلوب.',
    'err.emailInvalid2':     'أدخل بريداً إلكترونياً صحيحاً.',

    // Enter Code
    'code.title':            'أدخل الرمز',
    'code.placeholder':      'الرمز',
    'code.btn':              'تأكيد',
    'code.noCode':           'لم تستلم الرمز؟',
    'code.resend':           'إعادة الإرسال',
    'err.codeRequired':      'الرمز مطلوب.',
    'err.codeInvalid':       'أدخل رمزاً صحيحاً.',

    // Reset Password
    'reset.title':           'تعيين كلمة مرور جديدة',
    'reset.password':        'أدخل كلمة المرور',
    'reset.confirmPass':     'أعد إدخال كلمة المرور',
    'reset.btn':             'حفظ',
    'err.passWeak2':         'يجب أن تحتوي على حرف كبير ورقم ورمز خاص.',

    // notfound
    'notFound.lost':   'ضعت في الطريق؟',
    'notFound.title':  'الصفحة غير موجودة',
    'notFound.sub':    'يبدو أن هذه الصفحة ذهبت في رحلة بدوننا.\nدعنا نعيدك إلى المسار الصحيح.',
    'notFound.btn':    'العودة للرئيسية',
  }
};

@Injectable({ providedIn: 'root' })
export class LanguageService {
  currentLang = signal<Lang>('en');

  constructor() {
    const saved = localStorage.getItem('lang') as Lang;
    if (saved === 'en' || saved === 'ar') this.setLang(saved);
  }

  setLang(lang: Lang): void {
    this.currentLang.set(lang);
    localStorage.setItem('lang', lang);
    document.documentElement.dir  = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }

  toggle(): void {
    this.setLang(this.currentLang() === 'en' ? 'ar' : 'en');
  }

  t(key: string): string {
    return TRANSLATIONS[this.currentLang()][key] ?? key;
  }
}