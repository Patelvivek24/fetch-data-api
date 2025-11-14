'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import styles from './SearchableSelect.module.scss';

interface SelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  id?: string;
  label?: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  className?: string;
  disabled?: boolean;
  allowAddNew?: boolean;
  onAddNew?: (value: string) => void;
  addNewLabel?: string;
}

export default function SearchableSelect({
  id,
  label,
  options,
  value,
  onChange,
  placeholder = 'Search and select...',
  error,
  className,
  disabled = false,
  allowAddNew = false,
  onAddNew,
  addNewLabel = 'Add new',
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get selected option label
  const selectedOption = options.find((opt) => opt.value === value);
  const displayValue = selectedOption ? selectedOption.label : (value || '');

  // Filter options based on search term
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option.value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Check if search term doesn't match any option and allowAddNew is enabled
  const showAddNewOption = allowAddNew && 
    searchTerm.trim() !== '' && 
    filteredOptions.length === 0 &&
    !options.some(opt => opt.value.toLowerCase() === searchTerm.toLowerCase().trim());

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = useCallback((selectedValue: string) => {
    onChange(selectedValue);
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(-1);
    inputRef.current?.blur();
  }, [onChange]);

  const handleAddNew = useCallback(() => {
    if (onAddNew && searchTerm.trim()) {
      onAddNew(searchTerm.trim());
      onChange(searchTerm.trim());
      setIsOpen(false);
      setSearchTerm('');
      setHighlightedIndex(-1);
      inputRef.current?.blur();
    }
  }, [onAddNew, onChange, searchTerm]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          const maxIndex = showAddNewOption 
            ? filteredOptions.length 
            : filteredOptions.length - 1;
          setHighlightedIndex((prev) =>
            prev < maxIndex ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case 'Enter':
          event.preventDefault();
          if (showAddNewOption && highlightedIndex === 0) {
            handleAddNew();
          } else if (highlightedIndex >= 0) {
            const optionIndex = showAddNewOption ? highlightedIndex - 1 : highlightedIndex;
            if (filteredOptions[optionIndex]) {
              handleSelect(filteredOptions[optionIndex].value);
            }
          }
          break;
        case 'Escape':
          event.preventDefault();
          setIsOpen(false);
          setSearchTerm('');
          setHighlightedIndex(-1);
          inputRef.current?.blur();
          break;
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, highlightedIndex, filteredOptions, showAddNewOption, handleAddNew, handleSelect]);

  // Scroll highlighted option into view
  useEffect(() => {
    if (highlightedIndex >= 0 && dropdownRef.current) {
      const optionElement = dropdownRef.current.children[
        highlightedIndex
      ] as HTMLElement;
      if (optionElement) {
        optionElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    setIsOpen(true);
    setHighlightedIndex(-1);
    // Update the value directly when typing (for free text input)
    onChange(newSearchTerm);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    // If there's a value but no matching option, use the value as search term
    if (value && !selectedOption) {
      setSearchTerm(value);
    } else {
      setSearchTerm('');
    }
  };

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
    if (!isOpen) {
      inputRef.current?.focus();
    } else {
      setSearchTerm('');
    }
  };

  return (
    <div
      ref={wrapperRef}
      className={`${styles.wrapper} ${className || ''}`}
    >
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
      )}
      <div className={styles.inputWrapper}>
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={isOpen ? searchTerm : displayValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          disabled={disabled}
          className={`${styles.input} ${error ? styles.inputError : ''} ${
            disabled ? styles.inputDisabled : ''
          }`}
          autoComplete="off"
        />
        <button
          type="button"
          onClick={handleToggle}
          disabled={disabled}
          className={styles.toggleButton}
          aria-label="Toggle dropdown"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
          >
            <path
              d="M6 9L1 4h10z"
              fill="currentColor"
            />
          </svg>
        </button>
        {isOpen && (filteredOptions.length > 0 || showAddNewOption) && (
          <div ref={dropdownRef} className={styles.dropdown}>
            {showAddNewOption && (
              <div
                onClick={handleAddNew}
                className={`${styles.option} ${styles.addNewOption} ${
                  highlightedIndex === 0 ? styles.optionHighlighted : ''
                }`}
              >
                <span className={styles.addNewIcon}>+</span>
                {addNewLabel}: &quot;{searchTerm.trim()}&quot;
              </div>
            )}
            {filteredOptions.map((option, index) => {
              const adjustedIndex = showAddNewOption ? index + 1 : index;
              return (
                <div
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={`${styles.option} ${
                    option.value === value ? styles.optionSelected : ''
                  } ${adjustedIndex === highlightedIndex ? styles.optionHighlighted : ''}`}
                >
                  {option.label}
                </div>
              );
            })}
          </div>
        )}
        {isOpen && filteredOptions.length === 0 && searchTerm && !showAddNewOption && (
          <div className={styles.dropdown}>
            <div className={styles.noResults}>No results found</div>
          </div>
        )}
      </div>
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}

