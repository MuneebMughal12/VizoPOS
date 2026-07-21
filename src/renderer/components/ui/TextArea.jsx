import './TextArea.css';

export default function TextArea({ label, id, rows = 2, ...rest }) {
  const areaId = id || (label ? `ta-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);
  return (
    <div className="field">
      {label && (
        <label className="label field__label" htmlFor={areaId}>
          {label}
        </label>
      )}
      <textarea id={areaId} className="textarea" rows={rows} {...rest} />
    </div>
  );
}
