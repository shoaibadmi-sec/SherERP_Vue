import { Button } from '../../Button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../Dialog';
import { useFormCopy } from '../../../hooks/useFormCopy';

type DiscardDialogProps = { open: boolean; onKeep: () => void; onDiscard: () => void };

export function DiscardDialog({ open, onKeep, onDiscard }: DiscardDialogProps) {
  const { t } = useFormCopy();
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onKeep(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader className="pr-8 text-left">
          <DialogTitle className="text-[17px]">{t('Leave without saving?', 'সংরক্ষণ না করে চলে যাবেন?')}</DialogTitle>
          <DialogDescription>{t('What you typed on this form will be lost.', 'এই ফর্মে যা লিখেছেন তা মুছে যাবে।')}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" autoFocus data-autofocus onClick={onKeep} className="h-9">{t('Keep editing', 'সম্পাদনা চালিয়ে যান')}</Button>
          <Button variant="destructive" onClick={onDiscard} className="h-9">{t('Discard', 'বাদ দিন')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
