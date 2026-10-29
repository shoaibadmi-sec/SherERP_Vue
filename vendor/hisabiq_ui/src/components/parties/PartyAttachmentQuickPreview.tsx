import { ExternalLink, FileText, Paperclip } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../Dialog';
import { Button } from '../Button';
import { useUiCopy } from '../../i18n/useUiCopy';

export type AttachmentPreviewItem = {
  name: string;
  url?: string;
  reference?: string;
  date?: string;
};

function safeUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url, window.location.origin);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:' || parsed.protocol === 'blob:') return parsed.href;
    if (/^data:image\/(png|jpeg|gif|webp);base64,/i.test(url) ||
      /^data:application\/pdf;base64,/i.test(url)) return url;
  } catch { /* Invalid or unsafe URL; don't render or navigate it. */ }
  return undefined;
}

export function PartyAttachmentQuickPreview({
  attachment, onClose
}: {
  attachment: AttachmentPreviewItem | null;
  onClose: () => void;
}) {
  const { text } = useUiCopy();
  const uri = safeUrl(attachment?.url);
  const isPdf = Boolean(uri && (/\.pdf(?:[?#]|$)/i.test(uri) || uri.startsWith('data:application/pdf')));
  const isImage = Boolean(uri && !isPdf && (/\.(?:png|jpe?g|gif|webp)(?:[?#]|$)/i.test(uri)
    || uri?.startsWith('data:image/')));
  return <Dialog open={Boolean(attachment)} onOpenChange={open=>{if(!open)onClose();}}>
    <DialogContent className="max-h-[88dvh] overflow-y-auto sm:max-w-2xl"
      aria-label={text('Attachment preview', 'সংযুক্ত ফাইল প্রিভিউ')}>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2"><Paperclip className="size-4"/>
          {attachment?.name ?? text('Attachment', 'সংযুক্ত ফাইল')}
        </DialogTitle>
        <DialogDescription>{[attachment?.reference,attachment?.date].filter(Boolean).join(' · ') ||
          text('Attached transaction document','লেনদেনের সংযুক্ত নথি')}</DialogDescription>
      </DialogHeader>
      <div data-testid="party-attachment-preview" className="flex min-h-44 items-center justify-center overflow-hidden rounded-lg border border-border bg-ink-50">
        {uri && isPdf ?
          <iframe title={attachment?.name ?? text('PDF preview','পিডিএফ প্রিভিউ')}
            src={uri} className="h-[55dvh] w-full bg-white" loading="lazy" /> :
          uri && isImage ?
            <img src={uri} className="max-h-[60dvh] w-full object-contain" alt={attachment?.name ?? ''}/> :
            <div className="p-8 text-center text-sm text-ink-500">
              <FileText className="mx-auto mb-2 size-8"/>
              {text('Inline preview is not available for this file type.', 'এই ধরনের ফাইল সরাসরি দেখানো যায় না।')}
            </div>}
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>{text('Close','বন্ধ করুন')}</Button>
        {uri && <Button onClick={()=>window.open(uri,'_blank','noopener,noreferrer')}>
          <ExternalLink className="size-4"/>{text('Open file','ফাইল খুলুন')}
        </Button>}
      </div>
    </DialogContent>
  </Dialog>;
}
