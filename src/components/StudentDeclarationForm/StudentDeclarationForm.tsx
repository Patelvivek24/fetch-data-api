'use client';

import React, { useState, useEffect } from 'react';
import InputField from '@/components/InputField';
import Select from '@/components/Select';
import SearchableSelect from '@/components/SearchableSelect';
import Button from '@/components/Button';
import { studentDeclarationApi } from '@/lib/api';
import styles from './StudentDeclarationForm.module.scss';

export interface StudentFormData {
  membershipNumber: string;
  title: string;
  firstName: string;
  lastName: string;
  streetAddress: string;
  city: string;
  state: string;
  postalCode: string;
  birthDate: string;
  email: string;
  homePhone: string;
  workPhone: string;
  mobile: string;
}

interface StudentDeclarationFormProps {
  onSubmit?: (data: StudentFormData) => void | Promise<void>;
  initialData?: Partial<StudentFormData>;
  className?: string;
}

const titleOptions = [
  { value: '', label: 'Select Title' },
  { value: 'Mr', label: 'Mr' },
  { value: 'Mrs', label: 'Mrs' },
  { value: 'Ms', label: 'Ms' },
  { value: 'Dr', label: 'Dr' },
  { value: 'Prof', label: 'Prof' },
];

const stateOptions = [
  { value: '', label: 'Select State' },
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
];

