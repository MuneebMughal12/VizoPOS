import './Segmented.css';

// Segmented control. options: [{ value, label }]. size: 'sm' | undefined.
export default function Segmented({ options, value, onChange, size }) {
  return (
    <div className={`segmented${size ? ` segmented--${size}` : ''}`}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={`segmented__btn${value === o.value ? ' is-active' : ''}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
