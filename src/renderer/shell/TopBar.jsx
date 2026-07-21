import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';

function formatClock(d) {
  const date = d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const time = d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  return `${date} · ${time}`;
}

export default function TopBar() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(t);
  }, []);

  // Restaurant name flows in from Settings in Phase 1; until then the
  // product name holds this spot.
  return (
    <header className="topbar">
      <span className="topbar__name">Vizo POS</span>
      <div className="topbar__right">
        <span className="topbar__clock num">{formatClock(now)}</span>
        <button className="topbar__bell" title="Alerts">
          <Bell size={20} />
        </button>
      </div>
    </header>
  );
}
