import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { AppSelect } from '../../components/AppSelect';
import { LogoLockup } from '../../components/brand/Logo';
import { uiText, type UiLanguage } from '../../i18n/uiCopy';
import './auth-preview.css';

type Props = { language: UiLanguage; onLanguageChange: (value: UiLanguage) => void; children: ReactNode };

/** Approved Brand Guide composition, shared by all three login review states. */
export function AuthLayout({ language, onLanguageChange, children }: Props) {
  const text = (english: string, bangla: string) => uiText(language, english, bangla);
  const languageControl = <AppSelect
    label={text('Language', 'ভাষা')} value={language} compact
    options={[{ value: 'English', label: 'English' }, { value: 'Bangla', label: 'বাংলা' }, { value: 'English + Bangla', label: 'English + বাংলা' }]}
    onChange={value => {
      if (value === 'English' || value === 'Bangla' || value === 'English + Bangla') onLanguageChange(value);
    }}
  />;
  return <main className="auth-preview hisabiq-app">
    <div className="auth-preview-content">
      <div className="auth-card">
        <header className="auth-brand bg-inverse text-inverse-foreground">
          <div aria-hidden="true" className="auth-ledger">
            {Array.from({ length: 16 }, (_, index) => <span key={index} />)}
            <i /><i />
          </div>
          <div className="auth-brand-top">
            <LogoLockup size={32} tone="inverse" />
            <div className="auth-language-mobile">{languageControl}</div>
          </div>
          <div className="auth-brand-copy">
            <p lang="bn" className="font-bn auth-tagline">সহজ হিসাব,<br className="auth-desktop-break" /> স্মার্ট ব্যবসা</p>
            <p className="auth-brand-description">{text('Sales, stock, dues and cash — in one calm place.', 'বিক্রি, স্টক, বাকি ও নগদ — সব এক জায়গায়।')}</p>
          </div>
        </header>
        <section className="auth-form-panel" aria-labelledby="auth-title">
          <div className="auth-language-desktop">{languageControl}</div>
          {children}
        </section>
      </div>
      <footer className="auth-preview-footer">
        <p>{text('UI preview · No real sign-in · Sample accounts', 'UI প্রিভিউ · আসল সাইন ইন নয় · নমুনা অ্যাকাউন্ট')}</p>
        <nav aria-label="Login design states">
          <NavLink to="/login" end>{text('Sign in', 'সাইন ইন')}</NavLink>
          <NavLink to="/login/pin">{text('Quick PIN', 'কুইক পিন')}</NavLink>
          <NavLink to="/login/accounts">{text('Choose account', 'অ্যাকাউন্ট বাছুন')}</NavLink>
          <NavLink to="/signup">{text('Sign up', 'নিবন্ধন')}</NavLink>
          <NavLink to="/recovery">{text('Recovery', 'পাসওয়ার্ড ফেরত')}</NavLink>
        </nav>
      </footer>
    </div>
  </main>;
}
