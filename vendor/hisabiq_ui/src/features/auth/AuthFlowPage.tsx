import { useState, type FormEvent, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail, Phone, ShieldCheck, Smartphone } from 'lucide-react';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { AuthLayout } from './AuthLayout';
import { showBanglaHelper, uiText, type UiLanguage } from '../../i18n/uiCopy';

type Mode = 'signup' | 'recovery';
type Channel = 'gmail' | 'sms';
type Fields = { fullName: string; phone: string; password: string; confirm: string; code: string; business: string };
type Key = keyof Fields;
const languageKey = 'hisabiq-auth-language';
const empty: Fields = { fullName: '', phone: '', password: '', confirm: '', code: '', business: '' };
const digits = (value: string) => value.replace(/[০-৯]/g, digit => String('০১২৩৪৫৬৭৮৯'.indexOf(digit)));
const normalizedPhone = (phone: string) => digits(phone).trim().replace(/[\s-]/g, '').replace(/^\+?880/, '0');
const validPhone = (phone: string) => /^01[3-9]\d{8}$/.test(normalizedPhone(phone));

export function SignupPreviewPage() { return <AuthFlowPage mode="signup" />; }
export function RecoveryPreviewPage() { return <AuthFlowPage mode="recovery" />; }

/** Public onboarding UI only: no account, OTP, session or password API is called. */
function AuthFlowPage({ mode }: { mode: Mode }) {
  const [language, setLanguage] = useState<UiLanguage>(() => {
    try {
      const stored = localStorage.getItem(languageKey);
      if (stored === 'English' || stored === 'Bangla' || stored === 'English + Bangla') return stored;
    } catch { /* Public forms work without browser storage. */ }
    return 'English + Bangla';
  });
  const [step, setStep] = useState(0);
  const [fields, setFields] = useState<Fields>(empty);
  const [channel, setChannel] = useState<Channel>('gmail');
  const [errors, setErrors] = useState<Partial<Record<Key, string>>>({});
  const [visible, setVisible] = useState(false);
  const t = (en: string, bn: string) => uiText(language, en, bn);
  const helper = showBanglaHelper(language);
  const isSignup = mode === 'signup';
  const lastStep = 3;
  const setLanguagePreference = (value: UiLanguage) => {
    setLanguage(value);
    setErrors({});
    try { localStorage.setItem(languageKey, value); } catch { /* Optional public preference only. */ }
  };
  const change = (key: Key) => (event: ChangeEvent<HTMLInputElement>) => {
    const value = key === 'code' ? digits(event.target.value).replace(/\D/g, '').slice(0, 6) : event.target.value;
    setFields(current => ({ ...current, [key]: value }));
    setErrors(current => ({ ...current, [key]: undefined }));
  };
  const focus = (id: string) => (document.getElementById(id) as HTMLInputElement | null)?.focus();
  const goBack = () => {
    setErrors({});
    setVisible(false);
    setFields(current => ({ ...current, password: '', confirm: '', code: '' }));
    setStep(current => Math.max(0, current - 1));
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next: Partial<Record<Key, string>> = {};
    if (step === 0) {
      if (isSignup && !fields.fullName.trim()) next.fullName = t('Enter your name.', 'আপনার নাম লিখুন।');
      if (!validPhone(fields.phone)) next.phone = t('Enter a valid Bangladesh mobile number.', 'বাংলাদেশের সঠিক মোবাইল নম্বর লিখুন।');
      if (isSignup) {
        if (fields.password.length < 8) next.password = t('Use at least 8 characters.', 'অন্তত ৮টি অক্ষর ব্যবহার করুন।');
        if (!fields.confirm || fields.confirm !== fields.password) next.confirm = t('Passwords must match.', 'দুইটি পাসওয়ার্ড একই হতে হবে।');
      }
    } else if (step === 1) {
      if (!/^\d{6}$/.test(fields.code)) next.code = t('Enter a 6-digit code to explore the next screen.', 'পরের স্ক্রিন দেখতে ৬ সংখ্যার কোড লিখুন।');
    } else if (step === 2) {
      if (isSignup) {
        if (!fields.business.trim()) next.business = t('Enter a business name.', 'ব্যবসার নাম লিখুন।');
      } else {
        if (fields.password.length < 8) next.password = t('Use at least 8 characters.', 'অন্তত ৮টি অক্ষর ব্যবহার করুন।');
        if (!fields.confirm || fields.confirm !== fields.password) next.confirm = t('Passwords must match.', 'দুইটি পাসওয়ার্ড একই হতে হবে।');
      }
    }
    setErrors(next);
    const first = Object.keys(next)[0];
    if (first) { focus('auth-flow-' + first); return; }
    setVisible(false);
    setFields(current => ({
      ...current,
      phone: normalizedPhone(current.phone),
      password: '',
      confirm: '',
      code: '',
    }));
    setStep(current => Math.min(lastStep, current + 1));
  };
  const titles = isSignup
    ? [
      t('Create account', 'অ্যাকাউন্ট খুলুন'),
      t('Verify mobile number', 'মোবাইল নম্বর যাচাই'),
      t('Your business', 'আপনার ব্যবসা'),
      t('Preview complete', 'প্রিভিউ সম্পন্ন'),
    ]
    : [
      t('Recover password', 'পাসওয়ার্ড পুনরুদ্ধার'),
      t('Enter recovery code', 'পুনরুদ্ধার কোড দিন'),
      t('Set new password', 'নতুন পাসওয়ার্ড দিন'),
      t('Preview complete', 'প্রিভিউ সম্পন্ন'),
    ];
  const descriptions = isSignup
    ? [
      t('Start with your name and mobile number. Gmail is not required.', 'নাম ও মোবাইল নম্বর দিয়ে শুরু করুন। Gmail লাগবে না।'),
      t('Review the verification screen. This preview cannot send or verify an SMS.', 'যাচাইয়ের স্ক্রিন দেখুন। এই প্রিভিউ থেকে SMS যাবে না বা যাচাই হবে না।'),
      t('Give your shop a name. You can add more details later.', 'দোকানের নাম দিন। বাকি তথ্য পরে যোগ করা যাবে।'),
    ]
    : [
      t('Enter your registered mobile number to review recovery options.', 'পাসওয়ার্ড ফেরত পেতে আপনার মোবাইল নম্বর লিখুন।'),
      t('Gmail is the default when linked; SMS is the fallback.', 'Gmail যুক্ত থাকলে সেটি প্রথম পছন্দ; না থাকলে SMS ব্যবহার করুন।'),
      t('Choose a new password for the recovery preview.', 'পুনরুদ্ধার প্রিভিউয়ের জন্য নতুন পাসওয়ার্ড দিন।'),
    ];
  const input = (
    key: Key, label: string, type = 'text', placeholder = '',
    inputMode?: 'tel' | 'numeric' | 'text', autoComplete = 'off',
  ) => <div className="auth-field" key={key}>
    <label htmlFor={'auth-flow-' + key}>{label}</label>
    <Input
      id={'auth-flow-' + key} name={'auth-preview-' + key} type={type} placeholder={placeholder}
      value={fields[key]} inputMode={inputMode} autoComplete={autoComplete}
      aria-invalid={!!errors[key]} aria-describedby={errors[key] ? 'auth-flow-error-' + key : undefined}
      maxLength={key === 'code' ? 6 : undefined} onChange={change(key)}
    />
    {errors[key] && <p className="auth-error" id={'auth-flow-error-' + key} role="alert">{errors[key]}</p>}
  </div>;
  const passwordFields = <>
    <div className="auth-field">
      <div className="auth-field-heading">
        <label htmlFor="auth-flow-password">{t('Password', 'পাসওয়ার্ড')}</label>
        <button type="button" className="auth-text-link auth-visibility" onClick={() => setVisible(current => !current)}
          aria-pressed={visible}>{visible ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}
          {visible ? t('Hide', 'লুকান') : t('Show', 'দেখুন')}
        </button>
      </div>
      <div className="auth-input-icon">
        <LockKeyhole className="auth-leading-icon" aria-hidden="true" />
        <Input id="auth-flow-password" type={visible ? 'text' : 'password'} autoComplete="new-password"
          name="auth-preview-new-password" className="pl-9" value={fields.password} onChange={change('password')}
          placeholder={t('At least 8 characters', 'অন্তত ৮টি অক্ষর')} aria-invalid={!!errors.password}
          aria-describedby={errors.password ? 'auth-flow-error-password' : undefined} />
      </div>
      {errors.password && <p className="auth-error" id="auth-flow-error-password" role="alert">{errors.password}</p>}
    </div>
    <div className="auth-field">
      <label htmlFor="auth-flow-confirm">{t('Confirm password', 'পাসওয়ার্ড আবার লিখুন')}</label>
      <Input id="auth-flow-confirm" type={visible ? 'text' : 'password'} autoComplete="new-password"
        name="auth-preview-confirm-password" value={fields.confirm} onChange={change('confirm')}
        placeholder={t('Repeat your password', 'পাসওয়ার্ড আবার লিখুন')}
        aria-invalid={!!errors.confirm} aria-describedby={errors.confirm ? 'auth-flow-error-confirm' : undefined} />
      {errors.confirm && <p className="auth-error" id="auth-flow-error-confirm" role="alert">{errors.confirm}</p>}
    </div>
  </>;
  return <AuthLayout language={language} onLanguageChange={setLanguagePreference}>
    {step === 0 ? <Link to="/login" className="auth-flow-back"><ArrowLeft size={15} aria-hidden="true" />{t('Back to sign in', 'সাইন ইনে ফিরুন')}</Link>
      : step < lastStep ? <button type="button" className="auth-flow-back" onClick={goBack}><ArrowLeft size={15} aria-hidden="true" />{t('Back', 'পেছনে')}</button>
        : <Link to="/login" className="auth-flow-back"><ArrowLeft size={15} aria-hidden="true" />{t('Sign in', 'সাইন ইন')}</Link>}
    <div className="auth-flow-progress" role="group" aria-label={t('Step progress', 'ধাপের অগ্রগতি')}>
      {Array.from({ length: 3 }, (_, index) => <span key={index} className={index <= Math.min(step, 2) ? 'is-active' : ''} aria-hidden="true" />)}
    </div>
    <h1 id="auth-title" className="auth-title">{titles[step]}</h1>
    {step < lastStep && <p className="auth-subtitle">{descriptions[step]}</p>}
    {step === lastStep ? <section className="auth-flow-finished" aria-label={titles[step]}>
      <div className="auth-flow-finished-mark"><CheckCircle2 size={28} aria-hidden="true" /></div>
      <p className="auth-flow-finished-title">{isSignup ? t('Signup screens reviewed', 'নিবন্ধনের স্ক্রিন দেখা হয়েছে') : t('Recovery screens reviewed', 'পুনরুদ্ধারের স্ক্রিন দেখা হয়েছে')}</p>
      <p className="auth-subtitle">{isSignup
        ? t('No account or business was created. No mobile code was verified.', 'কোনো অ্যাকাউন্ট বা ব্যবসা তৈরি হয়নি। মোবাইল কোড যাচাই হয়নি।')
        : t('Your password was not changed. No Gmail or SMS code was sent or verified.', 'পাসওয়ার্ড বদলায়নি। Gmail বা SMS কোড পাঠানো বা যাচাই করা হয়নি।')}</p>
      <Link className="auth-secondary-link auth-finish-link" to="/login">{t('Return to sign in', 'সাইন ইনে ফিরুন')}</Link>
    </section> : <form className="auth-form auth-flow-form" noValidate onSubmit={submit}>
      {step === 0 && <>
        {isSignup && input('fullName', t('Your name', 'আপনার নাম'), 'text', t('Full name', 'পুরো নাম'), 'text', 'name')}
        <div className="auth-field">
          <label htmlFor="auth-flow-phone">{t('Mobile number', 'মোবাইল নম্বর')}</label>
          {helper && <p lang="bn" className="auth-field-helper font-bn">বাংলাদেশের মোবাইল নম্বর দিন</p>}
          <div className="auth-input-icon">
            <Phone className="auth-leading-icon" aria-hidden="true" />
            <Input id="auth-flow-phone" name="auth-preview-mobile" type="tel" inputMode="tel" autoComplete="tel-national"
              className="pl-9" placeholder="01XXXXXXXXX" value={fields.phone} onChange={change('phone')}
              aria-invalid={!!errors.phone} aria-describedby={errors.phone ? 'auth-flow-error-phone' : undefined} />
          </div>
          {errors.phone && <p id="auth-flow-error-phone" className="auth-error" role="alert">{errors.phone}</p>}
        </div>
        {isSignup && passwordFields}
      </>}
      {step === 1 && <>
        {!isSignup && <fieldset className="auth-channel-group">
          <legend>{t('Recovery method', 'পুনরুদ্ধারের মাধ্যম')}</legend>
          <div className="auth-channel-options">
            <label className={'auth-channel-option' + (channel === 'gmail' ? ' is-selected' : '')}>
              <input type="radio" name="auth-recovery-method" checked={channel === 'gmail'}
                onChange={() => { setChannel('gmail'); setFields(current => ({ ...current, code: '' })); setErrors({}); }} />
              <Mail size={18} aria-hidden="true" />
              <span><strong>{t('Gmail OTP', 'Gmail OTP')}</strong><small>{t('If a Gmail is linked', 'Gmail যুক্ত থাকলে')}</small></span>
            </label>
            <label className={'auth-channel-option' + (channel === 'sms' ? ' is-selected' : '')}>
              <input type="radio" name="auth-recovery-method" checked={channel === 'sms'}
                onChange={() => { setChannel('sms'); setFields(current => ({ ...current, code: '' })); setErrors({}); }} />
              <Smartphone size={18} aria-hidden="true" />
              <span><strong>{t('SMS OTP', 'SMS OTP')}</strong><small>{t('Fallback to mobile', 'মোবাইলে বিকল্প কোড')}</small></span>
            </label>
          </div>
        </fieldset>}
        <div className="auth-flow-identity">
          <ShieldCheck size={18} aria-hidden="true" />
          <span>{t('Mobile number', 'মোবাইল নম্বর')}: <strong>{fields.phone}</strong></span>
        </div>
        {input('code', t('6-digit verification code', '৬ সংখ্যার যাচাই কোড'), 'password', '••••••', 'numeric')}
        <p className="auth-flow-disclaimer" role="note">{isSignup
          ? t('Preview only — no SMS was sent. You can enter any six digits to view the next screen; this does not verify a number.', 'শুধু UI প্রিভিউ — SMS পাঠানো হয়নি। পরের স্ক্রিন দেখতে যেকোনো ৬ সংখ্যা দিন; এতে নম্বর যাচাই হবে না।')
          : t('Preview only — no Gmail or SMS was sent. You can enter any six digits to view the next screen; this does not verify identity.', 'শুধু UI প্রিভিউ — Gmail বা SMS পাঠানো হয়নি। পরের স্ক্রিন দেখতে যেকোনো ৬ সংখ্যা দিন; পরিচয় যাচাই হবে না।')}</p>
      </>}
      {step === 2 && (isSignup ? <>
        {input('business', t('Business / shop name', 'ব্যবসা / দোকানের নাম'), 'text', t('Your business name', 'দোকানের নাম'), 'text', 'organization')}
        <p className="auth-flow-disclaimer" role="note">{t('Other business details and staff can be set up after real registration is connected.', 'আসল নিবন্ধন চালু হলে পরে ব্যবসার অন্যান্য তথ্য ও কর্মী যোগ করা যাবে।')}</p>
      </> : passwordFields)}
      <Button type="submit" className="auth-submit w-full">{step === 0
        ? isSignup ? t('Continue', 'এগিয়ে যান') : t('Review recovery methods', 'পুনরুদ্ধারের মাধ্যম দেখুন')
        : step === 1 ? t('Continue preview', 'প্রিভিউ চালিয়ে যান')
          : t('Finish UI preview', 'UI প্রিভিউ শেষ করুন')}</Button>
      <p className="auth-flow-preview-note">{t('Design preview only · Nothing is sent, stored or changed in an account.', 'শুধু ডিজাইন প্রিভিউ · কোনো অ্যাকাউন্টে তথ্য পাঠানো, সংরক্ষণ বা পরিবর্তন করা হয় না।')}</p>
    </form>}
    {step === 0 && <p className="auth-create auth-flow-switch">{isSignup ? t('Already have an account?', 'আগেই অ্যাকাউন্ট আছে?') : t('Remembered your password?', 'পাসওয়ার্ড মনে পড়েছে?')} <Link className="auth-text-link" to="/login">{t('Sign in', 'সাইন ইন')}</Link></p>}
  </AuthLayout>;
}
