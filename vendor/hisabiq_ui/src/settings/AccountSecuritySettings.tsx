import { useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, KeyRound, LockKeyhole, Mail, MonitorSmartphone, Phone, Users, Clock3, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { uiText, showBanglaHelper, type UiLanguage } from '../i18n/uiCopy';
import { Button, Input, Switch, SettingCard, SettingsDialog, SettingsField } from './ui';

type SecurityAction = 'mobile' | 'gmail' | 'password' | 'devices' | null;
type Props = { language: UiLanguage };
type RowProps = { icon: typeof Phone; title: string; description: string; action: ReactNode; helper?: string };
const normalizeDigits = (value: string) => value.replace(/[০-৯]/g, ch => String('০১২৩৪৫৬৭৮৯'.indexOf(ch)));

/** Authentication V1 UI-only. No trust, PIN, account, credential or session is persisted or transmitted. */
export function AccountSecuritySettings({ language }: Props) {
  const t = (en: string, bn: string) => uiText(language, en, bn);
  const showHelper = showBanglaHelper(language);
  const [lockPreview, setLockPreview] = useState(true);
  const [pinOpen, setPinOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinVisible, setPinVisible] = useState(false);
  const [pinError, setPinError] = useState('');
  const [pinReviewed, setPinReviewed] = useState(false);
  const [activeAction, setActiveAction] = useState<SecurityAction>(null);
  const [phoneDraft, setPhoneDraft] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [reviewMessage, setReviewMessage] = useState('');
  const clearPin = () => {
    setPin(''); setConfirmPin(''); setPinError(''); setPinVisible(false); setPinOpen(false);
  };
  const openAction = (action: Exclude<SecurityAction, null>) => {
    setPhoneDraft(''); setPhoneError(''); setReviewMessage(''); setActiveAction(action);
  };
  const closeAction = () => {
    setPhoneDraft(''); setPhoneError(''); setReviewMessage(''); setActiveAction(null);
  };
  const reviewPin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(pin)) return setPinError(t('Enter exactly 6 digits.', 'ঠিক ৬টি সংখ্যা লিখুন।'));
    if (pin !== confirmPin) return setPinError(t('The PINs do not match.', 'দুটি পিন মিলছে না।'));
    // Never save a real PIN or create a trusted device without full authentication.
    clearPin();
    setPinReviewed(true);
  };
  const reviewPhone = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const digits = normalizeDigits(phoneDraft).replace(/[\s-]/g, '').replace(/^\+?880/, '0');
    if (!/^01[3-9]\d{8}$/.test(digits)) {
      setPhoneError(t('Enter a valid Bangladesh mobile number.', 'বাংলাদেশের সঠিক মোবাইল নম্বর দিন।'));
      return;
    }
    setPhoneError('');
    setReviewMessage(t('Number format checked. No account phone was changed; full reauthentication and OTP verification will be required.', 'নম্বরের ফরম্যাট ঠিক আছে। অ্যাকাউন্টের ফোন বদলায়নি; সম্পূর্ণ লগইন এবং OTP যাচাই লাগবে।'));
  };
  const actionTitles = {
    mobile: t('Change mobile number', 'মোবাইল নম্বর পরিবর্তন'),
    gmail: t('Connect or change Gmail', 'Gmail যুক্ত বা পরিবর্তন'),
    password: t('Change password', 'পাসওয়ার্ড পরিবর্তন'),
    devices: t('Manage trusted devices', 'বিশ্বস্ত ডিভাইস পরিচালনা'),
  };

  return <div className="space-y-4" data-testid="account-security-settings">
    <div role="note" className="rounded-lg border border-border bg-info-bg px-3 py-3 text-xs leading-relaxed text-info">
      <strong>{t('Authentication UI preview', 'অ্যাকাউন্ট নিরাপত্তা প্রিভিউ')}</strong>
      <span className="mt-1 block">{t('These controls show the approved workflow. No sign-in, PIN, trusted device, recovery contact or screen lock is changed until the ByabsIQ authentication service is connected.', 'এগুলো অনুমোদিত ডিজাইন প্রিভিউ। ByabsIQ অথেন্টিকেশন চালু না হওয়া পর্যন্ত লগইন, পিন, বিশ্বস্ত ডিভাইস, যোগাযোগের তথ্য বা স্ক্রিন লক বদলাবে না।')}</span>
    </div>

    <SettingCard title={t('Sign-in & account', 'লগইন ও অ্যাকাউন্ট')}>
      <SecurityRow icon={Phone} title={t('Mobile number + password', 'মোবাইল নম্বর ও পাসওয়ার্ড')}
        helper={showHelper ? 'মোবাইল নম্বর দিয়ে সাইন ইন' : undefined}
        description={t('Phone-only signup is supported. Gmail is not required.', 'শুধু ফোন নম্বর দিয়ে নিবন্ধন করা যাবে; Gmail বাধ্যতামূলক নয়।')}
        action={<Button variant="outline" size="sm" onClick={() => openAction('mobile')}>{t('Change', 'পরিবর্তন')}</Button>} />
      <SecurityRow icon={Mail} title={t('Google / Gmail', 'Google / Gmail')}
        description={t('Google sign-in will require a verified mobile number for new accounts.', 'নতুন অ্যাকাউন্টে Google সাইন ইনের সঙ্গে ফোন যাচাই প্রয়োজন।')}
        action={<Button variant="outline" size="sm" onClick={() => openAction('gmail')}>{t('Manage', 'পরিচালনা')}</Button>} />
      <SecurityRow icon={KeyRound} title={t('Password', 'পাসওয়ার্ড')}
        description={t('Changing account credentials requires full sign-in again.', 'অ্যাকাউন্টের পাসওয়ার্ড পরিবর্তনের আগে পূর্ণ লগইন লাগবে।')}
        action={<Button variant="outline" size="sm" onClick={() => openAction('password')}>{t('Change', 'পরিবর্তন')}</Button>} />
      <div className="flex flex-wrap gap-2 border-t border-border pt-3 text-xs">
        <Link className="inline-flex items-center gap-1 font-medium text-teal-700 hover:underline" to="/signup">{t('Signup screen', 'নিবন্ধন স্ক্রিন')} <ArrowRight size={13} aria-hidden="true"/></Link>
        <Link className="inline-flex items-center gap-1 font-medium text-teal-700 hover:underline" to="/recovery">{t('Recover password', 'পাসওয়ার্ড ফেরত')} <ArrowRight size={13} aria-hidden="true"/></Link>
        <Link className="inline-flex items-center gap-1 font-medium text-teal-700 hover:underline" to="/login">{t('Sign-in screen', 'লগইন স্ক্রিন')} <ArrowRight size={13} aria-hidden="true"/></Link>
      </div>
    </SettingCard>

    <SettingCard title={t('PIN & screen lock', 'পিন ও স্ক্রিন লক')}>
      <SecurityRow icon={LockKeyhole} title={t('Quick unlock with 6-digit PIN', '৬ সংখ্যার পিন দিয়ে দ্রুত খুলুন')}
        description={t('Optional after full sign-in on a trusted device. A PIN is separate for each account on this browser.', 'বিশ্বস্ত ডিভাইসে পূর্ণ লগইনের পর ঐচ্ছিক পিন। প্রতিটি অ্যাকাউন্টের আলাদা পিন থাকবে।')}
        action={<Button variant="outline" size="sm" onClick={() => { setPinReviewed(false); clearPin(); setPinOpen(true); }}>{t('Preview setup', 'পিন সেটআপ দেখুন')}</Button>} />
      {pinReviewed && <p role="status" className="flex items-center gap-2 text-xs text-success"><CheckCircle2 size={15} aria-hidden="true"/>{t('PIN setup walkthrough complete — PIN not saved or enabled.', 'পিন সেটআপ প্রিভিউ সম্পন্ন — পিন সংরক্ষণ বা চালু হয়নি।')}</p>}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-ink">{t('Auto-lock after 30 minutes', '৩০ মিনিট পর স্বয়ংক্রিয় লক')}</p>
          {showHelper && <p className="font-bn text-[11px] text-helper">কাজ না করলে স্ক্রিন লক হবে</p>}
          <p className="mt-1 text-xs leading-relaxed text-ink-500">{t('You may turn off screen locking. This switch only changes the preview shown below.', 'ইচ্ছা করলে স্ক্রিন লক বন্ধ করতে পারবেন। এখানে শুধু প্রিভিউ বদলাবে।')}</p>
        </div>
        <Switch checked={lockPreview} onCheckedChange={setLockPreview}
          aria-label={t('Preview auto-lock after 30 minutes', '৩০ মিনিট পর লকের প্রিভিউ')} />
      </div>
      <div role="status" className="flex items-center gap-2 rounded-md bg-ink-50 px-3 py-2 text-xs text-ink-600">
        <Clock3 size={15} className="shrink-0" aria-hidden="true"/>
        {lockPreview
          ? t('Preview: On · Locks after 30 minutes of inactivity.', 'প্রিভিউ: চালু · ৩০ মিনিট কাজ না করলে লক।')
          : t('Preview: Off · No automatic screen lock.', 'প্রিভিউ: বন্ধ · নিজে থেকে লক হবে না।')}
      </div>
      <Link to="/login/pin" className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 hover:underline">{t('View quick PIN login', 'কুইক পিন লগইন দেখুন')} <ArrowRight size={13} aria-hidden="true" /></Link>
    </SettingCard>

    <SettingCard title={t('Trusted devices & accounts', 'বিশ্বস্ত ডিভাইস ও অ্যাকাউন্ট')}>
      <SecurityRow icon={MonitorSmartphone} title={t('90-day trusted-device authorization', '৯০ দিনের বিশ্বস্ত ডিভাইস')}
        description={t('After full sign-in, an approved browser can offer PIN unlock even after logout or session expiry, within the 90-day window.', 'পূর্ণ লগইনের পর অনুমোদিত ব্রাউজারে ৯০ দিনের মধ্যে লগআউটের পরও পিন দিয়ে খুলতে পারবেন।')}
        action={<Button variant="outline" size="sm" onClick={() => openAction('devices')}>{t('View devices', 'ডিভাইস দেখুন')}</Button>} />
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
        <div>
          <p className="text-[13px] font-medium text-ink">{t('Multiple accounts on this browser', 'এক ব্রাউজারে একাধিক অ্যাকাউন্ট')}</p>
          <p className="mt-1 text-xs text-ink-500">{t('Choose an account only when switching is needed. Each has its own PIN and trust window.', 'প্রয়োজন হলে অ্যাকাউন্ট বাছুন। প্রতিটির আলাদা পিন ও বিশ্বস্ততার সময় থাকবে।')}</p>
        </div>
        <Link to="/login/accounts" className="inline-flex items-center gap-2 rounded-md border border-input bg-card px-3 py-2 text-xs font-medium text-ink hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-500">
          <Users className="size-4" aria-hidden="true" />{t('Account picker', 'অ্যাকাউন্ট বাছুন')}
        </Link>
      </div>
      <p className="text-xs leading-relaxed text-ink-500">{t('The trusted-device list, removal, logout of other sessions and business-switch confirmation require the backend session API. No devices are registered by this preview.', 'বিশ্বস্ত ডিভাইসের তালিকা, ডিভাইস সরানো, অন্য সেশন লগআউট ও ব্যবসা বদলের নিশ্চিতকরণ ব্যাকএন্ড যুক্ত হলে কাজ করবে। এই প্রিভিউতে কোনো ডিভাইস নিবন্ধিত হয় না।')}</p>
    </SettingCard>

    <SettingsDialog title={t('Set a 6-digit PIN (preview)', '৬ সংখ্যার পিন (প্রিভিউ)')}
      description={t('Enter a sample PIN twice to review the form. It will not be saved or enable unlock.', 'পিন সেটআপ দেখতে দুইবার নমুনা পিন দিন। এটি সেভ হবে না বা লক খুলবে না।')}
      open={pinOpen} onClose={clearPin}>
      <form onSubmit={reviewPin} className="space-y-4" data-testid="pin-setup-preview">
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" type="button" aria-label={t('Show or hide PIN', 'পিন দেখুন বা লুকান')} onClick={() => setPinVisible(x => !x)}>
            {pinVisible ? <EyeOff className="size-4"/> : <Eye className="size-4"/>}
            {pinVisible ? t('Hide PIN', 'পিন লুকান') : t('Show PIN', 'পিন দেখুন')}
          </Button>
        </div>
        <SettingsField label="New 6-digit PIN" bn="নতুন ৬ সংখ্যার পিন" language={language} hint={t('Digits only. Not stored.', 'শুধু সংখ্যা। সংরক্ষণ হবে না।')}>
          {(id, describedBy) => <Input id={id} type={pinVisible ? 'text' : 'password'} inputMode="numeric" autoComplete="off" maxLength={6} pattern="[0-9]{6}"
            value={pin} aria-describedby={describedBy} onChange={e => {setPin(normalizeDigits(e.target.value).replace(/\D/g,'').slice(0,6));setPinError('');}} />}
        </SettingsField>
        <SettingsField label="Confirm PIN" bn="পিন নিশ্চিত করুন" language={language}>
          {(id) => <Input id={id} type={pinVisible ? 'text' : 'password'} inputMode="numeric" autoComplete="off" maxLength={6} pattern="[0-9]{6}"
            value={confirmPin} onChange={e => {setConfirmPin(normalizeDigits(e.target.value).replace(/\D/g,'').slice(0,6));setPinError('');}} />}
        </SettingsField>
        {pinError && <p role="alert" className="text-xs text-danger">{pinError}</p>}
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" onClick={clearPin}>{t('Cancel', 'বাতিল')}</Button>
          <Button type="submit">{t('Complete preview', 'প্রিভিউ সম্পন্ন')}</Button>
        </div>
      </form>
    </SettingsDialog>

    <SettingsDialog open={activeAction !== null} onClose={closeAction}
      title={activeAction ? actionTitles[activeAction] : t('Account security', 'অ্যাকাউন্ট নিরাপত্তা')}
      description={t('Account-security changes require full reauthentication. The current UI preview does not connect to identity or device records.', 'নিরাপত্তা পরিবর্তনের জন্য পূর্ণ লগইন দরকার। এই প্রিভিউতে আসল অ্যাকাউন্ট বা ডিভাইসের তথ্য যুক্ত নেই।')}>
      {activeAction === 'mobile' ? <form className="space-y-4" noValidate onSubmit={reviewPhone}>
        <SettingsField label="New mobile number" bn="নতুন মোবাইল নম্বর" language={language}
          hint={t('The old and new numbers must be verified after backend integration.', 'ব্যাকএন্ড চালু হলে পুরোনো ও নতুন নম্বর যাচাই করতে হবে।')}>
          {(id, describedBy) => <Input id={id} type="tel" inputMode="tel" autoComplete="off" placeholder="01XXXXXXXXX" value={phoneDraft}
            aria-invalid={!!phoneError} aria-describedby={describedBy} onChange={e => {setPhoneDraft(e.target.value);setPhoneError('');setReviewMessage('');}} />}
        </SettingsField>
        {phoneError && <p role="alert" className="text-xs text-danger">{phoneError}</p>}
        {reviewMessage && <p role="status" className="rounded-lg bg-info-bg p-3 text-xs text-info">{reviewMessage}</p>}
        <div className="flex justify-end gap-2"><Button variant="outline" onClick={closeAction}>{t('Close', 'বন্ধ করুন')}</Button>
          <Button type="submit">{t('Review number', 'নম্বর দেখুন')}</Button></div>
      </form> : <div className="space-y-3 text-sm text-ink-600">
        {activeAction === 'gmail' && <p>{t('Google linking needs Google authorization and phone confirmation. No account is linked here.', 'Google যুক্ত করতে Google অনুমোদন ও ফোন যাচাই লাগবে। এখানে কোনো অ্যাকাউন্ট যুক্ত হবে না।')}</p>}
        {activeAction === 'password' && <p>{t('Password changes require the current authentication session and full reauthentication. The recovery screen can be reviewed separately.', 'পাসওয়ার্ড বদলাতে বর্তমান সেশন ও পূর্ণ লগইন লাগবে। আলাদা পুনরুদ্ধার প্রিভিউ দেখতে পারেন।')}</p>}
        {activeAction === 'devices' && <p>{t('Trusted devices are displayed from real session records, not from this browser demonstration. None can be removed or authorized here.', 'বিশ্বস্ত ডিভাইসের তালিকা আসল সেশন থেকে আসবে। এখানে কোনো ডিভাইস যোগ বা মুছে ফেলা যাবে না।')}</p>}
        {activeAction === 'password' && <Link className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 hover:underline" to="/recovery" onClick={closeAction}>{t('Open recovery preview', 'পুনরুদ্ধার প্রিভিউ দেখুন')} <ArrowRight size={14} /></Link>}
        {activeAction === 'gmail' && <Link className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 hover:underline" to="/login" onClick={closeAction}>{t('Open sign-in preview', 'লগইন প্রিভিউ দেখুন')} <ArrowRight size={14} /></Link>}
        <div className="flex justify-end"><Button variant="outline" onClick={closeAction}>{t('Close', 'বন্ধ করুন')}</Button></div>
      </div>}
    </SettingsDialog>
  </div>;
}

function SecurityRow({ icon: Icon, title, description, action, helper }: RowProps) {
  return <div className="flex min-w-0 flex-wrap items-start gap-3 sm:flex-nowrap">
    <Icon className="mt-0.5 size-4 shrink-0 text-teal-700" aria-hidden="true" />
    <div className="min-w-0 flex-1">
      <p className="text-[13px] font-medium text-ink">{title}</p>
      {helper && <p className="font-bn text-[11px] text-helper">{helper}</p>}
      <p className="mt-1 text-xs leading-relaxed text-ink-500">{description}</p>
    </div>
    <div className="ml-7 shrink-0 sm:ml-0">{action}</div>
  </div>;
}
