import { X } from 'lucide-react';
import './Modal.css';

export default function Modal({ open, title, onClose, maxWidth = 640, children, actions }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="modal" style={{ maxWidth }}>
        <div className="modal__head">
          <h2>{title}</h2>
          {onClose && (
            <button className="modal__close" onClick={onClose} aria-label="Close">
              <X size={20} />
            </button>
          )}
        </div>
        <div className="modal__body">{children}</div>
        {actions && <div className="modal__actions">{actions}</div>}
      </div>
    </div>
  );
}
