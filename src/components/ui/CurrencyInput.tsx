import type { ChangeEvent, InputHTMLAttributes } from 'react';

interface CurrencyInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  error?: string;
  label: string;
  onChange: (value: string) => void;
  value: string;
}

export function CurrencyInput({
  error,
  id,
  label,
  onChange,
  value,
  ...inputProps
}: CurrencyInputProps) {
  const errorId = `${id}-error`;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value.replace(/[^\d]/g, ''));
  };

  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      <div className={`currency-input${error ? ' currency-input--error' : ''}`}>
        <input
          {...inputProps}
          aria-describedby={error ? errorId : undefined}
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
