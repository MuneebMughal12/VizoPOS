import './Button.css';

/**
 * variant: 'primary' (gold — one per screen) | 'ghost' | 'danger'
 * size: 'md' (44px) | 'lg' (56px — SAVE & PRINT class of button)
 */
export default function Button({
  variant = 'ghost',
  size = 'md',
  fullWidth = false,
  children,
  ...rest
}) {
  const cls = [
    'btn',
    `btn--${variant}`,
    `btn--${size}`,
    fullWidth ? 'btn--full' : '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  );
}
