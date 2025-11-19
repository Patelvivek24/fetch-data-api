'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/Button';
import Header from '@/components/Header';
import Table, { TableColumn } from '@/components/Table';
import LoadingSpinner from '@/components/LoadingSpinner';
import Modal from '@/components/Modal';
import StudentDeclarationForm from '@/components/StudentDeclarationForm';
import StudentDeclarationCard from '@/components/StudentDeclarationCard';
import Pagination from '@/components/Pagination';
import { customersApi, Customer, CustomerPurchase, studentDeclarationApi, StudentDeclarationFormData, marketingStatisticsApi, MarketingStatistic } from '@/lib/api';
import InputField from '@/components/InputField';
import Select from '@/components/Select';
import styles from './page.module.scss';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // State for customer data
  const [customerData, setCustomerData] = useState<Customer[]>([]);
  const [isCustomerLoading, setIsCustomerLoading] = useState(true);
  const [customerError, setCustomerError] = useState<string | null>(null);

  // State for student declaration forms
  const [studentDeclarations, setStudentDeclarations] = useState<StudentDeclarationFormData[]>([]);
  const [isStudentDeclarationsLoading, setIsStudentDeclarationsLoading] = useState(true);
  const [studentDeclarationsError, setStudentDeclarationsError] = useState<string | null>(null);
  const [currentCardPage, setCurrentCardPage] = useState(1);
  const cardsPerPage = 6;

  // State for student declaration edit modal
  const [isEditStudentDeclarationModalOpen, setIsEditStudentDeclarationModalOpen] = useState(false);
  const [editingStudentDeclaration, setEditingStudentDeclaration] = useState<StudentDeclarationFormData | null>(null);

  // State for customer modals
  const [isViewCustomerModalOpen, setIsViewCustomerModalOpen] = useState(false);
  const [isEditCustomerModalOpen, setIsEditCustomerModalOpen] = useState(false);
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [isDeleteCustomerModalOpen, setIsDeleteCustomerModalOpen] = useState(false);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
  const [customerFormData, setCustomerFormData] = useState<Omit<Customer, 'id'>>({
    name: '',
    email: '',
    phone: '',
    address: '',
    purchases: [],
    totalSpent: 0,
    lastPurchaseDate: '',
  });
  const [customerFormErrors, setCustomerFormErrors] = useState<Record<string, string>>({});
  const [isSubmittingCustomer, setIsSubmittingCustomer] = useState(false);
  
  // State for products and purchase management
  const [products, setProducts] = useState<MarketingStatistic[]>([]);
  const [newPurchase, setNewPurchase] = useState<Omit<CustomerPurchase, 'totalAmount'>>({
    productId: '',
    productName: '',
    quantity: 1,
    purchaseDate: new Date().toISOString().split('T')[0],
  });
  const [editingPurchaseIndex, setEditingPurchaseIndex] = useState<number | null>(null);

  // Fetch customer data from API
  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        setIsCustomerLoading(true);
        setCustomerError(null);
        const data = await customersApi.getCustomers();
        setCustomerData(data);
      } catch (error) {
        if (error instanceof Error) {
          setCustomerError(error.message || 'Failed to load customer data');
        } else {
          setCustomerError('Failed to load customer data');
        }
        setCustomerData([]);
      } finally {
        setIsCustomerLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchCustomerData();
    }
  }, [isAuthenticated]);

  // Fetch products for purchase management
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await marketingStatisticsApi.getMarketingStatistics();
        setProducts(data);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      }
    };

    if (isAuthenticated) {
      fetchProducts();
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

  // Customer handlers
  const handleViewCustomer = (customer: Customer) => {
    setViewingCustomer(customer);
    setIsViewCustomerModalOpen(true);
  };

  const handleAddNewCustomer = () => {
    setEditingCustomer(null);
    setCustomerFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      purchases: [],
      totalSpent: 0,
      lastPurchaseDate: new Date().toISOString().split('T')[0],
    });
    setCustomerFormErrors({});
    setIsAddCustomerModalOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setCustomerFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      purchases: customer.purchases,
      totalSpent: customer.totalSpent,
      lastPurchaseDate: customer.lastPurchaseDate,
    });
    setCustomerFormErrors({});
    setIsEditCustomerModalOpen(true);
  };

  const handleDeleteCustomer = (customer: Customer) => {
    setDeletingCustomer(customer);
    setIsDeleteCustomerModalOpen(true);
  };

  const handleCloseViewCustomerModal = () => {
    setIsViewCustomerModalOpen(false);
    setViewingCustomer(null);
  };

  const handleCloseEditCustomerModal = () => {
    setIsEditCustomerModalOpen(false);
    setEditingCustomer(null);
    setCustomerFormErrors({});
  };

  const handleCloseAddCustomerModal = () => {
    setIsAddCustomerModalOpen(false);
    setEditingCustomer(null);
    setCustomerFormErrors({});
  };

  const handleCloseDeleteCustomerModal = () => {
    setIsDeleteCustomerModalOpen(false);
    setDeletingCustomer(null);
  };

  const handleCustomerInputChange = (field: keyof typeof customerFormData, value: string | number | CustomerPurchase[]) => {
    setCustomerFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (customerFormErrors[field]) {
      setCustomerFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateCustomerForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!customerFormData.name.trim()) {
      errors.name = 'Name is required';
    }
    if (!customerFormData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerFormData.email)) {
      errors.email = 'Invalid email format';
    }
    if (!customerFormData.phone.trim()) {
      errors.phone = 'Phone is required';
    }
    if (!customerFormData.address.trim()) {
      errors.address = 'Address is required';
    }

    setCustomerFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCustomerFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateCustomerForm()) {
      return;
    }

    try {
      setIsSubmittingCustomer(true);
      
      if (editingCustomer && editingCustomer.id) {
        // Update existing customer
        await customersApi.updateCustomer(editingCustomer.id, customerFormData);
      } else {
        // Create new customer
        await customersApi.createCustomer(customerFormData);
      }
      
      // Recalculate sold quantities from all customers
      await syncPurchasesWithProducts();
      
      // Refresh customer data and products
      const [customerData, productData] = await Promise.all([
        customersApi.getCustomers(),
        marketingStatisticsApi.getMarketingStatistics(),
      ]);
      setCustomerData(customerData);
      setProducts(productData);
      
      if (editingCustomer) {
        handleCloseEditCustomerModal();
      } else {
        handleCloseAddCustomerModal();
      }
    } catch (error) {
      if (error instanceof Error) {
        alert(`Failed to ${editingCustomer ? 'update' : 'create'} customer: ${error.message}`);
      } else {
        alert(`Failed to ${editingCustomer ? 'update' : 'create'} customer`);
      }
    } finally {
      setIsSubmittingCustomer(false);
    }
  };

  const handleConfirmDeleteCustomer = async () => {
    if (!deletingCustomer || !deletingCustomer.id) return;

    try {
      setIsSubmittingCustomer(true);
      await customersApi.deleteCustomer(deletingCustomer.id);
      // Recalculate sold quantities from all remaining customers
      await syncPurchasesWithProducts();
      // Refresh customer data
      const data = await customersApi.getCustomers();
      setCustomerData(data);
      handleCloseDeleteCustomerModal();
    } catch (error) {
      if (error instanceof Error) {
        alert(`Failed to delete customer: ${error.message}`);
      } else {
        alert('Failed to delete customer');
      }
    } finally {
      setIsSubmittingCustomer(false);
    }
  };


  // Calculate sold quantities from all customer purchases
  const calculateSoldQuantitiesFromCustomers = useCallback(async () => {
    try {
      // Get all customers and their purchases
      const allCustomers = await customersApi.getCustomers();
      
      // Calculate total sold quantity for each product from all customer purchases
      const productSoldQuantities = new Map<string, number>();
      
      allCustomers.forEach(customer => {
        if (customer.purchases && customer.purchases.length > 0) {
          customer.purchases.forEach(purchase => {
            const current = productSoldQuantities.get(purchase.productId) || 0;
            productSoldQuantities.set(purchase.productId, current + purchase.quantity);
          });
        }
      });

      // Get all products
      const allProducts = await marketingStatisticsApi.getMarketingStatistics();
      
      // Group products by productId
      const productMap = new Map<string, MarketingStatistic[]>();
      allProducts.forEach(product => {
        if (!productMap.has(product.productId)) {
          productMap.set(product.productId, []);
        }
        productMap.get(product.productId)!.push(product);
      });

      // Update each product's sold quantity based on actual customer purchases
      for (const [productId, soldQuantity] of productSoldQuantities.entries()) {
        const productRecords = productMap.get(productId);
        if (!productRecords || productRecords.length === 0) continue;

        // Update the most recent product record (or first one if no date)
        const productToUpdate = productRecords.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        )[0];

        if (productToUpdate.id) {
          const newAvailableStock = Math.max(0, productToUpdate.totalStock - soldQuantity);
          
          await marketingStatisticsApi.updateMarketingStatistic(productToUpdate.id, {
            soldQuantity: soldQuantity,
            availableStock: newAvailableStock,
          });
        }
      }

      // Also handle products that have no customer purchases (set sold quantity to 0)
      for (const [productId, productRecords] of productMap.entries()) {
        if (!productSoldQuantities.has(productId)) {
          const productToUpdate = productRecords.sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          )[0];

          if (productToUpdate.id && productToUpdate.soldQuantity > 0) {
            const newAvailableStock = productToUpdate.totalStock;
            
            await marketingStatisticsApi.updateMarketingStatistic(productToUpdate.id, {
              soldQuantity: 0,
              availableStock: newAvailableStock,
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to calculate sold quantities from customers:', error);
      throw error;
    }
  }, []);

  // Sync customer purchases with product sold quantities (recalculates from all customers)
  const syncPurchasesWithProducts = useCallback(async () => {
    await calculateSoldQuantitiesFromCustomers();
  }, [calculateSoldQuantitiesFromCustomers]);


  // Purchase management handlers
  const handleAddPurchase = () => {
    if (!newPurchase.productId || !newPurchase.quantity || newPurchase.quantity <= 0) {
      alert('Please select a product and enter a valid quantity');
      return;
    }

    const selectedProduct = products.find(p => p.productId === newPurchase.productId);
    if (!selectedProduct) {
      alert('Product not found');
      return;
    }

    // Calculate total amount (using a simple price calculation - you may need to adjust this)
    const unitPrice = 20; // Default price, you might want to add price to products
    const totalAmount = newPurchase.quantity * unitPrice;

    const purchase: CustomerPurchase = {
      ...newPurchase,
      productName: selectedProduct.productName,
      totalAmount,
    };

    const updatedPurchases = [...customerFormData.purchases, purchase];
    const totalSpent = updatedPurchases.reduce((sum, p) => sum + p.totalAmount, 0);
    const lastPurchaseDate = updatedPurchases.length > 0
      ? updatedPurchases.sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime())[0].purchaseDate
      : customerFormData.lastPurchaseDate;

    setCustomerFormData({
      ...customerFormData,
      purchases: updatedPurchases,
      totalSpent,
      lastPurchaseDate,
    });

    setNewPurchase({
      productId: '',
      productName: '',
      quantity: 1,
      purchaseDate: new Date().toISOString().split('T')[0],
    });
  };

  const handleEditPurchase = (index: number) => {
    const purchase = customerFormData.purchases[index];
    setNewPurchase({
      productId: purchase.productId,
      productName: purchase.productName,
      quantity: purchase.quantity,
      purchaseDate: purchase.purchaseDate,
    });
    setEditingPurchaseIndex(index);
  };

  const handleUpdatePurchase = () => {
    if (editingPurchaseIndex === null || !newPurchase.productId || !newPurchase.quantity || newPurchase.quantity <= 0) {
      alert('Please select a product and enter a valid quantity');
      return;
    }

    const selectedProduct = products.find(p => p.productId === newPurchase.productId);
    if (!selectedProduct) {
      alert('Product not found');
      return;
    }

    const unitPrice = 20; // Default price
    const totalAmount = newPurchase.quantity * unitPrice;

    const updatedPurchases = [...customerFormData.purchases];
    updatedPurchases[editingPurchaseIndex] = {
      ...newPurchase,
      productName: selectedProduct.productName,
      totalAmount,
    };

    const totalSpent = updatedPurchases.reduce((sum, p) => sum + p.totalAmount, 0);
    const lastPurchaseDate = updatedPurchases.length > 0
      ? updatedPurchases.sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime())[0].purchaseDate
      : customerFormData.lastPurchaseDate;

    setCustomerFormData({
      ...customerFormData,
      purchases: updatedPurchases,
      totalSpent,
      lastPurchaseDate,
    });

    setNewPurchase({
      productId: '',
      productName: '',
      quantity: 1,
      purchaseDate: new Date().toISOString().split('T')[0],
    });
    setEditingPurchaseIndex(null);
  };

  const handleDeletePurchase = (index: number) => {
    if (window.confirm('Are you sure you want to delete this purchase?')) {
      const updatedPurchases = customerFormData.purchases.filter((_, i) => i !== index);
      const totalSpent = updatedPurchases.reduce((sum, p) => sum + p.totalAmount, 0);
      const lastPurchaseDate = updatedPurchases.length > 0
        ? updatedPurchases.sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime())[0].purchaseDate
        : '';

      setCustomerFormData({
        ...customerFormData,
        purchases: updatedPurchases,
        totalSpent,
        lastPurchaseDate,
      });
    }
  };

  const handleCancelPurchaseEdit = () => {
    setNewPurchase({
      productId: '',
      productName: '',
      quantity: 1,
      purchaseDate: new Date().toISOString().split('T')[0],
    });
    setEditingPurchaseIndex(null);
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


  const customerColumns: TableColumn<Record<string, unknown>>[] = useMemo(
    () => [
      {
        key: 'name',
        header: 'Customer Name',
        width: '15%',
      },
      {
        key: 'email',
        header: 'Email',
        width: '18%',
      },
      {
        key: 'phone',
        header: 'Phone',
        width: '15%',
      },
      {
        key: 'lastPurchaseDate',
        header: 'Last Purchase',
        width: '18%',
        render: (value: unknown) => {
          const date = new Date(String(value));
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
        width: '15%',
        render: (_value: unknown, row: Record<string, unknown>) => {
          const customer = row as unknown as Customer;
          return (
            <div className={styles.actionButtons}>
              <button
                className={styles.viewButton}
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewCustomer(customer);
                }}
                aria-label={`View ${customer.name}`}
                title="View"
              >
                <svg
                  width="14"
                  height="14"
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
              <button
                className={styles.editButton}
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditCustomer(customer);
                }}
                aria-label={`Edit ${customer.name}`}
                title="Edit"
              >
                <svg
                  width="14"
                  height="14"
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
                  handleDeleteCustomer(customer);
                }}
                aria-label={`Delete ${customer.name}`}
                title="Delete"
              >
                <svg
                  width="14"
                  height="14"
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
          );
        },
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
      <Header />

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
              <h3 className={styles.cardTitle}>Customer Table</h3>
              <Button onClick={handleAddNewCustomer} variant="primary">
                Add New Customer
              </Button>
            </div>
            {isCustomerLoading ? (
              <div className={styles.loadingContainer}>
                <LoadingSpinner size="lg" />
                <p>Loading customer data...</p>
              </div>
            ) : customerError ? (
              <div className={styles.errorContainer}>
                <p className={styles.errorMessage}>{customerError}</p>
                <Button
                  onClick={() => {
                    setCustomerError(null);
                    setIsCustomerLoading(true);
                    customersApi.getCustomers()
                      .then((data) => {
                        setCustomerData(data);
                        setIsCustomerLoading(false);
                      })
                      .catch((error: unknown) => {
                        if (error instanceof Error) {
                          setCustomerError(error.message);
                        } else {
                          setCustomerError('Failed to load customer data');
                        }
                        setIsCustomerLoading(false);
                      });
                  }}
                  variant="primary"
                >
                  Retry
                </Button>
              </div>
            ) : (
              <Table
                columns={customerColumns}
                data={customerData as unknown as Record<string, unknown>[]}
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
                <Pagination
                  currentPage={currentCardPage}
                  totalPages={Math.ceil(studentDeclarations.length / cardsPerPage)}
                  totalItems={studentDeclarations.length}
                  itemsPerPage={cardsPerPage}
                  onPageChange={setCurrentCardPage}
                  showPageInfo={true}
                />
              </>
            )}
          </div>
        </div>
      </main>


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

      {/* View Customer Modal */}
      <Modal
        isOpen={isViewCustomerModalOpen}
        onClose={handleCloseViewCustomerModal}
        title="Customer Details"
      >
        {viewingCustomer && (
          <div className={styles.customerDetails}>
            <div className={styles.info}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Name:</span>
                <span className={styles.infoValue}>{viewingCustomer.name}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Email:</span>
                <span className={styles.infoValue}>{viewingCustomer.email}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Phone:</span>
                <span className={styles.infoValue}>{viewingCustomer.phone}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Address:</span>
                <span className={styles.infoValue}>{viewingCustomer.address}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Total Spent:</span>
                <span className={styles.infoValue}>${viewingCustomer.totalSpent.toFixed(2)}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Last Purchase:</span>
                <span className={styles.infoValue}>
                  {new Date(viewingCustomer.lastPurchaseDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
              {viewingCustomer.purchases && viewingCustomer.purchases.length > 0 && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Purchases:</span>
                  <div className={styles.purchasesList}>
                    {viewingCustomer.purchases.map((purchase, index) => (
                      <div key={index} className={styles.purchaseItem}>
                        <div className={styles.purchaseItemInfo}>
                          <div className={styles.purchaseProductName}>{purchase.productName}</div>
                          <div className={styles.purchaseDetails}>
                            <span className={styles.purchaseQuantity}>Qty: {purchase.quantity}</span>
                            <span className={styles.purchaseAmount}>${purchase.totalAmount.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Customer Modal */}
      <Modal
        isOpen={isEditCustomerModalOpen}
        onClose={handleCloseEditCustomerModal}
        title="Edit Customer"
      >
        <form onSubmit={handleCustomerFormSubmit} className={styles.form}>
          <div className={styles.formGrid}>
            <InputField
              label="Name"
              value={customerFormData.name}
              onChange={(e) => handleCustomerInputChange('name', e.target.value)}
              error={customerFormErrors.name}
              required
            />
            <InputField
              label="Email"
              type="email"
              value={customerFormData.email}
              onChange={(e) => handleCustomerInputChange('email', e.target.value)}
              error={customerFormErrors.email}
              required
            />
            <InputField
              label="Phone"
              value={customerFormData.phone}
              onChange={(e) => handleCustomerInputChange('phone', e.target.value)}
              error={customerFormErrors.phone}
              required
            />
            <InputField
              label="Address"
              value={customerFormData.address}
              onChange={(e) => handleCustomerInputChange('address', e.target.value)}
              error={customerFormErrors.address}
              required
            />
          </div>

          {/* Purchase Management Section */}
          <div className={styles.purchaseSection}>
            <h4 className={styles.sectionTitle}>Manage Purchases</h4>
            
            {/* Add/Edit Purchase Form */}
            <div className={styles.purchaseForm}>
              <Select
                label="Product"
                value={newPurchase.productId}
                onChange={(e) => {
                  const selectedProduct = products.find(p => p.productId === e.target.value);
                  setNewPurchase({
                    ...newPurchase,
                    productId: e.target.value,
                    productName: selectedProduct?.productName || '',
                  });
                }}
                options={[
                  { value: '', label: 'Select a product' },
                  ...Array.from(new Map(products.map(p => [p.productId, p])).values()).map(p => ({
                    value: p.productId,
                    label: `${p.productName} (ID: ${p.productId})`,
                  })),
                ]}
              />
              <InputField
                label="Quantity"
                type="number"
                value={newPurchase.quantity}
                onChange={(e) => setNewPurchase({ ...newPurchase, quantity: parseInt(e.target.value) || 1 })}
                min="1"
                required
              />
              <InputField
                label="Purchase Date"
                type="date"
                value={newPurchase.purchaseDate}
                onChange={(e) => setNewPurchase({ ...newPurchase, purchaseDate: e.target.value })}
                required
              />
              <div className={styles.purchaseFormActions}>
                {editingPurchaseIndex !== null ? (
                  <>
                    <Button
                      type="button"
                      variant="primary"
                      onClick={handleUpdatePurchase}
                    >
                      Update Purchase
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelPurchaseEdit}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleAddPurchase}
                  >
                    Add Purchase
                  </Button>
                )}
              </div>
            </div>

            {/* Purchases List */}
            {customerFormData.purchases.length > 0 && (
              <div className={styles.purchasesListContainer}>
                <h5 className={styles.purchasesListTitle}>Current Purchases</h5>
                <div className={styles.purchasesList}>
                  {customerFormData.purchases.map((purchase, index) => (
                    <div key={index} className={styles.purchaseItem}>
                      <div className={styles.purchaseItemInfo}>
                        <div className={styles.purchaseProductName}>{purchase.productName}</div>
                        <div className={styles.purchaseDetails}>
                          <span className={styles.purchaseQuantity}>Qty: {purchase.quantity}</span>
                          <span className={styles.purchaseAmount}>${purchase.totalAmount.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className={styles.purchaseItemActions}>
                        <button
                          type="button"
                          className={styles.editButton}
                          onClick={() => handleEditPurchase(index)}
                          title="Edit"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className={styles.deleteButton}
                          onClick={() => handleDeletePurchase(index)}
                          title="Delete"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 6h18" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className={styles.totalSpent}>
                  <strong>Total Spent: ${customerFormData.totalSpent.toFixed(2)}</strong>
                </div>
              </div>
            )}
          </div>

          <div className={styles.formActions}>
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseEditCustomerModal}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmittingCustomer}>
              Update
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Customer Modal */}
      <Modal
        isOpen={isAddCustomerModalOpen}
        onClose={handleCloseAddCustomerModal}
        title="Add New Customer"
      >
        <form onSubmit={handleCustomerFormSubmit} className={styles.form}>
          <div className={styles.formGrid}>
            <InputField
              label="Name"
              value={customerFormData.name}
              onChange={(e) => handleCustomerInputChange('name', e.target.value)}
              error={customerFormErrors.name}
              required
            />
            <InputField
              label="Email"
              type="email"
              value={customerFormData.email}
              onChange={(e) => handleCustomerInputChange('email', e.target.value)}
              error={customerFormErrors.email}
              required
            />
            <InputField
              label="Phone"
              value={customerFormData.phone}
              onChange={(e) => handleCustomerInputChange('phone', e.target.value)}
              error={customerFormErrors.phone}
              required
            />
            <InputField
              label="Address"
              value={customerFormData.address}
              onChange={(e) => handleCustomerInputChange('address', e.target.value)}
              error={customerFormErrors.address}
              required
            />
          </div>

          {/* Purchase Management Section */}
          <div className={styles.purchaseSection}>
            <h4 className={styles.sectionTitle}>Add Purchases (Optional)</h4>
            
            {/* Add Purchase Form */}
            <div className={styles.purchaseForm}>
              <Select
                label="Product"
                value={newPurchase.productId}
                onChange={(e) => {
                  const selectedProduct = products.find(p => p.productId === e.target.value);
                  setNewPurchase({
                    ...newPurchase,
                    productId: e.target.value,
                    productName: selectedProduct?.productName || '',
                  });
                }}
                options={[
                  { value: '', label: 'Select a product' },
                  ...Array.from(new Map(products.map(p => [p.productId, p])).values()).map(p => ({
                    value: p.productId,
                    label: `${p.productName} (ID: ${p.productId})`,
                  })),
                ]}
              />
              <InputField
                label="Quantity"
                type="number"
                value={newPurchase.quantity}
                onChange={(e) => setNewPurchase({ ...newPurchase, quantity: parseInt(e.target.value) || 1 })}
                min="1"
                required
              />
              <InputField
                label="Purchase Date"
                type="date"
                value={newPurchase.purchaseDate}
                onChange={(e) => setNewPurchase({ ...newPurchase, purchaseDate: e.target.value })}
                required
              />
              <div className={styles.purchaseFormActions}>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleAddPurchase}
                >
                  Add Purchase
                </Button>
              </div>
            </div>

            {/* Purchases List */}
            {customerFormData.purchases.length > 0 && (
              <div className={styles.purchasesListContainer}>
                <h5 className={styles.purchasesListTitle}>Purchases</h5>
                <div className={styles.purchasesList}>
                  {customerFormData.purchases.map((purchase, index) => (
                    <div key={index} className={styles.purchaseItem}>
                      <div className={styles.purchaseItemInfo}>
                        <div className={styles.purchaseProductName}>{purchase.productName}</div>
                        <div className={styles.purchaseDetails}>
                          <span className={styles.purchaseQuantity}>Qty: {purchase.quantity}</span>
                          <span className={styles.purchaseAmount}>${purchase.totalAmount.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className={styles.purchaseItemActions}>
                        <button
                          type="button"
                          className={styles.deleteButton}
                          onClick={() => handleDeletePurchase(index)}
                          title="Delete"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 6h18" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className={styles.totalSpent}>
                  <strong>Total Spent: ${customerFormData.totalSpent.toFixed(2)}</strong>
                </div>
              </div>
            )}
          </div>

          <div className={styles.formActions}>
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseAddCustomerModal}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmittingCustomer}>
              Create
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Customer Modal */}
      <Modal
        isOpen={isDeleteCustomerModalOpen}
        onClose={handleCloseDeleteCustomerModal}
        title="Delete Customer"
      >
        <div className={styles.deleteModalContent}>
          <p>
            Are you sure you want to delete the customer &quot;{deletingCustomer?.name}&quot;? This
            action cannot be undone.
          </p>
          <div className={styles.deleteModalActions}>
            <Button
              variant="outline"
              onClick={handleCloseDeleteCustomerModal}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleConfirmDeleteCustomer} isLoading={isSubmittingCustomer}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
