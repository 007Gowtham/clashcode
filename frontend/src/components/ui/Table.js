'use client';

export function Table({ children, className = '' }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={`w-full text-left border-collapse ${className}`}>
        {children}
      </table>
    </div>
  );
}

export function TableHead({ children, className = '' }) {
  return (
    <thead>
      <tr className={`border-b border-[var(--ink-border)] ${className}`}>
        {children}
      </tr>
    </thead>
  );
}

export function TableHeaderCell({ children, align = 'left', className = '' }) {
  const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
  return (
    <th
      className={`py-3 px-4 text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--ink)] select-none ${alignClass} ${className}`}
    >
      {children}
    </th>
  );
}

export function TableBody({ children, className = '' }) {
  return <tbody className="divide-y divide-[var(--ink-border)]">{children}</tbody>;
}

export function TableRow({
  children,
  onClick,
  selected = false,
  className = '',
}) {
  const isClickable = Boolean(onClick);
  return (
    <tr
      onClick={onClick}
      className={`border-b border-[var(--ink-border)] transition-hover ${
        selected ? 'bg-[var(--ink-selected)]' : 'hover:bg-[var(--ink-hover)]'
      } ${isClickable ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </tr>
  );
}

export function TableCell({ children, align = 'left', className = '' }) {
  const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
  return (
    <td
      className={`py-3 px-4 text-[14px] text-[var(--ink)] leading-normal ${alignClass} ${className}`}
    >
      {children}
    </td>
  );
}

