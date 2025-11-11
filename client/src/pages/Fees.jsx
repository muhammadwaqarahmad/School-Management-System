import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import feeService from '../services/feeService';
import studentService from '../services/studentService';
import Loader from '../components/Loader';
import { formatCurrency } from '../utils/currencyFormatter';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../utils/constants';
import { formatDate, formatDateTime } from '../utils/formatDate';

const Fees = () => {
  const { user } = useAuth();
  const [fees, setFees] = useState([]);
  const [summary, setSummary] = useState(null);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showMyFeeModal, setShowMyFeeModal] = useState(false);
  const [myFees, setMyFees] = useState([]);
  const [myFeeSummary, setMyFeeSummary] = useState(null);
  const [myFeeStudent, setMyFeeStudent] = useState(null);
  const [loadingMyFees, setLoadingMyFees] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);
  const [editingId, setEditingId] = useState(null);
  
  // Enhanced filters
  const [filters, setFilters] = useState({
    class: '',
    month: '',
    status: '',
    search: '',
    minAmount: '',
    maxAmount: '',
    dateFrom: '',
    dateTo: '',
    showPastFees: 'false' // 'true' for past fees, 'false' for current, '' for all
  });
  
  
  // Sorting state
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc'
  });
  
  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 25
  });
  
  // Bulk selection state
  const [selectedFees, setSelectedFees] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  
  const [formData, setFormData] = useState({
    studentId: '',
    amount: '',
    month: ''
  });

  const isAdmin = user?.role === ROLES.ADMIN || user?.role === ROLES.SUPER_ADMIN;

  useEffect(() => {
    fetchFees();
    fetchStudents();
  }, [filters.class, filters.month, filters.status, filters.showPastFees]);


  // Reset pagination when filters change
  useEffect(() => {
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, [filters.class, filters.month, filters.status, filters.search, filters.minAmount, filters.maxAmount]);

  const fetchStudents = async () => {
    try {
      const response = await studentService.getAll();
      // Handle both response structures (with data wrapper or direct)
      const studentsList = response.data?.students || response.students || response.data?.data?.students || [];
      if (studentsList.length > 0) {
        setStudents(studentsList);
        // Extract unique classes
        const uniqueClasses = [...new Set(studentsList.map(s => s.class).filter(Boolean))].sort();
        setClasses(uniqueClasses);
      }
    } catch (error) {
      console.error('Failed to fetch students');
    }
  };

  const formatMonthForAPI = (monthInput) => {
    // Convert "YYYY-MM" format to "MonthName YYYY" format
    if (!monthInput) return '';
    const [year, month] = monthInput.split('-');
    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  const formatMonthFromAPI = (monthString) => {
    // Convert "MonthName YYYY" format to "YYYY-MM" format for input fields
    if (!monthString) return '';
    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];
    const parts = monthString.split(' ');
    if (parts.length !== 2) return '';
    const monthName = parts[0];
    const year = parts[1];
    const monthIndex = monthNames.indexOf(monthName);
    if (monthIndex === -1) return '';
    const month = String(monthIndex + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  const fetchFees = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.class) params.class = filters.class;
      if (filters.month) params.month = formatMonthForAPI(filters.month);
      if (filters.status) params.status = filters.status;
      if (filters.showPastFees === 'false') {
        params.showPastFees = 'false'; // Only current and future fees
      }
      
      const response = await feeService.getAll(params);
      if (response.success && response.data) {
        setFees(response.data.fees || []);
        setSummary(response.data.summary || null);
      }
    } catch (error) {
      console.error('Failed to fetch fees:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Convert month format from YYYY-MM to MonthName YYYY for API
      const submitData = {
        ...formData,
        month: formatMonthForAPI(formData.month)
      };
      
      if (editingId) {
        await feeService.update(editingId, submitData);
        alert('Fee updated successfully!');
      } else {
        await feeService.create(submitData);
        alert('Fee created successfully!');
      }
      fetchFees();
      handleCloseModal();
    } catch (error) {
      alert(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this fee record?')) return;
    try {
      await feeService.delete(id);
      alert('Fee deleted successfully!');
      fetchFees();
    } catch (error) {
      alert('Failed to delete fee');
    }
  };

  const handleEdit = (fee) => {
    setFormData({
      studentId: fee.studentId,
      amount: fee.amount,
      month: formatMonthFromAPI(fee.month) // Convert to YYYY-MM format for input
    });
    setEditingId(fee.id);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      studentId: '',
      amount: '',
      month: ''
    });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const clearFilters = () => {
    setFilters({
      class: '',
      month: '',
      status: '',
      search: '',
      minAmount: '',
      maxAmount: '',
      dateFrom: '',
      dateTo: ''
    });
    setSelectedFees([]);
    setSelectAll(false);
  };

  // Filter and sort fees
  const filteredAndSortedFees = useMemo(() => {
    let filtered = [...fees];

    // Apply search filter
    if (filters.search && filters.search.trim()) {
      const searchLower = filters.search.toLowerCase().trim();
      filtered = filtered.filter(fee => {
        // Get display values (historical for past fees, current for current fees)
        const displayClass = fee.displayClass || fee.student?.class || '';
        const displayProgram = fee.displayProgram || fee.student?.program || '';
        const displaySection = fee.displaySection || fee.student?.section || '';
        const studentName = fee.student?.name || '';
        const rollNo = fee.student?.rollNo || '';
        const month = fee.month || '';
        
        // Search across all relevant fields
        return (
          studentName.toLowerCase().includes(searchLower) ||
          rollNo.toLowerCase().includes(searchLower) ||
          displayClass.toLowerCase().includes(searchLower) ||
          displayProgram.toLowerCase().includes(searchLower) ||
          displaySection.toLowerCase().includes(searchLower) ||
          month.toLowerCase().includes(searchLower)
        );
      });
    }

    // Apply amount range filters
    if (filters.minAmount) {
      filtered = filtered.filter(fee => fee.amount >= parseFloat(filters.minAmount));
    }
    if (filters.maxAmount) {
      filtered = filtered.filter(fee => fee.amount <= parseFloat(filters.maxAmount));
    }

    // Apply date range filters
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter(fee => {
        const feeDate = new Date(fee.createdAt);
        return feeDate >= fromDate;
      });
    }
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(fee => {
        const feeDate = new Date(fee.createdAt);
        return feeDate <= toDate;
      });
    }

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue, bValue;
        
        switch (sortConfig.key) {
          case 'studentName':
            aValue = a.student?.name || '';
            bValue = b.student?.name || '';
            break;
          case 'rollNo':
            aValue = a.student?.rollNo || '';
            bValue = b.student?.rollNo || '';
            break;
          case 'class':
            aValue = a.student?.class || '';
            bValue = b.student?.class || '';
            break;
          case 'amount':
            aValue = a.amount || 0;
            bValue = b.amount || 0;
            break;
          case 'month':
            aValue = a.month || '';
            bValue = b.month || '';
            break;
          case 'status':
            aValue = a.status || '';
            bValue = b.status || '';
            break;
          case 'createdAt':
            aValue = new Date(a.createdAt).getTime();
            bValue = new Date(b.createdAt).getTime();
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [fees, filters, sortConfig]);

  // Paginated fees
  const paginatedFees = useMemo(() => {
    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
    const endIndex = startIndex + pagination.itemsPerPage;
    return filteredAndSortedFees.slice(startIndex, endIndex);
  }, [filteredAndSortedFees, pagination]);

  // Total pages
  const totalPages = Math.ceil(filteredAndSortedFees.length / pagination.itemsPerPage);

  // Handle sorting
  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Handle pagination
  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle bulk selection
  const handleSelectFee = (feeId) => {
    setSelectedFees(prev =>
      prev.includes(feeId)
        ? prev.filter(id => id !== feeId)
        : [...prev, feeId]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedFees([]);
    } else {
      setSelectedFees(paginatedFees.map(fee => fee.id));
    }
    setSelectAll(!selectAll);
  };

  // Bulk mark as paid
  const handleBulkMarkAsPaid = async () => {
    if (selectedFees.length === 0) {
      alert('Please select at least one fee to mark as paid');
      return;
    }
    
    if (!confirm(`Mark ${selectedFees.length} fee(s) as paid?`)) return;

    try {
      const promises = selectedFees.map(id => feeService.markAsPaid(id));
      await Promise.all(promises);
      alert(`${selectedFees.length} fee(s) marked as paid successfully!`);
      setSelectedFees([]);
      setSelectAll(false);
      fetchFees();
    } catch (error) {
      alert('Failed to mark some fees as paid');
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Student Name', 'Roll No', 'Class', 'Amount', 'Month', 'Status', 'Created Date', 'Paid Date', 'Paid By'];
    const rows = filteredAndSortedFees.map(fee => [
      fee.student?.name || 'N/A',
      fee.student?.rollNo || 'N/A',
      fee.student?.class || 'N/A',
      fee.amount,
      fee.month,
      fee.status,
      formatDate(fee.createdAt),
      fee.paidDate ? formatDate(fee.paidDate) : 'N/A',
      fee.user?.name || 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `fees_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export selected to CSV
  const handleExportSelectedCSV = () => {
    if (selectedFees.length === 0) {
      alert('Please select at least one fee to export');
      return;
    }

    const selectedFeesData = filteredAndSortedFees.filter(fee => selectedFees.includes(fee.id));
    const headers = ['Student Name', 'Roll No', 'Class', 'Amount', 'Month', 'Status', 'Created Date', 'Paid Date', 'Paid By'];
    const rows = selectedFeesData.map(fee => [
      fee.student?.name || 'N/A',
      fee.student?.rollNo || 'N/A',
      fee.student?.class || 'N/A',
      fee.amount,
      fee.month,
      fee.status,
      formatDate(fee.createdAt),
      fee.paidDate ? formatDate(fee.paidDate) : 'N/A',
      fee.user?.name || 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `fees_selected_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generate receipt PDF
  const handleGenerateReceipt = async (fee) => {
    try {
      const jspdfModule = await import('jspdf');
      const { jsPDF } = jspdfModule;
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      let yPos = 20;

      // Header
      doc.setFontSize(20);
      doc.setFont(undefined, 'bold');
      doc.text('FEE RECEIPT', pageWidth / 2, yPos, { align: 'center' });
      yPos += 10;

      // Receipt details
      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      doc.text(`Receipt No: FE-${fee.id}`, margin, yPos);
      yPos += 7;
      doc.text(`Date: ${formatDate(new Date())}`, margin, yPos);
      yPos += 10;

      // Student information
      doc.setFont(undefined, 'bold');
      doc.text('Student Information:', margin, yPos);
      yPos += 7;
      doc.setFont(undefined, 'normal');
      doc.text(`Name: ${fee.student?.name || 'N/A'}`, margin + 5, yPos);
      yPos += 7;
      doc.text(`Roll No: ${fee.student?.rollNo || 'N/A'}`, margin + 5, yPos);
      yPos += 7;
      doc.text(`Class: ${fee.student?.class || 'N/A'}`, margin + 5, yPos);
      yPos += 10;

      // Fee details
      doc.setFont(undefined, 'bold');
      doc.text('Fee Details:', margin, yPos);
      yPos += 7;
      doc.setFont(undefined, 'normal');
      doc.text(`Month: ${fee.month}`, margin + 5, yPos);
      yPos += 7;
      doc.text(`Amount: ${formatCurrency(fee.amount)}`, margin + 5, yPos);
      yPos += 7;
      doc.text(`Status: ${fee.status.toUpperCase()}`, margin + 5, yPos);
      yPos += 7;
      if (fee.paidDate) {
        doc.text(`Paid Date: ${formatDate(fee.paidDate)}`, margin + 5, yPos);
        yPos += 7;
      }
      if (fee.user?.name) {
        doc.text(`Received By: ${fee.user.name}`, margin + 5, yPos);
      }

      // Footer
      yPos = doc.internal.pageSize.getHeight() - 20;
      doc.setFontSize(10);
      doc.setFont(undefined, 'italic');
      doc.setTextColor(128, 128, 128);
      doc.text('This is a computer-generated receipt.', pageWidth / 2, yPos, { align: 'center' });

      // Save PDF
      doc.save(`fee_receipt_${fee.id}_${fee.student?.rollNo || 'N/A'}.pdf`);
    } catch (error) {
      console.error('Error generating receipt:', error);
      alert('Failed to generate receipt. Please ensure jsPDF is installed.');
    }
  };

  // View payment details
  const handleViewPaymentDetails = (fee) => {
    setSelectedFee(fee);
    setShowPaymentModal(true);
  };

  // Handle My Fee button click for a specific student
  const handleMyFeeClick = async (studentId) => {
    try {
      setLoadingMyFees(true);
      setShowMyFeeModal(true);
      
      // Find student info first
      const foundStudent = students.find(s => s.id === studentId);
      if (foundStudent) {
        setMyFeeStudent(foundStudent);
      }
      
      // Fetch past fees for the specific student
      const response = await feeService.getAll({ 
        studentId: studentId.toString(),
        showPastFees: 'true' // Only past fees
      });
      
      if (response.success && response.data) {
        let studentFees = response.data.fees || [];
        
        // Sort past fees by month/year (oldest first) for better chronological viewing
        const monthNames = ["January", "February", "March", "April", "May", "June",
          "July", "August", "September", "October", "November", "December"];
        studentFees.sort((a, b) => {
          const parseMonth = (monthStr) => {
            const [monthName, year] = monthStr.split(' ');
            const monthIndex = monthNames.indexOf(monthName);
            if (monthIndex === -1) return new Date(0);
            return new Date(parseInt(year), monthIndex, 1);
          };
          const dateA = parseMonth(a.month);
          const dateB = parseMonth(b.month);
          return dateA - dateB; // Oldest first
        });
        
        setMyFees(studentFees);
        
        // If student not found in students list, get from first fee
        if (!foundStudent && studentFees.length > 0 && studentFees[0].student) {
          setMyFeeStudent(studentFees[0].student);
        }
        
        // Calculate summary
        const totalAmount = studentFees.reduce((sum, fee) => sum + fee.amount, 0);
        const paidAmount = studentFees.filter(f => f.paid).reduce((sum, fee) => sum + fee.amount, 0);
        const pendingAmount = studentFees.filter(f => f.status === 'pending').reduce((sum, fee) => sum + fee.amount, 0);
        const overdueAmount = studentFees.filter(f => f.status === 'overdue').reduce((sum, fee) => sum + fee.amount, 0);
        
        setMyFeeSummary({
          total: { amount: totalAmount, count: studentFees.length },
          paid: { amount: paidAmount, count: studentFees.filter(f => f.paid).length },
          pending: { amount: pendingAmount, count: studentFees.filter(f => f.status === 'pending').length },
          overdue: { amount: overdueAmount, count: studentFees.filter(f => f.status === 'overdue').length }
        });
      } else {
        // No fees found, but student exists
        setMyFees([]);
        setMyFeeSummary({
          total: { amount: 0, count: 0 },
          paid: { amount: 0, count: 0 },
          pending: { amount: 0, count: 0 },
          overdue: { amount: 0, count: 0 }
        });
      }
    } catch (error) {
      console.error('Failed to fetch student fees:', error);
      alert('Failed to load fees. Please try again.');
      setShowMyFeeModal(false);
    } finally {
      setLoadingMyFees(false);
    }
  };

  const handleMarkAsPaid = async (id) => {
    if (!confirm('Mark this fee as paid?')) return;
    try {
      await feeService.markAsPaid(id);
      alert('Fee marked as paid successfully!');
      fetchFees();
    } catch (error) {
      alert('Failed to mark fee as paid');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      paid: { color: '#5cb85c', bg: '#dff0d8', text: 'Paid' },
      pending: { color: '#f0ad4e', bg: '#fcf8e3', text: 'Pending' },
      overdue: { color: '#d9534f', bg: '#f2dede', text: 'Overdue' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    
    return (
      <span style={{
        padding: '4px 10px',
        borderRadius: '3px',
        fontSize: '12px',
        fontWeight: 'bold',
        backgroundColor: config.bg,
        color: config.color,
        border: `1px solid ${config.color}`
      }}>
        {config.text}
      </span>
    );
  };

  if (loading && fees.length === 0) return <Loader />;

  return (
    <div className="h-full overflow-y-auto" style={{ 
      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
      fontSize: '13px',
      lineHeight: '1.6',
      color: '#333',
      backgroundColor: '#fff',
      padding: '15px',
      boxSizing: 'border-box'
    }}>
      {/* Breadcrumb */}
      <div style={{ 
        padding: '8px 15px',
        backgroundColor: '#f5f5f5',
        borderRadius: '4px',
        marginBottom: '20px'
      }}>
        <ol style={{ 
          listStyle: 'none',
          padding: 0,
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <li>
            <Link to="/" style={{ color: '#337ab7', textDecoration: 'none' }}>
              <i className="fas fa-desktop" style={{ marginRight: '5px' }}></i>
              Home
            </Link>
          </li>
          <li style={{ color: '#ccc' }}>/</li>
          <li>
            <Link to="/fees" style={{ color: '#337ab7', textDecoration: 'none' }}>
              Fees
            </Link>
          </li>
        </ol>
      </div>

      {/* Page Heading */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ 
          fontSize: '24px',
          fontWeight: 500,
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <i className="fas fa-dollar-sign" style={{ color: '#337ab7' }}></i>
          Fee Management
        </h1>
      </div>

      {/* Enhanced Fee Summary Cards */}
      {summary && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '15px',
          marginBottom: '20px'
        }}>
          <div style={{
            padding: '20px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '8px',
            color: '#fff',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            transition: 'transform 0.2s',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <i className="fas fa-coins" style={{ fontSize: '24px', opacity: 0.9 }}></i>
              <span style={{ fontSize: '12px', opacity: 0.9, background: 'rgba(255,255,255,0.2)', padding: '4px 8px', borderRadius: '12px' }}>
                Total
              </span>
            </div>
            <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 5px 0' }}>
              {formatCurrency(summary.total?.amount || 0)}
            </p>
            <p style={{ fontSize: '13px', opacity: 0.9, margin: 0 }}>
              {filteredAndSortedFees.length} record(s)
            </p>
          </div>
          
          <div style={{
            padding: '20px',
            background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
            borderRadius: '8px',
            color: '#fff',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            transition: 'transform 0.2s',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <i className="fas fa-check-circle" style={{ fontSize: '24px', opacity: 0.9 }}></i>
              <span style={{ fontSize: '12px', opacity: 0.9, background: 'rgba(255,255,255,0.2)', padding: '4px 8px', borderRadius: '12px' }}>
                Paid
              </span>
            </div>
            <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 5px 0' }}>
              {formatCurrency(summary.paid?.amount || 0)}
            </p>
            <p style={{ fontSize: '13px', opacity: 0.9, margin: 0 }}>
              {summary.paid?.count || 0} record(s)
            </p>
          </div>

          <div style={{
            padding: '20px',
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            borderRadius: '8px',
            color: '#fff',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            transition: 'transform 0.2s',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <i className="fas fa-clock" style={{ fontSize: '24px', opacity: 0.9 }}></i>
              <span style={{ fontSize: '12px', opacity: 0.9, background: 'rgba(255,255,255,0.2)', padding: '4px 8px', borderRadius: '12px' }}>
                Pending
              </span>
            </div>
            <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 5px 0' }}>
              {formatCurrency(summary.pending?.amount || 0)}
            </p>
            <p style={{ fontSize: '13px', opacity: 0.9, margin: 0 }}>
              {summary.pending?.count || 0} record(s)
            </p>
          </div>

          <div style={{
            padding: '20px',
            background: 'linear-gradient(135deg, #ee0979 0%, #ff6a00 100%)',
            borderRadius: '8px',
            color: '#fff',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            transition: 'transform 0.2s',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <i className="fas fa-exclamation-triangle" style={{ fontSize: '24px', opacity: 0.9 }}></i>
              <span style={{ fontSize: '12px', opacity: 0.9, background: 'rgba(255,255,255,0.2)', padding: '4px 8px', borderRadius: '12px' }}>
                Overdue
              </span>
            </div>
            <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 5px 0' }}>
              {formatCurrency(summary.overdue?.amount || 0)}
            </p>
            <p style={{ fontSize: '13px', opacity: 0.9, margin: 0 }}>
              {summary.overdue?.count || 0} record(s)
            </p>
          </div>
        </div>
      )}

      {/* Enhanced Filters and Actions Section */}
      <div style={{
        padding: '20px',
        backgroundColor: '#f9f9f9',
        border: '1px solid #ddd',
        borderRadius: '8px',
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        {/* Search Bar */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px', color: '#333' }}>
            <i className="fas fa-search" style={{ marginRight: '8px', color: '#337ab7' }}></i>
            Search Fees:
          </label>
          <input
            type="text"
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            placeholder="Search by student name, roll number, or class..."
            style={{
              width: '100%',
              padding: '10px 15px',
              fontSize: '14px',
              border: '2px solid #ddd',
              borderRadius: '6px',
              transition: 'border-color 0.3s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#337ab7'}
            onBlur={(e) => e.target.style.borderColor = '#ddd'}
          />
        </div>

        {/* Filter Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '13px' }}>
              Class:
            </label>
            <select
              name="class"
              value={filters.class}
              onChange={handleFilterChange}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '14px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            >
              <option value="">All Classes</option>
              {classes.map(className => (
                <option key={className} value={className}>
                  {className}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '13px' }}>
              Month:
            </label>
            <input
              type="month"
              name="month"
              value={filters.month}
              onChange={handleFilterChange}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '14px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '13px' }}>
              Status:
            </label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '14px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            >
              <option value="">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '13px' }}>
              Min Amount:
            </label>
            <input
              type="number"
              name="minAmount"
              value={filters.minAmount}
              onChange={handleFilterChange}
              placeholder="0"
              min="0"
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '14px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '13px' }}>
              Max Amount:
            </label>
            <input
              type="number"
              name="maxAmount"
              value={filters.maxAmount}
              onChange={handleFilterChange}
              placeholder="Any"
              min="0"
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '14px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '13px' }}>
              Date From:
            </label>
            <input
              type="date"
              name="dateFrom"
              value={filters.dateFrom}
              onChange={handleFilterChange}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '14px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '13px' }}>
              Date To:
            </label>
            <input
              type="date"
              name="dateTo"
              value={filters.dateTo}
              onChange={handleFilterChange}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '14px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid #ddd' }}>
          <button
            onClick={clearFilters}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              color: '#333',
              backgroundColor: '#fff',
              border: '1px solid #ccc',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e6e6e6'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
          >
            <i className="fas fa-times"></i>
            Clear Filters
          </button>
          
          <button
            onClick={handleExportCSV}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              color: '#fff',
              backgroundColor: '#28a745',
              border: '1px solid #28a745',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#218838'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#28a745'}
          >
            <i className="fas fa-file-csv"></i>
            Export All to CSV
          </button>

          {selectedFees.length > 0 && (
            <>
              <span style={{ color: '#666', fontSize: '14px', margin: '0 5px' }}>
                {selectedFees.length} selected
              </span>
              <button
                onClick={handleBulkMarkAsPaid}
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  color: '#fff',
                  backgroundColor: '#5cb85c',
                  border: '1px solid #5cb85c',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#449d44'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#5cb85c'}
              >
                <i className="fas fa-check"></i>
                Mark Selected as Paid
              </button>
              <button
                onClick={handleExportSelectedCSV}
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  color: '#fff',
                  backgroundColor: '#17a2b8',
                  border: '1px solid #17a2b8',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#138496'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#17a2b8'}
              >
                <i className="fas fa-download"></i>
                Export Selected
              </button>
            </>
          )}
        </div>
      </div>

      {/* Alert with Add Button */}
      <div style={{
        padding: '8px 15px',
        marginBottom: '20px',
        backgroundColor: '#d9edf7',
        border: '1px solid #bce8f1',
        borderRadius: '4px',
        color: '#31708f',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <strong>Note!</strong> Fees are automatically generated when students are added or promoted.
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            style={{
              color: '#fff',
              backgroundColor: '#5cb85c',
              border: '1px solid #4cae4c',
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'normal',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#449d44'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#5cb85c'}
          >
            Add New Fee
          </button>
        )}
      </div>

      {/* Fees Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          border: '1px solid #ddd',
          borderCollapse: 'collapse',
          backgroundColor: '#fff',
          marginBottom: '20px'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#f5f5f5' }}>
              <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'left', whiteSpace: 'nowrap' }}>Student Name</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'left', whiteSpace: 'nowrap' }}>Roll No</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'left', whiteSpace: 'nowrap' }}>Class</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'left', whiteSpace: 'nowrap' }}>Amount</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'left', whiteSpace: 'nowrap' }}>Month</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'center', whiteSpace: 'nowrap' }}>Status</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'left', whiteSpace: 'nowrap' }}>Created Date</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'left', whiteSpace: 'nowrap' }}>Payment Info</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'center', whiteSpace: 'nowrap' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedFees.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                  {filteredAndSortedFees.length === 0 
                    ? `No fee records found. ${isAdmin ? 'Click "Add New Fee" to create one.' : ''}`
                    : 'No fees match your search criteria. Try adjusting your filters.'}
                </td>
              </tr>
            ) : (
              paginatedFees.map((fee) => {
                const isOverdue = fee.status === 'overdue';
                return (
                  <tr key={fee.id} style={{
                    backgroundColor: isOverdue ? '#fff5f5' : 'transparent'
                  }}>
                    <td style={{ padding: '8px', border: '1px solid #ddd', whiteSpace: 'nowrap' }}>
                      {fee.student?.name || 'N/A'}
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #ddd', whiteSpace: 'nowrap' }}>
                      {fee.student?.rollNo || 'N/A'}
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #ddd', whiteSpace: 'nowrap' }}>
                      {fee.displayClass || fee.student?.class || 'N/A'}
                      {fee.isPastFee && fee.historicalClass && (
                        <span style={{ fontSize: '10px', color: '#777', display: 'block', fontStyle: 'italic' }}>
                          (Historical)
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #ddd', whiteSpace: 'nowrap', fontWeight: 'bold', color: '#5cb85c' }}>
                      {formatCurrency(fee.amount)}
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #ddd', whiteSpace: 'nowrap' }}>
                      {fee.month}
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      {getStatusBadge(fee.status)}
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #ddd', whiteSpace: 'nowrap' }}>
                      {new Date(fee.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #ddd', whiteSpace: 'nowrap', fontSize: '12px' }}>
                      {fee.paid ? (
                        <div>
                          <div><strong>Paid:</strong> {fee.paidDate ? new Date(fee.paidDate).toLocaleDateString() : 'N/A'}</div>
                          {fee.user && (
                            <div style={{ color: '#777', marginTop: '2px' }}>
                              <strong>By:</strong> {fee.user.name}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: '#999' }}>Not paid</span>
                      )}
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                        <button
                          onClick={() => handleMyFeeClick(fee.studentId)}
                          style={{
                            backgroundColor: '#9c27b0',
                            color: '#fff',
                            border: 'none',
                            padding: '4px 8px',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            width: '100%',
                            minWidth: '70px'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#7b1fa2'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#9c27b0'}
                          title={`View ${fee.student?.name || 'student'}'s past fees`}
                        >
                          <i className="fas fa-history" style={{ marginRight: '3px', fontSize: '10px' }}></i>
                          My Fee
                        </button>
                        {!fee.paid && (
                          <button
                            onClick={() => handleMarkAsPaid(fee.id)}
                            style={{
                              backgroundColor: '#5cb85c',
                              color: '#fff',
                              border: 'none',
                              padding: '4px 8px',
                              borderRadius: '3px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              width: '100%',
                              minWidth: '70px'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#449d44'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#5cb85c'}
                          >
                            Mark Paid
                          </button>
                        )}
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => handleEdit(fee)}
                              style={{
                                backgroundColor: '#337ab7',
                                color: '#fff',
                                border: 'none',
                                padding: '4px 8px',
                                borderRadius: '3px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                width: '100%',
                                minWidth: '70px'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#286090'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#337ab7'}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(fee.id)}
                              style={{
                                backgroundColor: '#d9534f',
                                color: '#fff',
                                border: 'none',
                                padding: '4px 8px',
                                borderRadius: '3px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                width: '100%',
                                minWidth: '70px'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#c9302c'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#d9534f'}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '10px',
          marginTop: '20px',
          marginBottom: '20px'
        }}>
          <button
            onClick={() => handlePageChange(1)}
            disabled={pagination.currentPage === 1}
            style={{
              padding: '8px 12px',
              fontSize: '14px',
              color: pagination.currentPage === 1 ? '#ccc' : '#333',
              backgroundColor: '#fff',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: pagination.currentPage === 1 ? 'not-allowed' : 'pointer'
            }}
          >
            First
          </button>
          <button
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
            style={{
              padding: '8px 12px',
              fontSize: '14px',
              color: pagination.currentPage === 1 ? '#ccc' : '#333',
              backgroundColor: '#fff',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: pagination.currentPage === 1 ? 'not-allowed' : 'pointer'
            }}
          >
            Previous
          </button>
          <span style={{ padding: '8px 12px', fontSize: '14px' }}>
            Page {pagination.currentPage} of {totalPages} ({filteredAndSortedFees.length} total)
          </span>
          <button
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={pagination.currentPage === totalPages}
            style={{
              padding: '8px 12px',
              fontSize: '14px',
              color: pagination.currentPage === totalPages ? '#ccc' : '#333',
              backgroundColor: '#fff',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: pagination.currentPage === totalPages ? 'not-allowed' : 'pointer'
            }}
          >
            Next
          </button>
          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={pagination.currentPage === totalPages}
            style={{
              padding: '8px 12px',
              fontSize: '14px',
              color: pagination.currentPage === totalPages ? '#ccc' : '#333',
              backgroundColor: '#fff',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: pagination.currentPage === totalPages ? 'not-allowed' : 'pointer'
            }}
          >
            Last
          </button>
        </div>
      )}

      {/* Add/Edit Fee Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1050,
          overflow: 'auto'
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '6px',
            boxShadow: '0 5px 15px rgba(0,0,0,0.5)',
            width: '90%',
            maxWidth: '500px',
            margin: '20px'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '15px',
              borderBottom: '1px solid #e5e5e5',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 500 }}>
                {editingId ? 'Edit Fee' : 'Add New Fee'}
              </h4>
              <button
                onClick={handleCloseModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '21px',
                  fontWeight: 'bold',
                  color: '#000',
                  opacity: 0.2,
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.5'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.2'}
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit}>
              <div style={{ padding: '15px' }}>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Student:
                  </label>
                  <select
                    name="studentId"
                    value={formData.studentId}
                    onChange={handleChange}
                    required
                    style={{
                      width: '100%',
                      padding: '6px 12px',
                      fontSize: '14px',
                      border: '1px solid #ccc',
                      borderRadius: '4px'
                    }}
                  >
                    <option value="">Select Student</option>
                    {students.map(student => (
                      <option key={student.id} value={student.id}>
                        {student.name} ({student.rollNo}) - {student.class}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Amount:
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    style={{
                      width: '100%',
                      padding: '6px 12px',
                      fontSize: '14px',
                      border: '1px solid #ccc',
                      borderRadius: '4px'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Month:
                  </label>
                  <input
                    type="month"
                    name="month"
                    value={formData.month}
                    onChange={handleChange}
                    required
                    style={{
                      width: '100%',
                      padding: '6px 12px',
                      fontSize: '14px',
                      border: '1px solid #ccc',
                      borderRadius: '4px'
                    }}
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{
                padding: '15px',
                borderTop: '1px solid #e5e5e5',
                textAlign: 'right'
              }}>
                <button
                  type="submit"
                  style={{
                    padding: '6px 12px',
                    fontSize: '14px',
                    color: '#fff',
                    backgroundColor: '#337ab7',
                    border: '1px solid #2e6da4',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    marginRight: '5px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#286090'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#337ab7'}
                >
                  {editingId ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  style={{
                    padding: '6px 12px',
                    fontSize: '14px',
                    color: '#333',
                    backgroundColor: '#fff',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e6e6e6'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* My Fee Modal - Shows current user's past fees */}
      {showMyFeeModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1050,
          overflow: 'auto',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '6px',
            boxShadow: '0 5px 15px rgba(0,0,0,0.5)',
            width: '90%',
            maxWidth: '1200px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            margin: '20px'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '15px 20px',
              borderBottom: '1px solid #e5e5e5',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexShrink: 0
            }}>
              <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <i className="fas fa-history" style={{ color: '#9c27b0' }}></i>
                {myFeeStudent ? `${myFeeStudent.name}'s Past Fee Records (Historical Data)` : 'Past Fee Records (Historical Data)'}
              </h4>
              <button
                onClick={() => setShowMyFeeModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '21px',
                  fontWeight: 'bold',
                  color: '#000',
                  opacity: 0.2,
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.5'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.2'}
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div style={{
              padding: '20px',
              overflowY: 'auto',
              flex: 1
            }}>
              {loadingMyFees ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <Loader />
                </div>
              ) : (
                <>
                  {/* Info Note */}
                  <div style={{
                    padding: '12px 15px',
                    backgroundColor: '#e7f3ff',
                    border: '1px solid #b3d9ff',
                    borderRadius: '8px',
                    marginBottom: '15px',
                    color: '#004085',
                    fontSize: '13px'
                  }}>
                    <i className="fas fa-info-circle" style={{ marginRight: '8px' }}></i>
                    <strong>Note:</strong> This shows all past fee records with historical data (class, program, section, session) from when each fee was created. 
                    Historical data is preserved even when students are promoted to new classes.
                  </div>

                  {/* Student Info */}
                  {myFeeStudent ? (
                    <div style={{
                      padding: '15px',
                      backgroundColor: '#d9edf7',
                      border: '1px solid #bce8f1',
                      borderRadius: '8px',
                      marginBottom: '20px',
                      color: '#31708f'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        <i className="fas fa-user-graduate" style={{ fontSize: '20px' }}></i>
                        <strong style={{ fontSize: '16px' }}>Student Information (Current)</strong>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                        <div><strong>Name:</strong> {myFeeStudent.name}</div>
                        <div><strong>Roll No:</strong> {myFeeStudent.rollNo}</div>
                        <div><strong>Current Class:</strong> {myFeeStudent.class}</div>
                        <div><strong>Program:</strong> {myFeeStudent.program}</div>
                        {myFeeStudent.session && <div><strong>Current Session:</strong> {myFeeStudent.session}</div>}
                      </div>
                      <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #bce8f1', fontSize: '12px', fontStyle: 'italic' }}>
                        * Current information shown above. Historical data for each fee is shown in the table below.
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      padding: '20px',
                      backgroundColor: '#fff3cd',
                      border: '1px solid #ffc107',
                      borderRadius: '8px',
                      marginBottom: '20px',
                      color: '#856404',
                      textAlign: 'center'
                    }}>
                      <i className="fas fa-exclamation-triangle" style={{ fontSize: '24px', marginBottom: '10px' }}></i>
                      <p style={{ margin: 0, fontSize: '14px' }}>
                        <strong>No student record found.</strong><br />
                        Your user account is not linked to any student record. Please contact the administrator.
                      </p>
                    </div>
                  )}

                  {/* Summary Cards */}
                  {myFeeSummary && (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '15px',
                      marginBottom: '20px'
                    }}>
                      <div style={{
                        padding: '15px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: '8px',
                        color: '#fff'
                      }}>
                        <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '5px' }}>Total</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                          {formatCurrency(myFeeSummary.total?.amount || 0)}
                        </div>
                        <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '5px' }}>
                          {myFeeSummary.total?.count || 0} record(s)
                        </div>
                      </div>
                      <div style={{
                        padding: '15px',
                        background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                        borderRadius: '8px',
                        color: '#fff'
                      }}>
                        <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '5px' }}>Paid</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                          {formatCurrency(myFeeSummary.paid?.amount || 0)}
                        </div>
                        <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '5px' }}>
                          {myFeeSummary.paid?.count || 0} record(s)
                        </div>
                      </div>
                      <div style={{
                        padding: '15px',
                        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                        borderRadius: '8px',
                        color: '#fff'
                      }}>
                        <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '5px' }}>Pending</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                          {formatCurrency(myFeeSummary.pending?.amount || 0)}
                        </div>
                        <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '5px' }}>
                          {myFeeSummary.pending?.count || 0} record(s)
                        </div>
                      </div>
                      <div style={{
                        padding: '15px',
                        background: 'linear-gradient(135deg, #ee0979 0%, #ff6a00 100%)',
                        borderRadius: '8px',
                        color: '#fff'
                      }}>
                        <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '5px' }}>Overdue</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                          {formatCurrency(myFeeSummary.overdue?.amount || 0)}
                        </div>
                        <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '5px' }}>
                          {myFeeSummary.overdue?.count || 0} record(s)
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Fees Table */}
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{
                      width: '100%',
                      border: '1px solid #ddd',
                      borderCollapse: 'collapse',
                      backgroundColor: '#fff'
                    }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f5f5f5' }}>
                          <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'left' }}>Month & Year</th>
                          <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'left' }}>Class (Historical)</th>
                          <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'left' }}>Program (Historical)</th>
                          <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'left' }}>Section (Historical)</th>
                          <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'left' }}>Session (Historical)</th>
                          <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'left' }}>Fee Amount</th>
                          <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'center' }}>Status</th>
                          <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'left' }}>Created Date</th>
                          <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'left' }}>Payment Date</th>
                          <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'left' }}>Paid By</th>
                        </tr>
                      </thead>
                      <tbody>
                        {myFees.length === 0 ? (
                          <tr>
                            <td colSpan="10" style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                              {myFeeStudent 
                                ? 'No past fee records found. Your past fees will appear here once they are generated.'
                                : 'No student record found.'}
                            </td>
                          </tr>
                        ) : (
                          myFees.map((fee) => {
                            const isOverdue = fee.status === 'overdue';
                            return (
                              <tr key={fee.id} style={{
                                backgroundColor: isOverdue ? '#fff5f5' : (fee.paid ? '#f0fff0' : 'transparent')
                              }}>
                                <td style={{ padding: '8px', border: '1px solid #ddd', whiteSpace: 'nowrap', fontWeight: 'bold' }}>
                                  {fee.month}
                                </td>
                                <td style={{ padding: '8px', border: '1px solid #ddd', whiteSpace: 'nowrap' }}>
                                  <div>
                                    <strong>{fee.displayClass || fee.historicalClass || fee.student?.class || 'N/A'}</strong>
                                    {fee.historicalClass && (
                                      <span style={{ fontSize: '10px', color: '#777', display: 'block', fontStyle: 'italic' }}>
                                        (Historical)
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td style={{ padding: '8px', border: '1px solid #ddd', whiteSpace: 'nowrap' }}>
                                  <div>
                                    <strong>{fee.displayProgram || fee.historicalProgram || fee.student?.program || 'N/A'}</strong>
                                    {fee.historicalProgram && (
                                      <span style={{ fontSize: '10px', color: '#777', display: 'block', fontStyle: 'italic' }}>
                                        (Historical)
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td style={{ padding: '8px', border: '1px solid #ddd', whiteSpace: 'nowrap' }}>
                                  <div>
                                    <strong>{fee.displaySection || fee.historicalSection || fee.student?.section || 'N/A'}</strong>
                                    {fee.historicalSection && (
                                      <span style={{ fontSize: '10px', color: '#777', display: 'block', fontStyle: 'italic' }}>
                                        (Historical)
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td style={{ padding: '8px', border: '1px solid #ddd', whiteSpace: 'nowrap' }}>
                                  <div>
                                    <strong>{fee.displaySession || fee.historicalSession || fee.student?.session || 'N/A'}</strong>
                                    {fee.historicalSession && (
                                      <span style={{ fontSize: '10px', color: '#777', display: 'block', fontStyle: 'italic' }}>
                                        (Historical)
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td style={{ padding: '8px', border: '1px solid #ddd', whiteSpace: 'nowrap', fontWeight: 'bold', color: '#5cb85c' }}>
                                  {formatCurrency(fee.amount)}
                                </td>
                                <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                  {getStatusBadge(fee.status)}
                                </td>
                                <td style={{ padding: '8px', border: '1px solid #ddd', whiteSpace: 'nowrap' }}>
                                  {formatDate(fee.createdAt)}
                                </td>
                                <td style={{ padding: '8px', border: '1px solid #ddd', whiteSpace: 'nowrap' }}>
                                  {fee.paidDate ? formatDate(fee.paidDate) : <span style={{ color: '#999' }}>Not paid</span>}
                                </td>
                                <td style={{ padding: '8px', border: '1px solid #ddd', whiteSpace: 'nowrap', fontSize: '12px' }}>
                                  {fee.user?.name || <span style={{ color: '#999' }}>N/A</span>}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '15px 20px',
              borderTop: '1px solid #e5e5e5',
              textAlign: 'right',
              flexShrink: 0
            }}>
              <button
                onClick={() => setShowMyFeeModal(false)}
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  color: '#333',
                  backgroundColor: '#fff',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e6e6e6'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Fees;
