import './Input.css';

export default function Input({ label, error, id, ...rest }) {
  const inputId = id || (label ? `in-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);
  return (
    <div className="field">
      {label && (
        <label className="label field__label" htmlFor={inputId}>
          {label}
        </label>
      )}
      <input id={inputId} className={`input${error ? ' input--error' : ''}`} {...rest} />
      {error && <div className="field__error">{error}</div>}
    </div>
  );
}
