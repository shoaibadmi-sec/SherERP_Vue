import { useRef, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronRight, Eye, EyeOff, LockKeyhole, Phone } from 'lucide-react';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../../components/Dialog';
import { showBanglaHelper, uiText, type UiLanguage } from '../../i18n/uiCopy';
import { AuthLayout } from './AuthLayout';

type View = 'password' | 'pin' | 'accounts';
type Info = 'google';
const languageKey = 'hisabiq-auth-language';
// These identities are explicit design fixtures, never browser enrollments or authority.
const sampleAccounts = [
  { id: 'rahim', name: 'Rahim Ahmed', initial: 'R', phone: '01••••••245' },
  { id: 'nusrat', name: 'Nusrat Jahan', initial: 'N', phone: '01••••••617' },
];
const digits = (value: string) => value.replace(/[০-৯]/g, digit => String('০১২৩৪৫৬৭৮৯'.indexOf(digit)));

export function LoginPreviewPage({ view }: { view: View }) {
  const [params] = useSearchParams();
  const account = sampleAccounts.find(item => item.id === params.get('account')) ?? sampleAccounts[0];
  // Remount the whole form when identity changes, including query-only navigation.
  return <LoginPreviewScreen key={view + ':' + account.id} view={view} account={account} />;
}

function LoginPreviewScreen({ view, account }: { view: View; account: typeof sampleAccounts[number] }) {
  const [language, setLanguage] = useState<UiLanguage>(() => {
    try {
      const saved = localStorage.getItem(languageKey);
      if (saved === 'English' || saved === 'Bangla' || saved === 'English + Bangla') return saved;
    } catch { /* Public language selection works without browser storage. */ }
    return 'English + Bangla';
  });
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [pinCursor, setPinCursor] = useState(0);
  const [visible, setVisible] = useState(false);
  const [errors, setErrors] = useState<{ phone?: string; password?: string; pin?: string }>({});
  const [notice, setNotice] = useState(false);
  const [info, setInfo] = useState<Info | null>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const pinRef = useRef<HTMLInputElement>(null);
  const text = (english: string, bangla: string) => uiText(language, english, bangla);
  const helper = showBanglaHelper(language);
  const changeLanguage = (value: UiLanguage) => {
    setLanguage(value);
    setErrors({});
    try { localStorage.setItem(languageKey, value); } catch { /* Only the preference is optional persistence. */ }
  };
  const resetFeedback = () => { setErrors({}); setNotice(false); };
  const openInfo = (value: Info) => { setPassword(''); setPin(''); setVisible(false); resetFeedback(); setInfo(value); };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    setNotice(false);
    if (view === 'pin') {
      if (!/^\d{6}$/.test(pin)) {
        setErrors({ pin: text('Enter all 6 digits of your PIN.', 'পিনের ৬টি সংখ্যা লিখুন।') });
        pinRef.current?.focus();
        return;
      }
    } else {
      const normalized = digits(phone).trim().replace(/[\s-]/g, '').replace(/^\+?880/, '0');
      const nextErrors = {
        phone: /^01[3-9]\d{8}$/.test(normalized) ? undefined : text('Enter a valid Bangladesh mobile number.', 'বাংলাদেশের সঠিক মোবাইল নম্বর লিখুন।'),
        password: password.length ? undefined : text('Enter your password.', 'আপনার পাসওয়ার্ড লিখুন।'),
      };
      setErrors(nextErrors);
      if (nextErrors.phone || nextErrors.password) {
        (nextErrors.phone ? phoneRef : passwordRef).current?.focus();
        return;
      }
      setPhone(normalized);
    }
    setErrors({});
    setPassword('');
    setPin('');
    setVisible(false);
    setNotice(true);
  };
  const dialogTitle = text('Continue with Google', 'Google দিয়ে চালিয়ে যান');

  return <AuthLayout language={language} onLanguageChange={changeLanguage}>
    <h1 id="auth-title" className="auth-title">{view === 'accounts' ? text('Choose account', 'অ্যাকাউন্ট বাছুন') : view === 'pin' ? text('Welcome back', 'আবার স্বাগতম') : text('Sign in', 'সাইন ইন')}</h1>
    {view === 'password' && <p className="auth-subtitle">{text('Welcome back.', 'আবার স্বাগতম।')} {helper && <span lang="bn" className="font-bn">আবার স্বাগতম।</span>}</p>}
    {view === 'accounts' ? <>
      <p className="auth-subtitle">{text('Select your account to continue.', 'চালিয়ে যেতে আপনার অ্যাকাউন্ট বাছুন।')}</p>
      <div className="auth-account-list">
        {sampleAccounts.map(item => <Link className="auth-account-row" key={item.id} to={'/login/pin?account=' + item.id}>
          <span aria-hidden="true" className="auth-avatar">{item.initial}</span>
          <span className="auth-account-copy"><strong>{item.name}</strong><span>{item.phone}</span></span>
          <ChevronRight className="size-4 shrink-0 text-ink-400" aria-hidden="true" />
        </Link>)}
      </div>
      <Link className="auth-secondary-link" to="/login">{text('Use another account', 'অন্য অ্যাকাউন্ট ব্যবহার করুন')}</Link>
      <p className="auth-caption">{text('Sample remembered accounts for preview.', 'প্রিভিউয়ের জন্য মনে রাখা নমুনা অ্যাকাউন্ট।')}</p>
    </> : <form noValidate onSubmit={submit} className="auth-form">
      {view === 'pin' ? <>
        <div className="auth-identity">
          <span aria-hidden="true" className="auth-avatar">{account.initial}</span>
          <span className="auth-account-copy"><strong>{account.name}</strong><span>{account.phone}</span></span>
          <Link className="auth-text-link" to="/login/accounts">{text('Switch account', 'অ্যাকাউন্ট বদলান')}</Link>
        </div>
        <div className="auth-field">
          <label htmlFor="auth-pin">{text('Enter your 6-digit PIN', 'আপনার ৬ সংখ্যার পিন দিন')}</label>
          {helper && <p lang="bn" className="auth-field-helper font-bn">আপনার ৬ সংখ্যার পিন দিন</p>}
          <div className="auth-pin-field">
            <Input ref={pinRef} id="auth-pin" name="quick-pin-preview" type="password" inputMode="numeric" autoComplete="off" maxLength={6}
              className="auth-pin-input" value={pin} aria-invalid={!!errors.pin} aria-describedby={errors.pin ? 'auth-pin-error' : undefined}
              onSelect={event => setPinCursor(Math.min(event.currentTarget.selectionStart ?? 0, 5))}
              onChange={event => { setPin(digits(event.target.value).replace(/\D/g, '').slice(0, 6)); resetFeedback(); }} />
            <div aria-hidden="true" className="auth-pin-slots">{Array.from({ length: 6 }, (_, index) => <span key={index} data-current={pinCursor === index}>{pin[index] ? '•' : ''}</span>)}</div>
          </div>
          {errors.pin && <p id="auth-pin-error" className="auth-error" role="alert">{errors.pin}</p>}
        </div>
      </> : <>
        <div className="auth-field">
          <label htmlFor="auth-phone">{text('Mobile number', 'মোবাইল নম্বর')}</label>
          <div className="auth-input-icon">
            <Phone className="auth-leading-icon" aria-hidden="true" />
            <Input ref={phoneRef} id="auth-phone" name="mobile" type="tel" inputMode="tel" autoComplete="username" placeholder="01XXXXXXXXX"
              value={phone} aria-invalid={!!errors.phone} aria-describedby={errors.phone ? 'auth-phone-error' : undefined}
              onChange={event => { setPhone(event.target.value); resetFeedback(); }} className="pl-9" />
          </div>
          {errors.phone && <p id="auth-phone-error" className="auth-error" role="alert">{errors.phone}</p>}
        </div>
        <div className="auth-field">
          <label htmlFor="auth-password">{text('Password', 'পাসওয়ার্ড')}</label>
          <div className="auth-input-icon">
            <LockKeyhole className="auth-leading-icon" aria-hidden="true" />
            <Input ref={passwordRef} id="auth-password" name="password" type={visible ? 'text' : 'password'} autoComplete="current-password"
              placeholder={text('Enter your password', 'আপনার পাসওয়ার্ড লিখুন')} value={password}
              aria-invalid={!!errors.password} aria-describedby={errors.password ? 'auth-password-error' : undefined}
              onChange={event => { setPassword(event.target.value); resetFeedback(); }} className="pl-9 pr-12" />
            <Button type="button" variant="ghost" size="icon" className="auth-password-eye"
              aria-label={visible ? text('Hide password', 'পাসওয়ার্ড লুকান') : text('Show password', 'পাসওয়ার্ড দেখুন')}
              aria-pressed={visible} onMouseDown={event => event.preventDefault()} onClick={() => setVisible(value => !value)}>
              {visible ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
            </Button>
          </div>
          {errors.password && <p id="auth-password-error" className="auth-error" role="alert">{errors.password}</p>}
        </div>
        <div className="auth-forgot"><Link className="auth-text-link" to="/recovery">{text('Forgot password?', 'পাসওয়ার্ড ভুলে গেছেন?')}</Link></div>
      </>}
      <Button type="submit" className="auth-submit w-full">{text('Sign in', 'সাইন ইন')}</Button>
      {notice && <p role="status" className="auth-notice">{text('UI preview only. No sign-in request was sent. Your credentials have not been verified.', 'এটি শুধু UI প্রিভিউ। সাইন ইনের অনুরোধ পাঠানো হয়নি। আপনার পরিচয় যাচাই করা হয়নি।')}</p>}
      {view === 'pin' ? <Link className="auth-pin-fallback auth-text-link" to="/login">{text('Use password or Google', 'পাসওয়ার্ড বা Google ব্যবহার করুন')}</Link> : <>
        <div className="auth-divider"><span>{text('or', 'অথবা')}</span></div>
        <Button type="button" variant="outline" className="auth-google w-full" onClick={() => openInfo('google')}>
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.5l6.8-6.8C35.8 2.3 30.5 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.3 13.7 17.7 9.5 24 9.5Z"/><path fill="#4285F4" d="M47 24.6c0-1.6-.1-3.2-.4-4.6H24v9.1h12.9c-.6 2.9-2.2 5.4-4.7 7.1l7.6 5.9C44.4 37.9 47 31.8 47 24.6Z"/><path fill="#FBBC05" d="M10.5 28.7a14.4 14.4 0 0 1 0-9.4l-7.9-6.1a24 24 0 0 0 0 21.6l7.9-6.1Z"/><path fill="#34A853" d="M24 48c6.5 0 12-2.1 16-5.9l-7.6-5.9c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.7-4.2-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48Z"/></svg>
          {text('Continue with Google', 'Google দিয়ে চালিয়ে যান')}
        </Button>
        <p className="auth-create">{text('New to HisabIQ?', 'HisabIQ-এ নতুন?')} <Link className="auth-text-link" to="/signup">{text('Create account', 'অ্যাকাউন্ট খুলুন')}</Link></p>
      </>}
    </form>}
    <Dialog open={info !== null} onOpenChange={open => { if (!open) setInfo(null); }}>
      <DialogContent className="max-w-sm">
        <DialogTitle>{dialogTitle}</DialogTitle>
        <DialogDescription className="mt-2">
          {text('Google sign-in is not connected in this UI preview. No Google account will be linked.', 'এই UI প্রিভিউতে Google সাইন ইন চালু নেই। কোনো Google অ্যাকাউন্ট যুক্ত হবে না.')}
        </DialogDescription>
        <Button type="button" className="mt-4 w-full" onClick={() => setInfo(null)}>{text('Back to sign in', 'সাইন ইনে ফিরুন')}</Button>
      </DialogContent>
    </Dialog>
  </AuthLayout>;
}
