import { useState } from "react";
import type { Attachment } from "./types";
import { Field } from "./components";
export function AttachmentField({
  value,
  onChange,
  onReading,
}: {
  value?: Attachment;
  onChange: (v: Attachment | undefined) => void;
  onReading: (v: boolean) => void;
}) {
  const [error, setError] = useState("");
  return (
    <Field label="Attachment (PNG, JPEG or PDF, up to 1 MB)">
      <input
        type="file"
        accept="image/png,image/jpeg,application/pdf"
        onChange={(e) => {
          const f = e.target.files?.[0];
          setError("");
          if (!f) return;
          if (
            f.size > 1000000 ||
            !["image/png", "image/jpeg", "application/pdf"].includes(f.type)
          ) {
            setError("Choose a supported file no larger than 1 MB.");
            return;
          }
          onReading(true);
          const reader = new FileReader();
          reader.onload = () => {
            onChange({
              name: f.name,
              type: f.type,
              data: String(reader.result),
            });
            onReading(false);
          };
          reader.onerror = () => {
            setError("Unable to read this attachment.");
            onReading(false);
          };
          reader.readAsDataURL(f);
        }}
      />
      {value && (
        <span className="block text-xs text-ink-500">
          {value.name}{" "}
          <button
            type="button"
            className="text-primary underline"
            onClick={() => onChange(undefined)}
          >
            Remove
          </button>
        </span>
      )}
      {error && (
        <span role="alert" className="block text-xs text-danger">
          {error}
        </span>
      )}
    </Field>
  );
}
