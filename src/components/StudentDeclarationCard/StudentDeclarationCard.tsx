'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { StudentDeclarationFormData } from '@/lib/api';
import styles from './StudentDeclarationCard.module.scss';

interface StudentDeclarationCardProps {
  data: StudentDeclarationFormData;
  onEdit?: (data: StudentDeclarationFormData) => void;
  onDelete?: (id: string | number) => void;
}

export default function StudentDeclarationCard({
  data,
  onEdit,
  onDelete,
}: StudentDeclarationCardProps) {
  const router = useRouter();
  const { membershipNumber, primaryMemberDetails } = data;
  const { name, address, birthDate, email, phone } = primaryMemberDetails;

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.id) {
      router.push(`/student-declaration/${data.id}`);
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.membershipBadge}>
          <span className={styles.badgeLabel}>Membership #</span>
          <span className={styles.badgeValue}>{membershipNumber}</span>
        </div>
        <div className={styles.actionButtons}>
          {data.id && (
            <button
              className={styles.viewButton}
              onClick={handleView}
              aria-label={`View ${membershipNumber}`}
              title="View PDF"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
          )}
          {onEdit && (
            <button
              className={styles.editButton}
              onClick={(e) => {
                e.stopPropagation();
                onEdit(data);
              }}
              aria-label={`Edit ${membershipNumber}`}
              title="Edit"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          )}
          {onDelete && data.id && (
            <button
              className={styles.deleteButton}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(data.id!);
              }}
              aria-label={`Delete ${membershipNumber}`}
              title="Delete"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 6h18" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Personal Information</h3>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Name</span>
              <span className={styles.infoValue}>
                {name.title} {name.firstName} {name.lastName}
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Birth Date</span>
              <span className={styles.infoValue}>{birthDate}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Email</span>
              <span className={styles.infoValue}>
                <a href={`mailto:${email}`} className={styles.emailLink}>
                  {email}
                </a>
              </span>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Address</h3>
          <div className={styles.addressBlock}>
            <div className={styles.addressLine}>{address.streetAddress}</div>
            <div className={styles.addressLine}>
              {address.city}, {address.state} {address.postalCode}
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Contact Information</h3>
          <div className={styles.phoneGrid}>
            {phone.homePhone && (
              <div className={styles.phoneItem}>
                <span className={styles.phoneLabel}>Home</span>
                <span className={styles.phoneValue}>{phone.homePhone}</span>
              </div>
            )}
            {phone.workPhone && (
              <div className={styles.phoneItem}>
                <span className={styles.phoneLabel}>Work</span>
                <span className={styles.phoneValue}>{phone.workPhone}</span>
              </div>
            )}
            {phone.mobile && (
              <div className={styles.phoneItem}>
                <span className={styles.phoneLabel}>Mobile</span>
                <span className={styles.phoneValue}>{phone.mobile}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

