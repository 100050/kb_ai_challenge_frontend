import type { ChangeEvent, InputHTMLAttributes } from 'react';

interface CurrencyInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  description?: string;
  error?: string;
  label: string;
  onChange: (value: string) => void;
  value: string;
}

export function CurrencyInput({
  description,
  error,
  id,
  label,
  onChange,
  value,
  ...inputProps
}: CurrencyInputProps) {
  const errorId = `${id}-error`;
  const descriptionId = `${id}-description`;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value.replace(/[^\d]/g, ''));
  };

  return (
    <div className="form-field">
      <div className="form-field__label-row">
        <label htmlFor={id}>{label}</label>
        {description ? (
          <span className="help-tooltip">
            <button
              aria-label={`${label} 설명`}
              className="help-tooltip__trigger"
              type="button"
            >
              ?
            </button>
            <span className="help-tooltip__content" id={descriptionId} role="tooltip">
              {description}
            </span>
          </span>
        ) : null}
      </div>
      <div className={`currency-input${error ? ' currency-input--error' : ''}`}>
        <input
          {...inputProps}
          aria-describedby={
            [description ? descriptionId : '', error ? errorId : '']
              .filter(Boolean)
              .join(' ') || undefined
          }
          aria-invalid={Boolean(error)}
          id={id}
          inputMode="numeric"
          onChange={handleChange}
          value={value}
        />
        <span>만원</span>
      </div>
      {error ? (
        <span className="form-field__error" id={errorId} role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}
