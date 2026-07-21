// Placeholder for settings sections that arrive in a later phase.
export default function ComingSection({ icon: Icon, title, phase, description }) {
  return (
    <div className="card">
      <div className="empty-state" style={{ padding: 'var(--sp-7)' }}>
        <Icon size={48} />
        <h3>{title} settings arrive in {phase}</h3>
        <p style={{ maxWidth: 440 }}>{description}</p>
      </div>
    </div>
  );
}
