import { Package } from 'lucide-react';

type ProductThumbProps = {
  src?: string;
  size?: number;
};

export function ProductThumb({ src, size = 36 }: ProductThumbProps) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-ink-50 text-ink-400"
      style={{ width: size, height: size }}>
      
      {src ?
      <img src={src} alt="" className="h-full w-full object-cover" /> :

      <Package className="size-4" aria-hidden="true" />
      }
    </span>);

}
