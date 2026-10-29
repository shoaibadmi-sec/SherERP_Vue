import { useFormCopy } from '../../../hooks/useFormCopy';

/** Primary label in the chosen language, with the Bangla helper in bilingual mode. */
export function LabelText({ en, bn }: { en: string; bn: string }) {
  const { t, showHelper, isBangla } = useFormCopy();
  return (
    <>
      <span className={isBangla ? 'font-bn' : undefined}>{t(en, bn)}</span>
      {showHelper && <span className="ml-1.5 font-bn text-[12px] font-normal text-ink-500">· {bn}</span>}
    </>
  );
}
