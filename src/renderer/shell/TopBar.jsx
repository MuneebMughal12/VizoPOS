import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

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
  const { settings } = useSettings();

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(t);
  }, []);

  const name = settings['business.name'] || 'Vizo POS';
  return (
    <header className="topbar">
      <span className="topbar__name">{name}</span>
      <div className="topbar__right">
        <span className="topbar__clock num">{formatClock(now)}</span>
        <button className="topbar__bell" title="Alerts">
          <Bell size={20} />
        </button>
      </div>
    </header>
  );
}
