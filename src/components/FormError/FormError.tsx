'use client';

import React from 'react';
import styles from './FormError.module.scss';

interface FormErrorProps {
  message?: string;
  className?: string;
}

export default function FormError({ message, className }: FormErrorProps) {
  if (!message) return null;

  return (
    <div className={`${styles.error} ${className || ''}`} role="alert">
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className={styles.icon}
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <span>{message}</span>
    </div>
  );
}

