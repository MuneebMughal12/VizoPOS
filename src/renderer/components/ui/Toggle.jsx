import './Toggle.css';

// Switch bound to '1'/'0' string values (how settings are stored).
export default function Toggle({ label, checked, onChange, disabled = false, hint }) {
  return (
    <div className={`toggle-row${disabled ? ' toggle-row--disabled' : ''}`}>
      <div className="toggle-row__text">
        <span className="toggle-row__label">{label}</span>
        {hint && <span className="toggle-row__hint">{hint}</span>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={`toggle${checked ? ' toggle--on' : ''}`}
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
      >
        <span className="toggle__knob" />
      </button>
    </div>
  );
}
