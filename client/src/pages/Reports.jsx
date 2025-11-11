import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import reportService from '../services/reportService';
import { formatCurrency } from '../utils/currencyFormatter';
import Loader from '../components/Loader';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../utils/constants';

const Reports = () => {
  const { user } = useAuth();
  const [defaulters, setDefaulters] = useState([]);
  const [financialOverview, setFinancialOverview] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [monthlyFeeReport, setMonthlyFeeReport] = useState(null);
  const [monthlySalaryReport, setMonthlySalaryReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMonthly, setLoadingMonthly] = useState(false);
  
  // Report generation states
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState('monthly'); // monthly, yearly, custom
  const [reportMonth, setReportMonth] = useState('');
  const [reportYear, setReportYear] = useState('');
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');
  const [generatingReport, setGeneratingReport] = useState(false);

  const isAdmin = user?.role === ROLES.ADMIN || user?.role === ROLES.SUPER_ADMIN;
  const isAccountant = user?.role === ROLES.ACCOUNTANT;
  const canGenerateReport = isAdmin || isAccountant;

  useEffect(() => {
    loadAllData();
    setCurrentMonth();
    
    // Fallback timeout to ensure page renders even if APIs fail
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('Reports page timeout - forcing render');
        setLoading(false);
      }
    }, 5000);
    
    return () => clearTimeout(timeout);
  }, []);

  const setCurrentMonth = () => {
    const date = new Date();
    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];
    const currentMonth = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
    setSelectedMonth(currentMonth);
    setReportMonth(currentMonth);
    setReportYear(date.getFullYear().toString());
    
    // Set default dates for custom range (current month)
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const firstDay = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    setReportStartDate(firstDay);
    setReportEndDate(`${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`);
  };

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [defaultersRes, overviewRes] = await Promise.allSettled([
        reportService.getDefaulters().catch(err => {
          console.error('Error fetching defaulters:', err);
          return { data: { defaulters: [] } };
        }),
        reportService.getFinancialOverview().catch(err => {
          console.error('Error fetching financial overview:', err);
          return { data: null };
        })
      ]);
      
      const defaultersData = defaultersRes.status === 'fulfilled' 
        ? (defaultersRes.value.data?.defaulters || defaultersRes.value.data || [])
        : [];
      const overviewData = overviewRes.status === 'fulfilled'
        ? (overviewRes.value.data || overviewRes.value || null)
        : null;
      
      setDefaulters(defaultersData);
      setFinancialOverview(overviewData);
      
      // Load current month reports
      const currentDate = new Date();
      const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
      const currentMonth = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
      await loadMonthlyReports(currentMonth);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMonthlyReports = async (month) => {
    if (!month) return;
    
    try {
      setLoadingMonthly(true);
      const [feeRes, salaryRes] = await Promise.all([
        reportService.getMonthlyFeeReport(month).catch(() => ({ data: null })),
        reportService.getMonthlySalaryReport(month).catch(() => ({ data: null }))
      ]);
      
      setMonthlyFeeReport(feeRes.data || null);
      setMonthlySalaryReport(salaryRes.data || null);
    } catch (error) {
      console.error('Error loading monthly reports:', error);
    } finally {
      setLoadingMonthly(false);
    }
  };

  const handleMonthChange = (e) => {
    const month = e.target.value;
    setSelectedMonth(month);
    if (month) {
      loadMonthlyReports(month);
    }
  };

  // PDF Generation Functions (moved from Expenses.jsx)
  const generatePDF = async (reportData) => {
    // Dynamically import jsPDF
    let jsPDFClass;
    try {
      const jspdfModule = await import('jspdf');
      jsPDFClass = jspdfModule.jsPDF;
    } catch (error) {
      alert('PDF generation library not available. Please install jspdf: npm install jspdf');
      return;
    }

    const doc = new jsPDFClass();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let yPos = 20;
    const lineHeight = 7;
    const sectionSpacing = 15;
    const cardPadding = 8;

    // Helper function to add a new page if needed
    const checkPageBreak = (neededSpace = 20) => {
      if (yPos + neededSpace > pageHeight - 20) {
        doc.addPage();
        yPos = 20;
      }
    };

    // Helper function to draw a card/box
    const drawCard = (x, y, width, height) => {
      doc.setDrawColor(221, 221, 221); // #ddd
      doc.setLineWidth(0.5);
      doc.rect(x, y, width, height);
    };

    // Helper function to fill a card background
    const fillCard = (x, y, width, height, color = [245, 245, 245]) => {
      doc.setFillColor(color[0], color[1], color[2]);
      doc.rect(x, y, width, height, 'F');
      drawCard(x, y, width, height);
    };

    // Page Title - matching page design
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(51, 51, 51, 255); // #333
    doc.text('Income & Expense Report', pageWidth / 2, yPos, { align: 'center' });
    yPos += lineHeight * 2;

    // Report Period Information
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(119, 119, 119); // #777
    doc.text(`Report Type: ${reportData.reportType.toUpperCase()}`, margin, yPos);
    yPos += lineHeight;
    doc.text(`Period: ${reportData.reportPeriod}`, margin, yPos);
    yPos += lineHeight * 2;

    // Summary Cards Section - matching page design (3 cards in a row-like layout)
    checkPageBreak(50);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(51, 51, 51); // #333
    doc.text('Financial Summary', margin, yPos);
    yPos += lineHeight * 1.5;

    const summary = reportData.summary;
    const cardWidth = (pageWidth - 2 * margin - 20) / 3; // 3 cards with spacing
    const cardHeight = 25;
    let cardX = margin;

    // Card 1: Total Income
    fillCard(cardX, yPos, cardWidth, cardHeight);
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(119, 119, 119); // #777
    doc.text('Total Income', cardX + cardPadding, yPos + 5);
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(51, 122, 183); // #337ab7
    doc.text(formatCurrency(summary.totalIncome), cardX + cardPadding, yPos + 16, { maxWidth: cardWidth - cardPadding * 2 });

    // Card 2: Total Expenses
    cardX += cardWidth + 10;
    fillCard(cardX, yPos, cardWidth, cardHeight);
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(119, 119, 119); // #777
    doc.text('Total Expenses', cardX + cardPadding, yPos + 5);
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(51, 122, 183); // #337ab7
    doc.text(formatCurrency(summary.totalExpenses), cardX + cardPadding, yPos + 16, { maxWidth: cardWidth - cardPadding * 2 });

    // Card 3: Net Profit/Loss
    cardX += cardWidth + 10;
    fillCard(cardX, yPos, cardWidth, cardHeight);
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(119, 119, 119); // #777
    doc.text('Net Profit/Loss', cardX + cardPadding, yPos + 5);
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    const profitColor = summary.netProfit >= 0 ? [92, 184, 92] : [217, 83, 79]; // #5cb85c or #d9534f
    doc.setTextColor(profitColor[0], profitColor[1], profitColor[2]);
    doc.text(formatCurrency(summary.netProfit), cardX + cardPadding, yPos + 16, { maxWidth: cardWidth - cardPadding * 2 });

    yPos += cardHeight + sectionSpacing;

    // Income Details Section
    checkPageBreak(40);
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(51, 122, 183); // #337ab7
    doc.text(`Income Details (${reportData.income.count} fees collected)`, margin, yPos);
    yPos += lineHeight * 1.5;

    if (reportData.income.fees.length > 0) {
      // Table header
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(51, 51, 51); // #333
      const headerY = yPos;
      doc.text('Student Name', margin, headerY);
      doc.text('Roll No', margin + 50, headerY);
      doc.text('Class', margin + 80, headerY);
      doc.text('Amount', pageWidth - margin - 40, headerY, { align: 'right' });
      yPos += lineHeight;
      
      // Draw header line
      doc.setDrawColor(221, 221, 221); // #ddd
      doc.setLineWidth(0.5);
      doc.line(margin, yPos - 2, pageWidth - margin, yPos - 2);
      yPos += 3;

      // Table rows
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      reportData.income.fees.slice(0, 50).forEach((fee) => {
        checkPageBreak(10);
        doc.setTextColor(51, 51, 51); // #333
        doc.text(fee.student?.name || 'N/A', margin, yPos, { maxWidth: 45 });
        doc.text(fee.student?.rollNo || 'N/A', margin + 50, yPos, { maxWidth: 28 });
        doc.text(fee.student?.class || 'N/A', margin + 80, yPos, { maxWidth: 25 });
        doc.setTextColor(92, 184, 92); // #5cb85c
        doc.text(formatCurrency(fee.amount), pageWidth - margin - 40, yPos, { align: 'right', maxWidth: 40 });
        yPos += lineHeight;
      });

      if (reportData.income.fees.length > 50) {
        yPos += lineHeight;
        doc.setTextColor(119, 119, 119); // #777
        doc.text(`... and ${reportData.income.fees.length - 50} more fees`, margin, yPos);
        yPos += lineHeight;
      }
    } else {
      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(119, 119, 119); // #777
      doc.text('No fees collected in this period', margin, yPos);
      yPos += lineHeight;
    }
    yPos += sectionSpacing;

    // Employee Salary Details Section
    checkPageBreak(40);
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(51, 122, 183); // #337ab7
    doc.text(`Employee Salary Details (${reportData.expenses.salaryCount} salaries paid)`, margin, yPos);
    yPos += lineHeight * 1.5;

    if (reportData.expenses.salaries && reportData.expenses.salaries.length > 0) {
      // Table header - adjusted column positions
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(51, 51, 51); // #333
      const headerY = yPos;
      doc.text('Employee Name', margin, headerY);
      doc.text('Position', margin + 55, headerY);
      doc.text('Month', margin + 95, headerY);
      doc.text('Amount', pageWidth - margin - 35, headerY, { align: 'right' });
      yPos += lineHeight;
      
      // Draw header line
      doc.setDrawColor(221, 221, 221); // #ddd
      doc.setLineWidth(0.5);
      doc.line(margin, yPos - 2, pageWidth - margin, yPos - 2);
      yPos += 3;

      // Helper function to format month (extract just month name if it includes year)
      const formatMonth = (monthStr) => {
        if (!monthStr) return 'N/A';
        // If month contains year (e.g., "November 2025"), extract just the month
        const parts = monthStr.split(' ');
        return parts[0] || monthStr; // Return just the month name
      };

      // Table rows
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      reportData.expenses.salaries.slice(0, 50).forEach((salary) => {
        checkPageBreak(10);
        doc.setTextColor(51, 51, 51); // #333
        doc.text(salary.employee?.name || 'N/A', margin, yPos, { maxWidth: 50 });
        doc.text(salary.employee?.position || 'N/A', margin + 55, yPos, { maxWidth: 35 });
        doc.text(formatMonth(salary.month), margin + 95, yPos, { maxWidth: 30 });
        doc.setTextColor(217, 83, 79); // #d9534f (red for expenses)
        doc.text(formatCurrency(salary.amount), pageWidth - margin - 35, yPos, { align: 'right', maxWidth: 35 });
        yPos += lineHeight;
      });

      if (reportData.expenses.salaries.length > 50) {
        yPos += lineHeight;
        doc.setTextColor(119, 119, 119); // #777
        doc.text(`... and ${reportData.expenses.salaries.length - 50} more salaries`, margin, yPos);
        yPos += lineHeight;
      }
    } else {
      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(119, 119, 119); // #777
      doc.text('No salaries paid in this period', margin, yPos);
      yPos += lineHeight;
    }
    yPos += sectionSpacing;

    // Other Expense Details Section
    checkPageBreak(40);
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(51, 122, 183); // #337ab7
    doc.text(`Other Expense Details (${reportData.expenses.otherCount} items)`, margin, yPos);
    yPos += lineHeight * 1.5;

    if (reportData.expenses.otherExpenses && reportData.expenses.otherExpenses.length > 0) {
      // Table header - adjusted column positions
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(51, 51, 51); // #333
      const headerY = yPos;
      doc.text('Category', margin, headerY);
      doc.text('Description', margin + 42, headerY);
      doc.text('Month', margin + 105, headerY);
      doc.text('Amount', pageWidth - margin - 35, headerY, { align: 'right' });
      yPos += lineHeight;
      
      // Draw header line
      doc.setDrawColor(221, 221, 221); // #ddd
      doc.setLineWidth(0.5);
      doc.line(margin, yPos - 2, pageWidth - margin, yPos - 2);
      yPos += 3;

      // Helper function to format month (extract just month name if it includes year)
      const formatMonth = (monthStr) => {
        if (!monthStr) return 'N/A';
        // If month contains year (e.g., "November 2025"), extract just the month
        const parts = monthStr.split(' ');
        return parts[0] || monthStr; // Return just the month name
      };

      // Table rows
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      reportData.expenses.otherExpenses.slice(0, 50).forEach((expense) => {
        checkPageBreak(10);
        doc.setTextColor(51, 51, 51); // #333
        doc.text(expense.category || 'N/A', margin, yPos, { maxWidth: 37 });
        doc.text(expense.description || 'N/A', margin + 42, yPos, { maxWidth: 58 });
        doc.text(formatMonth(expense.month), margin + 105, yPos, { maxWidth: 30 });
        doc.setTextColor(217, 83, 79); // #d9534f (red for expenses)
        doc.text(formatCurrency(expense.amount), pageWidth - margin - 35, yPos, { align: 'right', maxWidth: 35 });
        yPos += lineHeight;
      });

      if (reportData.expenses.otherExpenses.length > 50) {
        yPos += lineHeight;
        doc.setTextColor(119, 119, 119); // #777
        doc.text(`... and ${reportData.expenses.otherExpenses.length - 50} more expenses`, margin, yPos);
        yPos += lineHeight;
      }
    } else {
      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(119, 119, 119); // #777
      doc.text('No other expenses in this period', margin, yPos);
      yPos += lineHeight;
    }
    yPos += sectionSpacing;

    // Expense Summary Section
    checkPageBreak(30);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(51, 51, 51); // #333
    doc.text('Expense Summary', margin, yPos);
    yPos += lineHeight * 1.5;

    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(51, 51, 51); // #333
    
    // Expenses breakdown summary
    doc.text(`Total Salaries Paid: ${formatCurrency(reportData.expenses.totalSalaries)}`, margin, yPos);
    yPos += lineHeight;
    doc.text(`Total Other Expenses: ${formatCurrency(reportData.expenses.totalOther)}`, margin, yPos);
    yPos += lineHeight;
    doc.setFont(undefined, 'bold');
    doc.setTextColor(51, 122, 183); // #337ab7
    doc.text(`Total Expenses: ${formatCurrency(reportData.expenses.total)}`, margin, yPos);
    yPos += lineHeight * 2;

    // Footer on all pages
    const totalPages = doc.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(119, 119, 119); // #777
      doc.text(
        `Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
      doc.text(
        `Page ${i} of ${totalPages}`,
        pageWidth - margin,
        pageHeight - 10,
        { align: 'right' }
      );
    }

    // Save PDF
    const fileName = `Income_Expense_Report_${reportData.reportType}_${reportData.reportPeriod.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pdf`;
    doc.save(fileName);
  };

  const handleGenerateReport = async () => {
    // Validate inputs based on report type
    if (reportType === 'monthly' && !reportMonth) {
      alert('Please select a month for monthly report');
      return;
    }
    if (reportType === 'yearly' && !reportYear) {
      alert('Please select a year for yearly report');
      return;
    }
    if (reportType === 'custom' && (!reportStartDate || !reportEndDate)) {
      alert('Please select start and end dates for custom report');
      return;
    }

    setGeneratingReport(true);
    try {
      const params = {
        reportType
      };

      if (reportType === 'monthly') {
        params.month = reportMonth;
      } else if (reportType === 'yearly') {
        params.year = reportYear;
      } else if (reportType === 'custom') {
        params.startDate = reportStartDate;
        params.endDate = reportEndDate;
      }

      const response = await reportService.getIncomeReport(params);
      
      if (response.success) {
        await generatePDF(response.data);
        setShowReportModal(false);
        alert('Report generated and downloaded successfully!');
      } else {
        alert('Failed to generate report');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert(error.response?.data?.message || 'Failed to generate report. Please try again.');
    } finally {
      setGeneratingReport(false);
    }
  };

  if (loading) return <Loader />;

  const totalUnpaidAmount = defaulters && defaulters.length > 0 
    ? defaulters.reduce((sum, d) => sum + (parseFloat(d.totalUnpaid) || 0), 0)
    : 0;
  const totalDefaulters = defaulters ? defaulters.length : 0;
  
  const overview = financialOverview?.data || financialOverview || {};
  const fees = overview?.fees || {};
  const salaries = overview?.salaries || {};
  
  // Calculate percentages for visual bars (with safety checks)
  const feePaymentRate = fees?.total && fees.total > 0 
    ? Math.min(100, Math.max(0, ((fees.paid?.amount || 0) / fees.total * 100))) 
    : 0;
  const salaryPaymentRate = salaries?.total && salaries.total > 0 
    ? Math.min(100, Math.max(0, ((salaries.paid?.amount || 0) / salaries.total * 100))) 
    : 0;

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
            <Link to="/reports" style={{ color: '#337ab7', textDecoration: 'none' }}>
              Reports & Analytics
            </Link>
          </li>
        </ol>
      </div>

      {/* Page Heading */}
      <div style={{ 
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ 
          fontSize: '24px',
          fontWeight: 500,
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <i className="fas fa-chart-line" style={{ color: '#337ab7' }}></i>
          Reports & Analytics
        </h1>
        {canGenerateReport && (
          <button
            onClick={() => setShowReportModal(true)}
            style={{
              color: '#fff',
              backgroundColor: '#9b59b6',
              border: '1px solid #8e44ad',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'normal',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#8e44ad'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#9b59b6'}
          >
            <i className="fas fa-file-pdf" style={{ marginRight: '5px' }}></i>
            Generate Report
          </button>
        )}
      </div>

      {/* Financial Overview Section */}
      {overview && overview.fees && overview.salaries && (
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ 
            fontSize: '18px',
            fontWeight: 500,
            margin: '0 0 15px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <i className="fas fa-chart-pie" style={{ color: '#337ab7' }}></i>
            Financial Overview
          </h2>

          {/* Overview Stats Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '15px',
            marginBottom: '20px'
          }}>
            {/* Total Students */}
            <div style={{
              padding: '15px',
              backgroundColor: '#f5f5f5',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}>
              <p style={{ fontSize: '12px', color: '#777', margin: '0 0 5px 0' }}>
                <i className="fas fa-user-graduate" style={{ marginRight: '5px' }}></i>
                Total Students
              </p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#337ab7', margin: 0 }}>
                {overview.students?.total || 0}
              </p>
            </div>

            {/* Total Employees */}
            <div style={{
              padding: '15px',
              backgroundColor: '#f5f5f5',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}>
              <p style={{ fontSize: '12px', color: '#777', margin: '0 0 5px 0' }}>
                <i className="fas fa-users" style={{ marginRight: '5px' }}></i>
                Total Employees
              </p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#337ab7', margin: 0 }}>
                {overview.employees?.total || 0}
              </p>
            </div>

            {/* Net Profit/Loss */}
            <div style={{
              padding: '15px',
              backgroundColor: '#f5f5f5',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}>
              <p style={{ fontSize: '12px', color: '#777', margin: '0 0 5px 0' }}>
                <i className="fas fa-money-bill-wave" style={{ marginRight: '5px' }}></i>
                Net Profit/Loss
              </p>
              <p style={{ 
                fontSize: '24px', 
                fontWeight: 'bold', 
                color: (overview.netProfit || 0) >= 0 ? '#5cb85c' : '#d9534f', 
                margin: 0 
              }}>
                {formatCurrency(overview.netProfit || 0)}
              </p>
            </div>
          </div>

          {/* Fee Analytics */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: '15px',
            marginBottom: '15px'
          }}>
            {/* Fee Payment Progress */}
            <div style={{
              padding: '15px',
              backgroundColor: '#f5f5f5',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}>
              <p style={{ fontSize: '12px', color: '#777', margin: '0 0 10px 0', fontWeight: 'bold' }}>
                Fee Collection Status
              </p>
              <div style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ fontSize: '11px', color: '#555' }}>Paid: {formatCurrency(fees.paid?.amount || 0)}</span>
                  <span style={{ fontSize: '11px', color: '#555' }}>{feePaymentRate.toFixed(1)}%</span>
                </div>
                <div style={{
                  width: '100%',
                  height: '20px',
                  backgroundColor: '#e0e0e0',
                  borderRadius: '10px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${feePaymentRate}%`,
                    height: '100%',
                    backgroundColor: '#5cb85c',
                    transition: 'width 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '10px',
                    fontWeight: 'bold'
                  }}>
                    {feePaymentRate.toFixed(0)}%
                  </div>
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ fontSize: '11px', color: '#555' }}>Unpaid: {formatCurrency(fees.unpaid?.amount || 0)}</span>
                  <span style={{ fontSize: '11px', color: '#555' }}>{(100 - feePaymentRate).toFixed(1)}%</span>
                </div>
                <div style={{
                  width: '100%',
                  height: '20px',
                  backgroundColor: '#e0e0e0',
                  borderRadius: '10px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${100 - feePaymentRate}%`,
                    height: '100%',
                    backgroundColor: '#d9534f',
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>
              </div>
              <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #ddd' }}>
                <p style={{ fontSize: '11px', color: '#777', margin: 0 }}>
                  Total Fees: <strong>{formatCurrency(fees.total || 0)}</strong> ({fees.count || 0} records)
                </p>
              </div>
            </div>

            {/* Salary Payment Progress */}
            <div style={{
              padding: '15px',
              backgroundColor: '#f5f5f5',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}>
              <p style={{ fontSize: '12px', color: '#777', margin: '0 0 10px 0', fontWeight: 'bold' }}>
                Salary Payment Status
              </p>
              <div style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ fontSize: '11px', color: '#555' }}>Paid: {formatCurrency(salaries.paid?.amount || 0)}</span>
                  <span style={{ fontSize: '11px', color: '#555' }}>{salaryPaymentRate.toFixed(1)}%</span>
                </div>
                <div style={{
                  width: '100%',
                  height: '20px',
                  backgroundColor: '#e0e0e0',
                  borderRadius: '10px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${salaryPaymentRate}%`,
                    height: '100%',
                    backgroundColor: '#5bc0de',
                    transition: 'width 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '10px',
                    fontWeight: 'bold'
                  }}>
                    {salaryPaymentRate.toFixed(0)}%
                  </div>
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ fontSize: '11px', color: '#555' }}>Unpaid: {formatCurrency(salaries.unpaid?.amount || 0)}</span>
                  <span style={{ fontSize: '11px', color: '#555' }}>{(100 - salaryPaymentRate).toFixed(1)}%</span>
                </div>
                <div style={{
                  width: '100%',
                  height: '20px',
                  backgroundColor: '#e0e0e0',
                  borderRadius: '10px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${100 - salaryPaymentRate}%`,
                    height: '100%',
                    backgroundColor: '#f0ad4e',
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>
              </div>
              <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #ddd' }}>
                <p style={{ fontSize: '11px', color: '#777', margin: 0 }}>
                  Total Salaries: <strong>{formatCurrency(salaries.total || 0)}</strong> ({salaries.count || 0} records)
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Reports Section */}
      <div style={{ marginBottom: '30px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '15px'
        }}>
          <h2 style={{ 
            fontSize: '18px',
            fontWeight: 500,
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <i className="fas fa-calendar-alt" style={{ color: '#337ab7' }}></i>
            Monthly Reports
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label style={{ fontSize: '12px', color: '#777', fontWeight: 'bold' }}>Select Month:</label>
            <input
              type="text"
              value={selectedMonth}
              onChange={handleMonthChange}
              placeholder="e.g., January 2025"
              style={{
                padding: '6px 12px',
                fontSize: '14px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                minWidth: '150px'
              }}
            />
            {loadingMonthly && (
              <i className="fas fa-spinner fa-spin" style={{ color: '#337ab7' }}></i>
            )}
          </div>
        </div>

        {selectedMonth && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '15px' 
          }}>
            {/* Monthly Fee Report */}
            {monthlyFeeReport && (
              <div style={{
                padding: '15px',
                backgroundColor: '#f5f5f5',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 10px 0', color: '#337ab7' }}>
                  <i className="fas fa-money-check-alt" style={{ marginRight: '5px' }}></i>
                  Monthly Fee Report ({selectedMonth})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', color: '#777' }}>Total Fees:</span>
                    <strong style={{ fontSize: '14px', color: '#337ab7' }}>
                      {formatCurrency(monthlyFeeReport.total || 0)}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', color: '#777' }}>Paid Fees:</span>
                    <strong style={{ fontSize: '14px', color: '#5cb85c' }}>
                      {formatCurrency(monthlyFeeReport.paid?.amount || 0)} ({monthlyFeeReport.paid?.count || 0})
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', color: '#777' }}>Unpaid Fees:</span>
                    <strong style={{ fontSize: '14px', color: '#d9534f' }}>
                      {formatCurrency(monthlyFeeReport.unpaid?.amount || 0)} ({monthlyFeeReport.unpaid?.count || 0})
                    </strong>
                  </div>
                </div>
              </div>
            )}

            {/* Monthly Salary Report */}
            {monthlySalaryReport && (
              <div style={{
                padding: '15px',
                backgroundColor: '#f5f5f5',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 10px 0', color: '#337ab7' }}>
                  <i className="fas fa-hand-holding-usd" style={{ marginRight: '5px' }}></i>
                  Monthly Salary Report ({selectedMonth})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', color: '#777' }}>Total Salaries:</span>
                    <strong style={{ fontSize: '14px', color: '#337ab7' }}>
                      {formatCurrency(monthlySalaryReport.total || 0)}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', color: '#777' }}>Paid Salaries:</span>
                    <strong style={{ fontSize: '14px', color: '#5bc0de' }}>
                      {formatCurrency(monthlySalaryReport.paid?.amount || 0)} ({monthlySalaryReport.paid?.count || 0})
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', color: '#777' }}>Unpaid Salaries:</span>
                    <strong style={{ fontSize: '14px', color: '#f0ad4e' }}>
                      {formatCurrency(monthlySalaryReport.unpaid?.amount || 0)} ({monthlySalaryReport.unpaid?.count || 0})
                    </strong>
                  </div>
                </div>
              </div>
            )}

            {!loadingMonthly && !monthlyFeeReport && !monthlySalaryReport && selectedMonth && (
              <div style={{
                padding: '15px',
                backgroundColor: '#fff3cd',
                border: '1px solid #faebcc',
                borderRadius: '4px',
                color: '#856404'
              }}>
                <i className="fas fa-info-circle" style={{ marginRight: '5px' }}></i>
                No data available for {selectedMonth}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Defaulters Section */}
      <div style={{ marginBottom: '30px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '15px'
        }}>
          <h2 style={{ 
            fontSize: '18px',
            fontWeight: 500,
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <i className="fas fa-exclamation-triangle" style={{ color: '#d9534f' }}></i>
            Students with Unpaid Fees (Defaulters)
          </h2>
          <div style={{
            padding: '5px 12px',
            backgroundColor: '#d9534f',
            color: '#fff',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            {totalDefaulters} {totalDefaulters === 1 ? 'Defaulter' : 'Defaulters'}
          </div>
        </div>

        {/* Defaulters Stats Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)', 
          gap: '15px',
          marginBottom: '20px'
        }}>
          <div style={{
            padding: '15px',
            backgroundColor: '#f5f5f5',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}>
            <p style={{ fontSize: '12px', color: '#777', margin: '0 0 5px 0' }}>Total Defaulters</p>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#d9534f', margin: 0 }}>
              {totalDefaulters}
            </p>
          </div>
          
          <div style={{
            padding: '15px',
            backgroundColor: '#f5f5f5',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}>
            <p style={{ fontSize: '12px', color: '#777', margin: '0 0 5px 0' }}>Total Unpaid Amount</p>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#d9534f', margin: 0 }}>
              {formatCurrency(totalUnpaidAmount)}
            </p>
          </div>
        </div>

        {/* Alert Section */}
        <div style={{
          padding: '8px 15px',
          marginBottom: '20px',
          backgroundColor: '#d9edf7',
          border: '1px solid #bce8f1',
          borderRadius: '4px',
          color: '#31708f'
        }}>
          <strong>Note!</strong> This report shows students with unpaid fees for <strong>completed months only</strong> (months that have already passed). Contact them for payment collection.
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            border: '1px solid #ddd',
            borderCollapse: 'collapse',
            backgroundColor: '#fff'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'left', whiteSpace: 'nowrap' }}>Roll No</th>
                <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'left', whiteSpace: 'nowrap' }}>Student Name</th>
                <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'left', whiteSpace: 'nowrap' }}>Class</th>
                <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'left', whiteSpace: 'nowrap' }}>Program</th>
                <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'left', whiteSpace: 'nowrap' }}>Session</th>
                <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'right', whiteSpace: 'nowrap' }}>Unpaid Fees</th>
                <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'center', whiteSpace: 'nowrap' }}>Fee Count</th>
              </tr>
            </thead>
            <tbody>
              {defaulters.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '20px', textAlign: 'center', color: '#5cb85c', fontWeight: 'bold' }}>
                    <i className="fas fa-check-circle" style={{ marginRight: '8px' }}></i>
                    No defaulters found! All fees are paid.
                  </td>
                </tr>
              ) : (
                defaulters.map(d => (
                  <tr key={d.student.id} style={{ borderLeft: '4px solid #d9534f' }}>
                    <td style={{ padding: '8px', border: '1px solid #ddd', whiteSpace: 'nowrap', fontWeight: 'bold' }}>
                      {d.student.rollNo}
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #ddd', whiteSpace: 'nowrap' }}>
                      {d.student.name}
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #ddd', whiteSpace: 'nowrap' }}>
                      {d.student.class}
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #ddd', whiteSpace: 'nowrap' }}>
                      {d.student.program || '-'}
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #ddd', whiteSpace: 'nowrap' }}>
                      {d.student.session || '-'}
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #ddd', whiteSpace: 'nowrap', textAlign: 'right', fontWeight: 'bold', color: '#d9534f' }}>
                      {formatCurrency(d.totalUnpaid)}
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #ddd', whiteSpace: 'nowrap', textAlign: 'center' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '3px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        backgroundColor: '#d9534f',
                        color: '#fff'
                      }}>
                        {d.feeCount}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Report Modal */}
      {showReportModal && (
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
                <i className="fas fa-file-pdf" style={{ marginRight: '8px', color: '#9b59b6' }}></i>
                Generate Report
              </h4>
              <button
                onClick={() => setShowReportModal(false)}
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
            <div style={{ padding: '15px' }}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Report Type: <span style={{ color: 'red' }}>*</span>
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '14px',
                    border: '1px solid #ccc',
                    borderRadius: '4px'
                  }}
                  required
                >
                  <option value="monthly">Monthly Report</option>
                  <option value="yearly">Yearly Report</option>
                  <option value="custom">Custom Date Range</option>
                </select>
              </div>

              {reportType === 'monthly' && (
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                    Month: <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={reportMonth}
                    onChange={(e) => setReportMonth(e.target.value)}
                    placeholder="e.g., January 2025"
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: '14px',
                      border: '1px solid #ccc',
                      borderRadius: '4px'
                    }}
                  />
                </div>
              )}

              {reportType === 'yearly' && (
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                    Year: <span style={{ color: 'red' }}>*</span>
                  </label>
                  <select
                    value={reportYear}
                    onChange={(e) => setReportYear(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: '14px',
                      border: '1px solid #ccc',
                      borderRadius: '4px'
                    }}
                  >
                    <option value="">Select Year</option>
                    {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i + 1).map(year => (
                      <option key={year} value={year.toString()}>{year}</option>
                    ))}
                  </select>
                </div>
              )}

              {reportType === 'custom' && (
                <>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                      Start Date: <span style={{ color: 'red' }}>*</span>
                    </label>
                    <input
                      type="date"
                      value={reportStartDate}
                      onChange={(e) => setReportStartDate(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        fontSize: '14px',
                        border: '1px solid #ccc',
                        borderRadius: '4px'
                      }}
                    />
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                      End Date: <span style={{ color: 'red' }}>*</span>
                    </label>
                    <input
                      type="date"
                      value={reportEndDate}
                      onChange={(e) => setReportEndDate(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        fontSize: '14px',
                        border: '1px solid #ccc',
                        borderRadius: '4px'
                      }}
                    />
                  </div>
                </>
              )}

              <div style={{
                padding: '10px',
                backgroundColor: '#fcf8e3',
                border: '1px solid #faebcc',
                borderRadius: '4px',
                color: '#8a6d3b',
                fontSize: '13px',
                marginTop: '15px'
              }}>
                <strong>Note:</strong> This report includes fees collected (income), salaries paid, other expenses, and calculates net profit/loss. The report will be downloaded as a PDF file.
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '15px',
              borderTop: '1px solid #e5e5e5',
              textAlign: 'right'
            }}>
              <button
                onClick={handleGenerateReport}
                disabled={generatingReport}
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  color: '#fff',
                  backgroundColor: generatingReport ? '#ccc' : '#9b59b6',
                  border: '1px solid #8e44ad',
                  borderRadius: '4px',
                  cursor: generatingReport ? 'not-allowed' : 'pointer',
                  marginRight: '5px',
                  fontWeight: 'bold'
                }}
                onMouseEnter={(e) => {
                  if (!generatingReport) e.currentTarget.style.backgroundColor = '#8e44ad';
                }}
                onMouseLeave={(e) => {
                  if (!generatingReport) e.currentTarget.style.backgroundColor = '#9b59b6';
                }}
              >
                {generatingReport ? (
                  <>
                    <i className="fas fa-spinner fa-spin" style={{ marginRight: '5px' }}></i>
                    Generating...
                  </>
                ) : (
                  <>
                    <i className="fas fa-file-pdf" style={{ marginRight: '5px' }}></i>
                    Generate & Download PDF
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                disabled={generatingReport}
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  color: '#333',
                  backgroundColor: '#fff',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  cursor: generatingReport ? 'not-allowed' : 'pointer'
                }}
                onMouseEnter={(e) => {
                  if (!generatingReport) e.currentTarget.style.backgroundColor = '#e6e6e6';
                }}
                onMouseLeave={(e) => {
                  if (!generatingReport) e.currentTarget.style.backgroundColor = '#fff';
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Reports;
