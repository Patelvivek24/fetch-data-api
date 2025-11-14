'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/Button';
import Table, { TableColumn } from '@/components/Table';
import LoadingSpinner from '@/components/LoadingSpinner';
import Modal from '@/components/Modal';
import InputField from '@/components/InputField';
import StudentDeclarationForm from '@/components/StudentDeclarationForm';
import StudentDeclarationCard from '@/components/StudentDeclarationCard';
import { tableApi, TableDataItem, studentDeclarationApi, StudentDeclarationFormData } from '@/lib/api';
import styles from './page.module.scss';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleLogout = () => {
    logout();
  };

  // State for table data
  const [tableData, setTableData] = useState<TableDataItem[]>([]);
  const [isTableLoading, setIsTableLoading] = useState(true);
  const [tableError, setTableError] = useState<string | null>(null);

  // State for student declaration forms
  const [studentDeclarations, setStudentDeclarations] = useState<StudentDeclarationFormData[]>([]);
  const [isStudentDeclarationsLoading, setIsStudentDeclarationsLoading] = useState(true);
  const [studentDeclarationsError, setStudentDeclarationsError] = useState<string | null>(null);
  const [currentCardPage, setCurrentCardPage] = useState(1);
  const cardsPerPage = 6;

  // State for add modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  // State for edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TableDataItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    status: 'Active',
    joinDate: new Date().toISOString().split('T')[0],
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // State for student declaration edit modal
  const [isEditStudentDeclarationModalOpen, setIsEditStudentDeclarationModalOpen] = useState(false);
  const [editingStudentDeclaration, setEditingStudentDeclaration] = useState<StudentDeclarationFormData | null>(null);

  // Fetch table data from API
  useEffect(() => {
    const fetchTableData = async () => {
      try {
        setIsTableLoading(true);
        setTableError(null);
        const data = await tableApi.getTableData();
        // Add id to each item if not present (for React keys)
        const dataWithIds = data.map((item, index) => ({
          ...item,
          id: item.id || index + 1,
        }));
        setTableData(dataWithIds);
      } catch (error) {
        if (error instanceof Error) {
          setTableError(error.message || 'Failed to load table data');
        } else {
          setTableError('Failed to load table data');
        }
        setTableData([]);
      } finally {
        setIsTableLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchTableData();
    }
  }, [isAuthenticated]);

  // Fetch student declaration forms
  useEffect(() => {
    const fetchStudentDeclarations = async () => {
      try {
        setIsStudentDeclarationsLoading(true);
        setStudentDeclarationsError(null);
        const data = await studentDeclarationApi.getStudentDeclarationForms();
        setStudentDeclarations(data);
        setCurrentCardPage(1); // Reset to first page when data changes
      } catch (error) {
        if (error instanceof Error) {
          setStudentDeclarationsError(error.message || 'Failed to load student declarations');
        } else {
          setStudentDeclarationsError('Failed to load student declarations');
        }
        setStudentDeclarations([]);
      } finally {
        setIsStudentDeclarationsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchStudentDeclarations();
    }
  }, [isAuthenticated]);

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await tableApi.deleteTableItem(id);
        // Refresh table data after deletion
        const data = await tableApi.getTableData();
        const dataWithIds = data.map((item, index) => ({
          ...item,
          id: item.id || index + 1,
        }));
        setTableData(dataWithIds);
      } catch (error) {
        if (error instanceof Error) {
          alert(`Failed to delete item: ${error.message}`);
        } else {
          alert('Failed to delete item');
        }
      }
    }
  };

  const handleDeleteStudentDeclaration = async (id: string | number) => {
    const declaration = studentDeclarations.find(d => d.id === id);
    const membershipNumber = declaration?.membershipNumber || id;
    if (window.confirm(`Are you sure you want to delete the student declaration with membership number ${membershipNumber}?`)) {
      try {
        await studentDeclarationApi.deleteStudentDeclarationForm(id);
        // Refresh student declarations after deletion
        const data = await studentDeclarationApi.getStudentDeclarationForms();
        setStudentDeclarations(data);
        setCurrentCardPage(1); // Reset to first page
      } catch (error) {
        if (error instanceof Error) {
          alert(`Failed to delete student declaration: ${error.message}`);
        } else {
          alert('Failed to delete student declaration');
        }
      }
    }
  };

  const handleEditStudentDeclaration = (data: StudentDeclarationFormData) => {
    setEditingStudentDeclaration(data);
    setIsEditStudentDeclarationModalOpen(true);
  };

  const handleCloseStudentDeclarationEditModal = () => {
    setIsEditStudentDeclarationModalOpen(false);
    setEditingStudentDeclaration(null);
  };

  // Helper function to convert StudentDeclarationFormData to StudentFormData format
  const convertToFormData = (data: StudentDeclarationFormData) => {
    return {
      membershipNumber: data.membershipNumber,
      title: data.primaryMemberDetails.name.title,
      firstName: data.primaryMemberDetails.name.firstName,
      lastName: data.primaryMemberDetails.name.lastName,
      streetAddress: data.primaryMemberDetails.address.streetAddress,
      city: data.primaryMemberDetails.address.city,
      state: data.primaryMemberDetails.address.state,
      postalCode: data.primaryMemberDetails.address.postalCode,
      birthDate: data.primaryMemberDetails.birthDate,
      email: data.primaryMemberDetails.email,
      homePhone: data.primaryMemberDetails.phone.homePhone || '',
      workPhone: data.primaryMemberDetails.phone.workPhone || '',
      mobile: data.primaryMemberDetails.phone.mobile || '',
    };
  };

  // Helper function to convert StudentFormData to StudentDeclarationFormData format
  const convertFromFormData = (formData: { membershipNumber: string; title: string; firstName: string; lastName: string; streetAddress: string; city: string; state: string; postalCode: string; birthDate: string; email: string; homePhone: string; workPhone: string; mobile: string }): StudentDeclarationFormData => {
    return {
      membershipNumber: formData.membershipNumber,
      primaryMemberDetails: {
        name: {
          title: formData.title,
          firstName: formData.firstName,
          lastName: formData.lastName,
        },
        address: {
          streetAddress: formData.streetAddress,
          city: formData.city,
          state: formData.state,
          postalCode: formData.postalCode,
        },
        birthDate: formData.birthDate,
        email: formData.email,
        phone: {
          homePhone: formData.homePhone,
          workPhone: formData.workPhone,
          mobile: formData.mobile,
        },
      },
    };
  };

  const handleStudentDeclarationFormSubmit = async (formData: { membershipNumber: string; title: string; firstName: string; lastName: string; streetAddress: string; city: string; state: string; postalCode: string; birthDate: string; email: string; homePhone: string; workPhone: string; mobile: string }) => {
    try {
      const studentDeclarationData = convertFromFormData(formData);
      
      if (editingStudentDeclaration && editingStudentDeclaration.id) {
        // Update existing declaration - preserve the id
        studentDeclarationData.id = editingStudentDeclaration.id;
        await studentDeclarationApi.updateStudentDeclarationForm(
          editingStudentDeclaration.id,
          studentDeclarationData
        );
      } else {
        // Create new declaration
        await studentDeclarationApi.createStudentDeclarationForm(studentDeclarationData);
      }
      
      // Refresh student declarations
      const data = await studentDeclarationApi.getStudentDeclarationForms();
      setStudentDeclarations(data);
      setCurrentCardPage(1); // Reset to first page
      
      // Close modal
      handleCloseStudentDeclarationEditModal();
    } catch (error) {
      if (error instanceof Error) {
        alert(`Failed to ${editingStudentDeclaration ? 'update' : 'create'} student declaration: ${error.message}`);
      } else {
        alert(`Failed to ${editingStudentDeclaration ? 'update' : 'create'} student declaration`);
      }
      throw error; // Re-throw to prevent form from resetting
    }
  };

  const handleEdit = (item: TableDataItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name || '',
      email: item.email || '',
      role: item.role || '',
      status: item.status || 'Active',
      joinDate: item.joinDate || new Date().toISOString().split('T')[0],
    });
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  const handleAddClick = () => {
    setIsAddModalOpen(true);
    setFormData({
      name: '',
      email: '',
      role: '',
      status: 'Active',
      joinDate: new Date().toISOString().split('T')[0],
    });
    setFormErrors({});
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setEditingItem(null);
    setFormData({
      name: '',
      email: '',
      role: '',
      status: 'Active',
      joinDate: new Date().toISOString().split('T')[0],
    });
    setFormErrors({});
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.role.trim()) {
      errors.role = 'Role is required';
    }

    if (!formData.status) {
      errors.status = 'Status is required';
    }

    if (!formData.joinDate) {
      errors.joinDate = 'Join date is required';
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
      if (editingItem && editingItem.id) {
        // Update existing record
        await tableApi.updateTableItem(editingItem.id, {
          name: formData.name.trim(),
          email: formData.email.trim(),
          role: formData.role.trim(),
          status: formData.status,
          joinDate: formData.joinDate,
        });
      } else {
        // Create new record
        await tableApi.createTableItem({
          name: formData.name.trim(),
          email: formData.email.trim(),
          role: formData.role.trim(),
          status: formData.status,
          joinDate: formData.joinDate,
        });
      }

      // Refresh table data
      const data = await tableApi.getTableData();
      const dataWithIds = data.map((item, index) => ({
        ...item,
        id: item.id || index + 1,
      }));
      setTableData(dataWithIds);

      // Close modal and reset form
      handleCloseModal();
    } catch (error) {
      if (error instanceof Error) {
        alert(`Failed to ${editingItem ? 'update' : 'create'} record: ${error.message}`);
      } else {
        alert(`Failed to ${editingItem ? 'update' : 'create'} record`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const tableColumns: TableColumn<unknown>[] = useMemo(
    () => [
      {
        key: 'name',
        header: 'Name',
        width: '20%',
      },
      {
        key: 'email',
        header: 'Email',
        width: '25%',
      },
      {
        key: 'role',
        header: 'Role',
        width: '12%',
        render: (value: string) => (
          <span className={styles.badge}>{value}</span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        width: '12%',
        render: (value: string) => {
          const statusClass =
            value === 'Active'
              ? styles.active
              : value === 'Pending'
                ? styles.pending
                : styles.inactive;
          return (
            <span className={`${styles.statusBadge} ${statusClass}`}>
              {value}
            </span>
          );
        },
      },
      {
        key: 'joinDate',
        header: 'Join Date',
        width: '12%',
        render: (value: string) => {
          const date = new Date(value);
          return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          });
        },
      },
      {
        key: 'actions',
        header: 'Actions',
        width: '19%',
        align: 'center',
        render: (_value: unknown, row: TableDataItem) => (
          <div className={styles.actionButtons}>
            <button
              className={styles.editButton}
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(row);
              }}
              aria-label={`Edit ${row.name}`}
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
            <button
              className={styles.deleteButton}
              onClick={(e) => {
                e.stopPropagation();
                if (row.id) {
                  handleDelete(row.id);
                }
              }}
              aria-label={`Delete ${row.name}`}
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
          </div>
        ),
      },
    ],
    []
  );

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.logo}>Your App</h1>
          <div className={styles.headerActions}>
            <span className={styles.welcomeText}>Welcome, {user?.name}!</span>
            <Button onClick={handleLogout} variant="outline">
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.hero}>
          <h2 className={styles.heroTitle}>Welcome to Your Home Page</h2>
          <p className={styles.heroSubtitle}>
            You have successfully signed in. This is your home page where you can build out your application.
          </p>
        </div>

        <div className={styles.content}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>User Information</h3>
            <div className={styles.info}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Name:</span>
                <span className={styles.infoValue}>{user?.name}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Email:</span>
                <span className={styles.infoValue}>{user?.email}</span>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Quick Actions</h3>
            <p className={styles.description}>
              Your authentication is working correctly! You can now build out your home page with additional features and content.
            </p>
          </div>
        </div>

        <div className={styles.tableSection}>
          <div className={styles.card}>
            <div className={styles.tableHeader}>
              <h3 className={styles.cardTitle}>Users Table</h3>
              <Button onClick={handleAddClick} variant="primary">
                Add Record
              </Button>
            </div>
            {isTableLoading ? (
              <div className={styles.loadingContainer}>
                <LoadingSpinner size="lg" />
                <p>Loading table data...</p>
              </div>
            ) : tableError ? (
              <div className={styles.errorContainer}>
                <p className={styles.errorMessage}>{tableError}</p>
                <Button
                  onClick={() => {
                    setTableError(null);
                    setIsTableLoading(true);
                    tableApi.getTableData()
                      .then((data) => {
                        const dataWithIds = data.map((item, index) => ({
                          ...item,
                          id: item.id || index + 1,
                        }));
                        setTableData(dataWithIds);
                        setIsTableLoading(false);
                      })
                      .catch((error: unknown) => {
                        if (error instanceof Error) {
                          setTableError(error.message);
                        } else {
                          setTableError('Failed to load table data');
                        }
                        setIsTableLoading(false);
                      });
                  }}
                  variant="primary"
                >
                  Retry
                </Button>
              </div>
            ) : (
              <Table
                columns={tableColumns}
                data={tableData}
                striped={true}
                hoverable={true}
                pagination={true}
                itemsPerPage={5}
                showPageInfo={true}
              />
            )}
          </div>
        </div>

        <div className={styles.formSection}>
          <div className={styles.card}>
            <StudentDeclarationForm
              onSubmit={async (data) => {
                try {
                  const studentDeclarationData = convertFromFormData(data);
                  await studentDeclarationApi.createStudentDeclarationForm(studentDeclarationData);
                  // Refresh student declarations
                  const refreshedData = await studentDeclarationApi.getStudentDeclarationForms();
                  setStudentDeclarations(refreshedData);
                  setCurrentCardPage(1);
                } catch (error) {
                  if (error instanceof Error) {
                    alert(`Failed to create student declaration: ${error.message}`);
                  } else {
                    alert('Failed to create student declaration');
                  }
                  throw error;
                }
              }}
            />
          </div>
        </div>

        <div className={styles.studentDeclarationsSection}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Student Declarations</h3>
            {isStudentDeclarationsLoading ? (
              <div className={styles.loadingContainer}>
                <LoadingSpinner size="lg" />
                <p>Loading student declarations...</p>
              </div>
            ) : studentDeclarationsError ? (
              <div className={styles.errorContainer}>
                <p className={styles.errorMessage}>{studentDeclarationsError}</p>
                <Button
                  onClick={() => {
                    setStudentDeclarationsError(null);
                    setIsStudentDeclarationsLoading(true);
                    studentDeclarationApi.getStudentDeclarationForms()
                      .then((data) => {
                        setStudentDeclarations(data);
                        setIsStudentDeclarationsLoading(false);
                      })
                      .catch((error: unknown) => {
                        if (error instanceof Error) {
                          setStudentDeclarationsError(error.message);
                        } else {
                          setStudentDeclarationsError('Failed to load student declarations');
                        }
                        setIsStudentDeclarationsLoading(false);
                      });
                  }}
                  variant="primary"
                >
                  Retry
                </Button>
              </div>
            ) : studentDeclarations.length === 0 ? (
              <div className={styles.emptyContainer}>
                <p>No student declarations found.</p>
              </div>
            ) : (
              <>
                <div className={styles.cardsGrid}>
                  {studentDeclarations
                    .slice((currentCardPage - 1) * cardsPerPage, currentCardPage * cardsPerPage)
                    .map((declaration, index) => (
                      <StudentDeclarationCard
                        key={declaration.membershipNumber || index}
                        data={declaration}
                        onEdit={handleEditStudentDeclaration}
                        onDelete={handleDeleteStudentDeclaration}
                      />
                    ))}
                </div>
                {Math.ceil(studentDeclarations.length / cardsPerPage) > 1 && (
                  <div className={styles.pagination}>
                    <div className={styles.pageInfo}>
                      Showing {(currentCardPage - 1) * cardsPerPage + 1} to{' '}
                      {Math.min(currentCardPage * cardsPerPage, studentDeclarations.length)} of{' '}
                      {studentDeclarations.length} entries
                    </div>
                    <div className={styles.paginationControls}>
                      <button
                        className={`${styles.pageButton}${currentCardPage === 1 ? ` ${styles.disabled}` : ''}`}
                        onClick={() => setCurrentCardPage((prev) => Math.max(1, prev - 1))}
                        disabled={currentCardPage === 1}
                        aria-label="Previous page"
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
                          <path d="M15 18l-6-6 6-6" />
                        </svg>
                      </button>

                      <div className={styles.pageNumbers}>
                        {(() => {
                          const totalPages = Math.ceil(studentDeclarations.length / cardsPerPage);
                          const pages: (number | string)[] = [];
                          const maxVisible = 5;

                          if (totalPages <= maxVisible) {
                            for (let i = 1; i <= totalPages; i++) {
                              pages.push(i);
                            }
                          } else {
                            if (currentCardPage <= 3) {
                              for (let i = 1; i <= 4; i++) {
                                pages.push(i);
                              }
                              pages.push('ellipsis');
                              pages.push(totalPages);
                            } else if (currentCardPage >= totalPages - 2) {
                              pages.push(1);
                              pages.push('ellipsis');
                              for (let i = totalPages - 3; i <= totalPages; i++) {
                                pages.push(i);
                              }
                            } else {
                              pages.push(1);
                              pages.push('ellipsis');
                              for (let i = currentCardPage - 1; i <= currentCardPage + 1; i++) {
                                pages.push(i);
                              }
                              pages.push('ellipsis');
                              pages.push(totalPages);
                            }
                          }

                          return pages.map((page, index) => {
                            if (page === 'ellipsis') {
                              return (
                                <span key={`ellipsis-${index}`} className={styles.ellipsis}>
                                  ...
                                </span>
                              );
                            }
                            return (
                              <button
                                key={page}
                                className={`${styles.pageNumber}${currentCardPage === page ? ` ${styles.active}` : ''}`}
                                onClick={() => setCurrentCardPage(page as number)}
                                aria-label={`Go to page ${page}`}
                                aria-current={currentCardPage === page ? 'page' : undefined}
                              >
                                {page}
                              </button>
                            );
                          });
                        })()}
                      </div>

                      <button
                        className={`${styles.pageButton}${
                          currentCardPage >= Math.ceil(studentDeclarations.length / cardsPerPage)
                            ? ` ${styles.disabled}`
                            : ''
                        }`}
                        onClick={() =>
                          setCurrentCardPage((prev) =>
                            Math.min(Math.ceil(studentDeclarations.length / cardsPerPage), prev + 1)
                          )
                        }
                        disabled={currentCardPage >= Math.ceil(studentDeclarations.length / cardsPerPage)}
                        aria-label="Next page"
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
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      <Modal
        isOpen={isAddModalOpen}
        onClose={handleCloseModal}
        title="Add New Record"
      >
        <form onSubmit={handleSubmit} className={styles.form}>
          <InputField
            id="name"
            label="Name"
            type="text"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            error={formErrors.name}
            required
          />

          <InputField
            id="email"
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            error={formErrors.email}
            required
          />

          <div className={styles.formGroup}>
            <label htmlFor="role" className={styles.label}>
              Role <span className={styles.required}>*</span>
            </label>
            <select
              id="role"
              className={`${styles.select} ${formErrors.role ? styles.selectError : ''}`}
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value })
              }
            >
              <option value="">Select a role</option>
              <option value="Admin">Admin</option>
              <option value="User">User</option>
              <option value="Manager">Manager</option>
              <option value="Developer">Developer</option>
            </select>
            {formErrors.role && (
              <span className={styles.error}>{formErrors.role}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="status" className={styles.label}>
              Status <span className={styles.required}>*</span>
            </label>
            <select
              id="status"
              className={`${styles.select} ${formErrors.status ? styles.selectError : ''}`}
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
            >
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Inactive">Inactive</option>
            </select>
            {formErrors.status && (
              <span className={styles.error}>{formErrors.status}</span>
            )}
          </div>

          <InputField
            id="joinDate"
            label="Join Date"
            type="date"
            value={formData.joinDate}
            onChange={(e) =>
              setFormData({ ...formData, joinDate: e.target.value })
            }
            error={formErrors.joinDate}
            required
          />

          <div className={styles.formActions}>
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseModal}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Add Record
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        onClose={handleCloseModal}
        title="Edit Record"
      >
        <form onSubmit={handleSubmit} className={styles.form}>
          <InputField
            id="edit-name"
            label="Name"
            type="text"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            error={formErrors.name}
            required
          />

          <InputField
            id="edit-email"
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            error={formErrors.email}
            required
          />

          <div className={styles.formGroup}>
            <label htmlFor="edit-role" className={styles.label}>
              Role <span className={styles.required}>*</span>
            </label>
            <select
              id="edit-role"
              className={`${styles.select} ${formErrors.role ? styles.selectError : ''}`}
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value })
              }
            >
              <option value="">Select a role</option>
              <option value="Admin">Admin</option>
              <option value="User">User</option>
              <option value="Manager">Manager</option>
              <option value="Developer">Developer</option>
            </select>
            {formErrors.role && (
              <span className={styles.error}>{formErrors.role}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="edit-status" className={styles.label}>
              Status <span className={styles.required}>*</span>
            </label>
            <select
              id="edit-status"
              className={`${styles.select} ${formErrors.status ? styles.selectError : ''}`}
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
            >
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Inactive">Inactive</option>
            </select>
            {formErrors.status && (
              <span className={styles.error}>{formErrors.status}</span>
            )}
          </div>

          <InputField
            id="edit-joinDate"
            label="Join Date"
            type="date"
            value={formData.joinDate}
            onChange={(e) =>
              setFormData({ ...formData, joinDate: e.target.value })
            }
            error={formErrors.joinDate}
            required
          />

          <div className={styles.formActions}>
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseModal}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Update Record
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isEditStudentDeclarationModalOpen}
        onClose={handleCloseStudentDeclarationEditModal}
        title="Edit Student Declaration"
      >
        {editingStudentDeclaration && (
          <StudentDeclarationForm
            initialData={convertToFormData(editingStudentDeclaration)}
            onSubmit={handleStudentDeclarationFormSubmit}
          />
        )}
      </Modal>
    </div>
  );
}
