import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import reportService from '../services/reportService';
import { formatCurrency } from '../utils/currencyFormatter';
import Loader from '../components/Loader';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await reportService.getFinancialOverview();
      setStats(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching stats:', error);
      const errorMessage = error?.message || error?.error || 'Failed to load dashboard data. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  if (error) {
    return (
      <div className="h-full overflow-y-auto p-6">
        <div style={{
          padding: '20px',
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '4px',
          color: '#721c24'
        }}>
          <h2 style={{ marginTop: 0 }}>Error Loading Dashboard</h2>
          <p>{error}</p>
          <p style={{ fontSize: '12px', marginTop: '10px' }}>
            Make sure you are logged in and have the correct permissions.
          </p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="h-full overflow-y-auto p-6">
        <div style={{
          padding: '20px',
          backgroundColor: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: '4px',
          color: '#856404'
        }}>
          <h2 style={{ marginTop: 0 }}>No Data Available</h2>
          <p>No statistics to display at this time.</p>
        </div>
      </div>
    );
  }

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
            <Link to="/" style={{ color: '#337ab7', textDecoration: 'none' }}>
              Dashboard
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
          <i className="fas fa-tachometer-alt" style={{ color: '#337ab7' }}></i>
          Dashboard
        </h1>
        <p style={{ margin: '5px 0 0 0', color: '#777', fontSize: '13px' }}>
          Welcome back! Here's your overview
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: '15px',
        marginBottom: '20px'
      }}>
        {/* Students Card */}
        <div style={{
          padding: '20px',
          backgroundColor: '#f5f5f5',
          border: '1px solid #ddd',
          borderRadius: '4px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{
              width: '50px',
              height: '50px',
              backgroundColor: '#5bc0de',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <i className="fas fa-users" style={{ fontSize: '24px', color: '#fff' }}></i>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '11px', color: '#777', margin: '0 0 3px 0' }}>Total</p>
              <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#5bc0de', margin: 0 }}>
                {stats?.students?.total || 0}
              </p>
            </div>
          </div>
          <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#333', margin: '0 0 5px 0' }}>Students</h3>
          <p style={{ fontSize: '12px', color: '#5cb85c', margin: 0 }}>
            <i className="fas fa-check-circle" style={{ marginRight: '3px' }}></i>
            Active enrollment
          </p>
        </div>

        {/* Employees Card */}
        <div style={{
          padding: '20px',
          backgroundColor: '#f5f5f5',
          border: '1px solid #ddd',
          borderRadius: '4px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{
              width: '50px',
              height: '50px',
              backgroundColor: '#5cb85c',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <i className="fas fa-user-tie" style={{ fontSize: '24px', color: '#fff' }}></i>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '11px', color: '#777', margin: '0 0 3px 0' }}>Total</p>
              <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#5cb85c', margin: 0 }}>
                {stats?.employees?.total || 0}
              </p>
            </div>
          </div>
          <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#333', margin: '0 0 5px 0' }}>Employees</h3>
          <p style={{ fontSize: '12px', color: '#337ab7', margin: 0 }}>
            <i className="fas fa-briefcase" style={{ marginRight: '3px' }}></i>
            Active staff
          </p>
        </div>

        {/* Fee Collection Card */}
        <div style={{
          padding: '20px',
          backgroundColor: '#f5f5f5',
          border: '1px solid #ddd',
          borderRadius: '4px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{
              width: '50px',
              height: '50px',
              backgroundColor: '#f0ad4e',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <i className="fas fa-dollar-sign" style={{ fontSize: '24px', color: '#fff' }}></i>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '11px', color: '#777', margin: '0 0 3px 0' }}>Collected</p>
              <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#f0ad4e', margin: 0 }}>
                {formatCurrency(stats?.fees?.paid?.amount || 0)}
              </p>
            </div>
          </div>
          <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#333', margin: '0 0 5px 0' }}>Fee Collection</h3>
          <p style={{ fontSize: '12px', color: '#f0ad4e', margin: 0 }}>
            Pending: {formatCurrency(stats?.fees?.unpaid?.amount || 0)}
          </p>
        </div>

        {/* Salary Payments Card */}
        <div style={{
          padding: '20px',
          backgroundColor: '#f5f5f5',
          border: '1px solid #ddd',
          borderRadius: '4px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{
              width: '50px',
              height: '50px',
              backgroundColor: '#d9534f',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <i className="fas fa-wallet" style={{ fontSize: '24px', color: '#fff' }}></i>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '11px', color: '#777', margin: '0 0 3px 0' }}>Paid</p>
              <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#d9534f', margin: 0 }}>
                {formatCurrency(stats?.salaries?.paid?.amount || 0)}
              </p>
            </div>
          </div>
          <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#333', margin: '0 0 5px 0' }}>Salary Payments</h3>
          <p style={{ fontSize: '12px', color: '#d9534f', margin: 0 }}>
            Pending: {formatCurrency(stats?.salaries?.unpaid?.amount || 0)}
          </p>
        </div>
      </div>

      {/* Financial Summary Section */}
      <div style={{
        padding: '20px',
        backgroundColor: '#fff',
        border: '1px solid #ddd',
        borderRadius: '4px',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            backgroundColor: '#337ab7',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <i className="fas fa-chart-bar" style={{ fontSize: '20px', color: '#fff' }}></i>
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#333', margin: 0 }}>Financial Summary</h3>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: '15px'
        }}>
          {/* Total Income */}
          <div style={{
            padding: '20px',
            backgroundColor: '#dff0d8',
            border: '2px solid #d6e9c6',
            borderRadius: '4px'
          }}>
            <p style={{ 
              fontSize: '14px', 
              fontWeight: 'bold', 
              color: '#3c763d', 
              margin: '0 0 10px 0',
              display: 'flex',
              alignItems: 'center'
            }}>
              <i className="fas fa-check-circle" style={{ marginRight: '8px' }}></i>
              Total Income
            </p>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#3c763d', margin: '0 0 10px 0' }}>
              {formatCurrency(stats?.fees?.paid?.amount || 0)}
            </p>
            <p style={{ fontSize: '12px', color: '#3c763d', margin: 0 }}>From fee collections</p>
          </div>

          {/* Total Expenses */}
          <div style={{
            padding: '20px',
            backgroundColor: '#f2dede',
            border: '2px solid #ebccd1',
            borderRadius: '4px'
          }}>
            <p style={{ 
              fontSize: '14px', 
              fontWeight: 'bold', 
              color: '#a94442', 
              margin: '0 0 10px 0',
              display: 'flex',
              alignItems: 'center'
            }}>
              <i className="fas fa-times-circle" style={{ marginRight: '8px' }}></i>
              Total Expenses
            </p>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#a94442', margin: '0 0 10px 0' }}>
              {formatCurrency(stats?.salaries?.paid?.amount || 0)}
            </p>
            <p style={{ fontSize: '12px', color: '#a94442', margin: 0 }}>Salary payments</p>
          </div>

          {/* Net Profit/Loss */}
          <div style={{
            padding: '20px',
            backgroundColor: (stats?.netProfit || 0) >= 0 ? '#d9edf7' : '#fcf8e3',
            border: (stats?.netProfit || 0) >= 0 ? '2px solid #bce8f1' : '2px solid #faebcc',
            borderRadius: '4px'
          }}>
            <p style={{ 
              fontSize: '14px', 
              fontWeight: 'bold', 
              color: (stats?.netProfit || 0) >= 0 ? '#31708f' : '#8a6d3b', 
              margin: '0 0 10px 0',
              display: 'flex',
              alignItems: 'center'
            }}>
              <i className="fas fa-balance-scale" style={{ marginRight: '8px' }}></i>
              Net Profit/Loss
            </p>
            <p style={{ 
              fontSize: '32px', 
              fontWeight: 'bold', 
              color: (stats?.netProfit || 0) >= 0 ? '#31708f' : '#8a6d3b', 
              margin: '0 0 10px 0' 
            }}>
              {formatCurrency(stats?.netProfit || 0)}
            </p>
            <p style={{ 
              fontSize: '12px', 
              color: (stats?.netProfit || 0) >= 0 ? '#31708f' : '#8a6d3b', 
              margin: 0 
            }}>
              {(stats?.netProfit || 0) >= 0 ? 'Positive balance' : 'Review expenses'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
