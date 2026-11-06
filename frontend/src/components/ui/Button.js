'use client';

export function Button({
  variant = 'primary', // 'primary' | 'secondary' | 'danger'
  size = 'md', // 'sm' | 'md'
  disabled = false,
  onClick,
  type = 'button',
  children,
  className = '',
  ...props
}) {
  const sizeClasses = size === 'sm' ? 'px-3 py-1 text-[13px]' : 'px-4 py-2 text-[14px]';
  const base = `inline-flex items-center justify-center font-semibold leading-normal rounded-[6px] transition-hover cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed select-none border ${sizeClasses}`;

  let variantStyle = '';
  if (variant === 'primary') {
    variantStyle =
      'bg-[var(--ink)] text-[var(--paper)] border-[var(--ink)] hover:opacity-90';
  } else if (variant === 'secondary') {
    variantStyle =
      'bg-[var(--paper)] text-[var(--ink)] border-[var(--ink-border)] hover:bg-[var(--ink-hover)]';
  } else if (variant === 'danger') {
    variantStyle =
      'bg-[var(--paper)] text-[var(--ink)] border-[var(--ink)] hover:bg-[var(--ink-hover)]';
  }

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${base} ${variantStyle} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
