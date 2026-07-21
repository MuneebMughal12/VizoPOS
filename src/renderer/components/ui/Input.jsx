import { forwardRef } from 'react';
import './Input.css';

const Input = forwardRef(function Input({ label, error, id, ...rest }, ref) {
  const inputId = id || (label ? `in-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);
  return (
    <div className="field">
      {label && (
        <label className="label field__label" htmlFor={inputId}>
          {label}
        </label>
      )}
      <input ref={ref} id={inputId} className={`input${error ? ' input--error' : ''}`} {...rest} />
      {error && <div className="field__error">{error}</div>}
    </div>
  );
});

export default Input;
