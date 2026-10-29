import { useState } from "react";
import { Download, FileLock2, Upload } from "lucide-react";
import { useUiCopy } from "../i18n/useUiCopy";
import { businessToday } from "../utils/dateRange";
import { Button, Input, SettingCard, SettingsField, download } from "./ui";
import { decryptSettingsSql, encryptSettingsSql, settingsFromSql } from "./sqlBackup";
import type { TenantSettings } from "./model";

export function SettingsSqlBackup({ state, exportAllowed, importAllowed, onReview }: {
  state: TenantSettings; exportAllowed: boolean; importAllowed: boolean; onReview: (backup: TenantSettings) => void;
}) {
  const { text } = useUiCopy();
  const [secret, setSecret] = useState(""), [confirm, setConfirm] = useState("");
  const [file, setFile] = useState<{ name: string; content: string } | null>(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [notice, setNotice] = useState("");
  const supported = typeof crypto !== "undefined" && !!crypto.subtle;
  return <SettingCard title={text("Encrypted SQL backup & recovery", "এনক্রিপ্ট করা SQL ব্যাকআপ ও পুনরুদ্ধার")}>
    <p className="flex items-start gap-2 text-xs text-helper"><FileLock2 className="size-4 shrink-0" aria-hidden="true" />{text("Settings snapshot: business preferences, invoice designs, roles, employees and settings activity. Sales, stock, payments and the server database are not included.", "সেটিংসের ব্যাকআপ: ব্যবসার পছন্দ, বিলের ডিজাইন, ভূমিকা, কর্মী ও কার্যক্রম। বিক্রি, স্টক, পেমেন্ট ও সার্ভারের ডেটাবেস এতে নেই।")}</p>
    <p className="text-xs text-helper">{text("Choose your own HisabIQ secret key. Keep it safely: it is never stored here and cannot be recovered. AES-256-GCM protects the SQL file; restore requires this same key.", "নিজের HisabIQ গোপন চাবি বাছুন। এটি নিরাপদে রাখুন: এখানে সংরক্ষিত হয় না এবং হারালে ফেরত পাওয়া যায় না। SQL ফাইল AES-256-GCM দিয়ে সুরক্ষিত থাকে; পুনরুদ্ধারে একই চাবি লাগবে।")}</p>
    {!supported && <p role="status" className="text-xs text-warning">{text("Encrypted backups need a secure HTTPS browser session.", "এনক্রিপ্ট করা ব্যাকআপের জন্য নিরাপদ HTTPS ব্রাউজার দরকার।")}</p>}
    <SettingsField label={text("HisabIQ secret key", "HisabIQ গোপন চাবি")} bn="">
      {id => <Input id={id} type="password" autoComplete="new-password" value={secret} minLength={12} maxLength={1024} disabled={busy || (!exportAllowed && !importAllowed)} onChange={e => setSecret(e.target.value)} placeholder={text("At least 12 characters", "কমপক্ষে ১২টি অক্ষর")} />}
    </SettingsField>
    <SettingsField label={text("Confirm secret key for download", "ডাউনলোডের জন্য চাবি আবার লিখুন")} bn="">
      {id => <Input id={id} type="password" autoComplete="new-password" value={confirm} maxLength={1024} disabled={busy || !exportAllowed} onChange={e => setConfirm(e.target.value)} />}
    </SettingsField>
    <Button variant="outline" disabled={!exportAllowed || !supported || busy || secret.length < 12 || secret !== confirm} onClick={async () => {
      setBusy(true); setError(""); setNotice("");
      try {
        const encrypted = await encryptSettingsSql(state, secret);
        download(`hisabiq-settings-${state.tenantId}-${businessToday()}.sql.hiq`, encrypted);
        setSecret(""); setConfirm("");
        setNotice(text("Encrypted SQL downloaded. Keep the file and secret key separately.", "এনক্রিপ্ট করা SQL ডাউনলোড হয়েছে। ফাইল ও গোপন চাবি আলাদা জায়গায় রাখুন।"));
      } catch (e) { setError(e instanceof Error ? e.message : text("Could not create backup.", "ব্যাকআপ তৈরি হয়নি।")); }
      finally { setBusy(false); }
    }}><Download className="size-4" aria-hidden="true" />{busy ? text("Processing…", "কাজ চলছে…") : text("Download encrypted SQL", "এনক্রিপ্ট করা SQL ডাউনলোড করুন")}</Button>
    <label className="block space-y-2 text-sm font-medium">{text("Choose SQL backup to restore", "পুনরুদ্ধারের জন্য SQL ব্যাকআপ বাছুন")}
      <input type="file" accept=".sql,.hiq,.sql.hiq" disabled={!importAllowed || busy} className="block w-full text-xs text-ink-600 file:mr-3 file:rounded-md file:border file:border-input file:bg-card file:px-3 file:py-2 file:text-ink" onChange={async e => {
        const selected = e.target.files?.[0]; e.target.value = ""; setError(""); setNotice(""); setFile(null);
        if (!selected) return;
        if (selected.size > 2000000) { setError(text("Choose a SQL backup smaller than 2 MB.", "২ MB-এর ছোট SQL ব্যাকআপ বাছুন।")); return; }
        try { setFile({ name: selected.name, content: await selected.text() }); }
        catch { setError(text("Could not read the backup. Choose it again.", "ব্যাকআপ পড়া যায়নি। আবার বাছুন।")); }
      }} />
    </label>
    {file && <div className="space-y-2"><p className="break-words text-xs text-helper">{file.name}</p><Button variant="outline" disabled={!importAllowed || busy || (!file.content.startsWith("-- HisabIQ") && (!supported || secret.length < 12))} onClick={async () => {
      setBusy(true); setError("");
      try {
        const backup = file.content.startsWith("-- HisabIQ") ? settingsFromSql(file.content, state.tenantId) : await decryptSettingsSql(file.content, secret, state.tenantId);
        setSecret(""); setConfirm(""); setFile(null); onReview(backup);
      } catch (e) { setError(e instanceof Error ? e.message : text("Could not open backup.", "ব্যাকআপ খোলা যায়নি।")); }
      finally { setBusy(false); }
    }}><Upload className="size-4" aria-hidden="true" />{text("Review SQL restore", "SQL পুনরুদ্ধার পর্যালোচনা করুন")}</Button></div>}
    <p className="text-xs text-helper">{text("Only HisabIQ settings snapshots can be restored. Uploaded SQL is never executed. Current activity is preserved; backup activity is reference only. Review affected sections before confirming restore.", "শুধু HisabIQ সেটিংসের ব্যাকআপ পুনরুদ্ধার করা যায়। আপলোড করা SQL চালানো হয় না। বর্তমান কার্যক্রম অক্ষত থাকে; ব্যাকআপের কার্যক্রম শুধু তথ্যের জন্য। নিশ্চিত করার আগে পরিবর্তিত বিভাগ দেখুন।")}</p>
    {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    {notice && <p role="status" className="text-sm text-success">{notice}</p>}
  </SettingCard>;
}