export default function StudentDeclarationForm({
  onSubmit,
  initialData,
  className,
}: StudentDeclarationFormProps) {
  const [formData, setFormData] = useState<StudentFormData>({
    membershipNumber: initialData?.membershipNumber || '',
    title: initialData?.title || '',
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    streetAddress: initialData?.streetAddress || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
    postalCode: initialData?.postalCode || '',
    birthDate: initialData?.birthDate || '',
    email: initialData?.email || '',
    homePhone: initialData?.homePhone || '',
    workPhone: initialData?.workPhone || '',
    mobile: initialData?.mobile || '',
  });

  const [membershipNumberOptions, setMembershipNumberOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof StudentFormData, string>>>({});
  const [isNewMembershipNumber, setIsNewMembershipNumber] = useState(false);
  const [addMultipleRecords, setAddMultipleRecords] = useState(false);

  // Update form data when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData) {
      setFormData({
        membershipNumber: initialData.membershipNumber || '',
        title: initialData.title || '',
        firstName: initialData.firstName || '',
        lastName: initialData.lastName || '',
        streetAddress: initialData.streetAddress || '',
        city: initialData.city || '',
        state: initialData.state || '',
        postalCode: initialData.postalCode || '',
        birthDate: initialData.birthDate || '',
        email: initialData.email || '',
        homePhone: initialData.homePhone || '',
        workPhone: initialData.workPhone || '',
        mobile: initialData.mobile || '',
      });
      setIsNewMembershipNumber(false);
      setAddMultipleRecords(false);
    }
  }, [initialData]);

  useEffect(() => {
    const fetchMembershipNumbers = async () => {
      try {
        const numbers = await studentDeclarationApi.getMembershipNumbers();
        const options = [
          { value: '', label: 'Select Membership Number' },
          ...numbers.map((num) => ({ value: num, label: num })),
        ];
        setMembershipNumberOptions(options);
      } catch (error) {
        setMembershipNumberOptions([
          { value: '', label: 'Select Membership Number' },
        ]);
      }
    };

    fetchMembershipNumbers();
  }, []);

  // Check if current membership number is new when options change
  useEffect(() => {
    if (formData.membershipNumber) {
      const exists = membershipNumberOptions.some(
        opt => opt.value.toLowerCase() === formData.membershipNumber.toLowerCase().trim()
      );
      setIsNewMembershipNumber(!exists && formData.membershipNumber.trim() !== '');
    }
  }, [membershipNumberOptions, formData.membershipNumber]);

  const handleChange = (
    field: keyof StudentFormData,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    
    // Check if membership number is new
    if (field === 'membershipNumber') {
      const exists = membershipNumberOptions.some(
        opt => opt.value.toLowerCase() === value.toLowerCase().trim()
      );
      setIsNewMembershipNumber(!exists && value.trim() !== '');
    }
  };

  const handleAddNewMembershipNumber = (newNumber: string) => {
    // Add the new number to the options list
    const newOption = { value: newNumber, label: newNumber };
    setMembershipNumberOptions((prev) => {
      // Check if it already exists
      if (prev.some(opt => opt.value === newNumber)) {
        return prev;
      }
      return [...prev.filter(opt => opt.value !== ''), newOption];
    });
    setIsNewMembershipNumber(true);
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof StudentFormData, string>> = {};

    if (!formData.membershipNumber.trim()) {
      errors.membershipNumber = 'Membership number is required';
    }

    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.birthDate) {
      errors.birthDate = 'Birth date is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (onSubmit) {
        const result = onSubmit(formData);
        // Handle both sync and async callbacks
        if (result instanceof Promise) {
          await result;
        }
        
        // Refresh membership numbers after successful submission
        if (isNewMembershipNumber) {
          try {
            const numbers = await studentDeclarationApi.getMembershipNumbers();
            const options = [
              { value: '', label: 'Select Membership Number' },
              ...numbers.map((num) => ({ value: num, label: num })),
            ];
            setMembershipNumberOptions(options);
          } catch (error) {
            // Silently fail - membership numbers will refresh on next form load
          }
        }
      }
      // Only reset form if it's a new entry (no initialData), not when editing
      if (!initialData) {
        // If addMultipleRecords is true, keep the membership number
        const keepMembershipNumber = addMultipleRecords && formData.membershipNumber;
        
        setFormData({
          membershipNumber: keepMembershipNumber ? formData.membershipNumber : '',
          title: '',
          firstName: '',
          lastName: '',
          streetAddress: '',
          city: '',
          state: '',
          postalCode: '',
          birthDate: '',
          email: '',
          homePhone: '',
          workPhone: '',
          mobile: '',
        });
        setFormErrors({});
        setIsNewMembershipNumber(false);
        
        // If addMultipleRecords is false, reset it; otherwise keep it for next entry
        if (!addMultipleRecords) {
          setAddMultipleRecords(false);
        }
      } else {
        setIsNewMembershipNumber(false);
        setAddMultipleRecords(false);
      }
    } catch (error) {
      // Error is handled by parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      className={`${styles.form} ${className || ''}`}
      onSubmit={handleSubmit}
    >
      <h2 className={styles.title}>Student Declaration Form</h2>

      <div className={styles.membershipSection}>
        <SearchableSelect
          id="membershipNumber"
          label="Membership Number"
          options={membershipNumberOptions.filter(opt => opt.value !== '')}
          value={formData.membershipNumber}
          onChange={(value) => {
            handleChange('membershipNumber', value);
            if (formErrors.membershipNumber) {
              setFormErrors((prev) => ({ ...prev, membershipNumber: undefined }));
            }
          }}
          placeholder="Search membership number..."
          error={formErrors.membershipNumber}
          allowAddNew={true}
          onAddNew={handleAddNewMembershipNumber}
          addNewLabel="Add new membership number"
        />
        {isNewMembershipNumber && (
          <div className={styles.newMembershipNotice}>
            <span className={styles.noticeIcon}>ℹ️</span>
            <span>This is a new membership number. It will be added when you save.</span>
          </div>
        )}
        {isNewMembershipNumber && (
          <div className={styles.multipleRecordsOption}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={addMultipleRecords}
                onChange={(e) => setAddMultipleRecords(e.target.checked)}
                className={styles.checkbox}
              />
              <span>Add multiple records for this membership number</span>
            </label>
            {addMultipleRecords && (
              <p className={styles.helpText}>
                After saving, you can add another record with the same membership number.
              </p>
            )}
          </div>
        )}
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Primary Member Details</h3>

        <div className={styles.twoColumn}>
          <div className={styles.column}>
            <label className={styles.columnLabel}>Name</label>
            <Select
              id="title"
              options={titleOptions}
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
            />
            <InputField
              id="firstName"
              type="text"
              placeholder="First"
              value={formData.firstName}
              onChange={(e) => handleChange('firstName', e.target.value)}
              error={formErrors.firstName}
            />
            <InputField
              id="lastName"
              type="text"
              placeholder="Last"
              value={formData.lastName}
              onChange={(e) => handleChange('lastName', e.target.value)}
              error={formErrors.lastName}
            />
          </div>

          <div className={styles.column}>
            <label className={styles.columnLabel}>Address</label>
            <InputField
              id="streetAddress"
              type="text"
              placeholder="Street Address"
              value={formData.streetAddress}
              onChange={(e) => handleChange('streetAddress', e.target.value)}
            />
            <InputField
              id="city"
              type="text"
              placeholder="City"
              value={formData.city}
              onChange={(e) => handleChange('city', e.target.value)}
            />
            <Select
              id="state"
              options={stateOptions}
              value={formData.state}
              onChange={(e) => handleChange('state', e.target.value)}
            />
            <InputField
              id="postalCode"
              type="text"
              placeholder="Postal / Zip Code"
              value={formData.postalCode}
              onChange={(e) => handleChange('postalCode', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className={styles.contactSection}>
        <div className={styles.contactRow}>
          <InputField
            id="birthDate"
            label="Birth Date"
            type="date"
            value={formData.birthDate}
            onChange={(e) => handleChange('birthDate', e.target.value)}
            className={styles.dateInput}
            error={formErrors.birthDate}
          />
          <InputField
            id="email"
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            className={styles.emailInput}
            error={formErrors.email}
          />
        </div>

        <div className={styles.phoneRow}>
          <InputField
            id="homePhone"
            label="Home Phone"
            type="tel"
            placeholder="### ### ####"
            value={formData.homePhone}
            onChange={(e) => handleChange('homePhone', e.target.value)}
            className={styles.phoneInput}
          />
          <InputField
            id="workPhone"
            label="Work Phone"
            type="tel"
            placeholder="### ### ####"
            value={formData.workPhone}
            onChange={(e) => handleChange('workPhone', e.target.value)}
            className={styles.phoneInput}
          />
          <InputField
            id="mobile"
            label="Mobile"
            type="tel"
            placeholder="### ### ####"
            value={formData.mobile}
            onChange={(e) => handleChange('mobile', e.target.value)}
            className={styles.phoneInput}
          />
        </div>
      </div>

      <div className={styles.formActions}>
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          fullWidth={false}
        >
          Save
        </Button>
      </div>
    </form>
  );
}

