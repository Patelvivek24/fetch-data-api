'use client';

import React from 'react';
import styles from './Select.module.scss';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

export default function Select({
  label,
  error,
  options,
  placeholder,
  className,
  ...props
}: SelectProps) {
  return (
    <div className={`${styles.wrapper} ${className || ''}`}>
      {label && (
        <label htmlFor={props.id} className={styles.label}>
          {label}
        </label>
      )}
      <select
        className={`${styles.select} ${error ? styles.selectError : ''}`}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}

