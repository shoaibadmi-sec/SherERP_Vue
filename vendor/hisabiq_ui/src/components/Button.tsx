import { forwardRef, type ComponentProps } from 'react';
import { Button as DesignButton } from '../_designSystem/ds-6551b66a-cfd3-4df9-a9b1-9ead8d7fe7e9';

// Preserve the exported shadcn primitives, handlers, variants and sizes.
export * from '../_designSystem/ds-6551b66a-cfd3-4df9-a9b1-9ead8d7fe7e9';

type ButtonProps = ComponentProps<typeof DesignButton>;

/**
 * ERP-wide visual finish only. Don't change the disabled semantics or sizes
 * of icon-only controls, grouped numeric steppers or native buttons.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ className = '', size, variant, ...props }, ref) {
  return <DesignButton
    {...props}
    ref={ref}
    size={size}
    variant={variant}
    data-hisabiq-button=""
    data-hisabiq-size={size ?? 'default'}
    data-hisabiq-variant={variant ?? 'default'}
    className={`hisabiq-button ${className}`}
  />;
});
