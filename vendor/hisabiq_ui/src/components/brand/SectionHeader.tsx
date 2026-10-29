
type SectionHeaderProps = {
  index: string;
  title: string;
  bn?: string;
  description?: string;
};

export function SectionHeader({ index, title, bn, description }: SectionHeaderProps) {
  return (
    <div className="mb-8 grid gap-3 border-t border-ink-100 pt-6 md:grid-cols-[200px_1fr]">
      <p className="text-sm font-medium text-teal-700">{index}</p>
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-ink md:text-3xl">
          {title} {bn && <span className="font-bn ml-1 text-lg font-normal text-ink-400">{bn}</span>}
        </h2>
        {description && <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-500">{description}</p>}
      </div>
    </div>);

}