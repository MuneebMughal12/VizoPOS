import './Select.css';

// options: [{ value, label }]
export default function Select({ label, value, onChange, options, id }) {
  const selectId = id || (label ? `sel-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);
  return (
    <div className="field">
      {label && (
        <label className="label field__label" htmlFor={selectId}>
          {label}
        </label>
      )}
      <select
        id={selectId}
        className="select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
