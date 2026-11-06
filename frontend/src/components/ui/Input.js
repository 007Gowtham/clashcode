'use client';

export function Input({
  value,
  onChange,
  placeholder,
  label,
  type = 'text',
  disabled = false,
  required = false,
  className = '',
  ...props
}) {
  return (
    <div className="w-full space-y-1">
      {label && (
        <label className="block text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--ink)]">
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={`w-full bg-[var(--paper)] text-[var(--ink)] border border-[var(--ink-border)] rounded-[6px] px-3 py-2 text-[14px] leading-normal placeholder:text-[var(--ink)] placeholder:opacity-40 focus:outline-none focus:border-[var(--ink)] transition-hover disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
        {...props}
      />
    </div>
  );
}

export default Input;

