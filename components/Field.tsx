// Small building blocks shared by the clinic and job forms.
import { cloneElement, isValidElement } from "react";

export function Field({ id, label, error, hint, required, children }: { id: string; label: string; error?: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className={`row ${error ? "invalid" : ""}`}>
      <label className="lab" htmlFor={id}>
        {label} {required && <span className="req" aria-hidden="true">*</span>}
      </label>
      {isValidElement<Record<string, unknown>>(children) && typeof children.type === "string"
        ? cloneElement(children, {
            "aria-describedby": [hint && `${id}-hint`, error && `${id}-err`].filter(Boolean).join(" ") || undefined,
            "aria-invalid": error ? true : undefined,
          })
        : children}
      {hint && <p className="help" id={`${id}-hint`}>{hint}</p>}
      {error && <p className="err" id={`${id}-err`} role="alert">{error}</p>}
    </div>
  );
}

// A group of radio choices (such as yes or no) that shows as buttons.
export function Choices({ name, label, error, options, value, hint, onChange }: {
  name: string;
  label: string;
  error?: string;
  options: readonly { value: string; label: string }[];
  value?: string;
  hint?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <div className={`row ${error ? "invalid" : ""}`}>
      <p className="lab" id={`lab-${name}`}>{label} <span className="req" aria-hidden="true">*</span></p>
      <div className="choices" role="radiogroup" aria-labelledby={`lab-${name}`}>
        {options.map((o) => (
          <label className="choice" key={o.value}>
            <input type="radio" name={name} value={o.value} defaultChecked={value === o.value} onChange={() => onChange?.(o.value)} />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
      {hint && <p className="help">{hint}</p>}
      {error && <p className="err" role="alert">{error}</p>}
    </div>
  );
}
