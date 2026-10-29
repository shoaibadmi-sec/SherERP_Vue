import {
  useId,
  useEffect,
  useRef,
  type ComponentType,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import * as buttons from "../components/Button";
import * as inputs from "../components/Input";
import * as switches from "../components/Switch";
import { X } from "lucide-react";
// Use the existing shadcn design-system exports; declarations are absent in the generated bundle.
const { Button: DesignButton } = buttons as unknown as {
  Button: ComponentType<
    ButtonHTMLAttributes<HTMLButtonElement> & {
      variant?: string;
      size?: string;
    }
  >;
};
export function Button({
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: string;
  size?: string;
}) {
  return <DesignButton type={type} {...props} />;
}
export const { Input } = inputs as unknown as {
  Input: ComponentType<InputHTMLAttributes<HTMLInputElement>>;
};
const { Switch: DesignSwitch } = switches as unknown as {
  Switch: ComponentType<{
    checked: boolean;
    onCheckedChange: (value: boolean) => void;
    id?: string;
    disabled?: boolean;
    "aria-label"?: string;
    "aria-describedby"?: string;
    role?: string;
    "aria-checked"?: boolean;
  }>;
};
export function Switch(props: {
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  id?: string;
  disabled?: boolean;
  "aria-label"?: string;
  "aria-describedby"?: string;
}) {
  return <DesignSwitch role="switch" aria-checked={props.checked} {...props} />;
}
export function SettingsDialog({
  title,
  description,
  open,
  onClose,
  children,
}: {
  title: string;
  description: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const titleId = useId(),
    descriptionId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      returnFocus.current = document.activeElement as HTMLElement;
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
      if (returnFocus.current?.isConnected) returnFocus.current.focus();
    }
  }, [open]);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="m-auto max-h-[85vh] w-[calc(100%_-_2rem)] max-w-xl overflow-y-auto rounded-xl border border-border bg-card p-6 text-ink shadow-pop backdrop:bg-inverse/60"
    >
      <div className="mb-5 pr-8">
        <h2 id={titleId} className="text-lg font-semibold">
          {title}
        </h2>
        <p id={descriptionId} className="mt-2 text-sm text-ink-500">
          {description}
        </p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        aria-label="Close"
        onClick={onClose}
        className="absolute right-3 top-3"
      >
        <X className="size-4" />
      </Button>
      {children}
    </dialog>
  );
}

export function SettingsField({
  label,
  bn,
  hint,
  language,
  children,
}: {
  label: string;
  bn: string;
  hint?: string;
  language?: string;
  children: (id: string, descriptionId: string) => ReactNode;
}) {
  const id = useId(),
    descriptionId = `${id}-description`;
  return (
    <div data-slot="field" className="min-w-0 space-y-1.5">
      <label
        data-slot="field-label"
        htmlFor={id}
        className="block text-[13px] font-medium text-ink"
      >
        {language === "Bangla" ? bn : label}
        {language !== "English" && (
          <span className="ml-2 font-bn text-[11px] font-normal text-helper">
            {language === "Bangla" ? label : bn}
          </span>
        )}
      </label>
      {children(id, descriptionId)}
      {hint && (
        <p
          id={descriptionId}
          data-slot="field-description"
          className="text-xs leading-relaxed text-ink-500"
        >
          {hint}
        </p>
      )}
    </div>
  );
}
export const controlClass =
  "h-9 w-full rounded-md border border-input bg-card px-3 text-sm text-ink disabled:cursor-not-allowed disabled:opacity-70";
export function SettingCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="min-w-0 overflow-hidden rounded-xl border border-border bg-card shadow-card">
      <h3 className="border-b border-border px-4 py-3 text-sm font-semibold text-ink">
        {title}
      </h3>
      <div className="space-y-5 p-4">{children}</div>
    </section>
  );
}
export function download(
  name: string,
  content: string,
  type = "application/json",
) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
