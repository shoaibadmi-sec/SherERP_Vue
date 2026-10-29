import { Button } from '../../Button';
import { useActionBarDocking } from '../../../hooks/useActionBarDocking';
import { useFormCopy } from '../../../hooks/useFormCopy';

type ActionBarProps = { isEdit: boolean; errorCount: number; onCancel: () => void };

/** The only Save/Cancel on the page. Sticky to the viewport, but flows when a keyboard or short screen needs the room. */
export function ActionBar({ isEdit, errorCount, onCancel }: ActionBarProps) {
  const { t } = useFormCopy();
  const docked = useActionBarDocking();
  return (
    <div
      data-docked={docked}
      className={
        (docked ? 'sticky bottom-0 ' : 'relative ') +
        'z-30 border-t border-border bg-card px-4 pt-3 md:rounded-b-xl md:px-6'
      }
      style={{ paddingBottom: docked ? 'max(0.75rem, env(safe-area-inset-bottom))' : '0.75rem' }}
    >
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
        <p
          aria-live="polite"
          className={
            'text-[13px] md:flex-1 ' +
            (errorCount ? 'font-medium text-danger' : 'hidden text-ink-500 md:block')
          }
        >
          {errorCount
            ? t(`${errorCount} ${errorCount === 1 ? 'thing needs' : 'things need'} fixing before saving.`, `সংরক্ষণের আগে ${errorCount}টি ঠিক করুন।`)
            : t('Only the English name and selling price are required.', 'শুধু ইংরেজি নাম ও বিক্রয় মূল্য আবশ্যক।')}
        </p>
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-2 md:flex md:shrink-0">
          <Button type="button" variant="outline" onClick={onCancel} className="h-9 whitespace-nowrap px-4 text-[14px] md:h-[var(--ctl-h)] md:px-5 md:text-sm">
            {t('Cancel', 'বাতিল')}
          </Button>
          <Button type="submit" className="h-9 whitespace-nowrap px-4 text-[14px] font-semibold md:h-[var(--ctl-h)] md:min-w-[148px] md:text-sm">
            {isEdit ? t('Save changes', 'পরিবর্তন সংরক্ষণ') : t('Save product', 'পণ্য সংরক্ষণ')}
          </Button>
        </div>
      </div>
    </div>
  );
}
