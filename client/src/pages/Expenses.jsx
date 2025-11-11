import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import expenseService from '../services/expenseService';
import Loader from '../components/Loader';
import { formatCurrency } from '../utils/currencyFormatter';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../utils/constants';

// Import jsPDF dynamically in the component
// Note: Run 'npm install jspdf' in client directory if not installed

const Expenses = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [summary, setSummary] = useState(null);
  const [formData, setFormData] = useState({
    category: '',
    description: '',
    amount: '',
    month: '',
    paid: false
  });
  const [editingId, setEditingId] = useState(null);

  const isAdmin = user?.role === ROLES.ADMIN || user?.role === ROLES.SUPER_ADMIN;
  const isAccountant = user?.role === ROLES.ACCOUNTANT;
  const canGenerateReport = isAdmin || isAccountant;

  useEffect(() => {
    fetchExpenses();
    setCurrentMonth();
  }, []);

  const setCurrentMonth = () => {
    const date = new Date();
    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];
    const currentMonth = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
    setFormData(prev => ({ ...prev, month: currentMonth }));
  };

  const fetchExpenses = async () => {
    try {
      const response = await expenseService.getAll();
      setExpenses(response.data?.expenses || []);
      // The API returns summary with nested structure, but we need flat structure
      const apiSummary = response.data?.summary || null;
      if (apiSummary) {
        setSummary({
          total: apiSummary.total?.amount || 0,
          paid: apiSummary.paid?.amount || 0,
          unpaid: apiSummary.unpaid?.amount || 0
        });
      } else {
        setSummary(null);
      }
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await expenseService.update(editingId, formData);
        alert('Expense updated successfully!');
      } else {
        await expenseService.create(formData);
        alert('Expense created successfully!');
      }
      fetchExpenses();
      handleCloseModal();
    } catch (error) {
      alert(error.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    try {
      await expenseService.delete(id);
      alert('Expense deleted successfully!');
      fetchExpenses();
    } catch (error) {
      alert('Failed to delete expense');
    }
  };

  const handleEdit = (expense) => {
    setFormData({
      category: expense.category,
      description: expense.description,
      amount: expense.amount,
      month: expense.month,
      paid: expense.paid
    });
    setEditingId(expense.id);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setCurrentMonth();
    setFormData({
      category: '',
      description: '',
      amount: '',
      month: '',
      paid: false
    });
  };

  const handleMarkAsPaid = async (id) => {
    if (!confirm('Mark this expense as paid?')) return;
    try {
      await expenseService.markAsPaid(id);
      alert('Expense marked as paid successfully!');
      fetchExpenses();
    } catch (error) {
      alert('Failed to mark expense as paid');
    }
  };


  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const categories = [
    'Salary',
    'Bills',
    'Maintenance',
    'Utilities',
    'Supplies',
    'Equipment',
    'Transportation',
    'Marketing',
    'Other'
  ];

  if (loading) return <Loader />;

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
            <Link to="/expenses" style={{ color: '#337ab7', textDecoration: 'none' }}>
              Expenses
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
          <i className="fas fa-file-invoice-dollar" style={{ color: '#337ab7' }}></i>
          Expense Management
        </h1>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: '15px',
          marginBottom: '20px'
        }}>
          <div style={{
            padding: '15px',
            backgroundColor: '#f5f5f5',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}>
            <p style={{ fontSize: '12px', color: '#777', margin: '0 0 5px 0' }}>Total Expenses</p>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#337ab7', margin: 0 }}>
              {formatCurrency(summary.total)}
            </p>
          </div>
          
          <div style={{
            padding: '15px',
            backgroundColor: '#f5f5f5',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}>
            <p style={{ fontSize: '12px', color: '#777', margin: '0 0 5px 0' }}>Paid Expenses</p>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#5cb85c', margin: 0 }}>
              {formatCurrency(summary.paid)}
            </p>
          </div>

          <div style={{
            padding: '15px',
            backgroundColor: '#f5f5f5',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}>
            <p style={{ fontSize: '12px', color: '#777', margin: '0 0 5px 0' }}>Unpaid Expenses</p>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#d9534f', margin: 0 }}>
              {formatCurrency(summary.unpaid)}
            </p>
          </div>
        </div>
      )}

      {/* Alert with Buttons */}
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
          <strong>Note!</strong> Track all business expenses including salaries and bills.
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
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
              Add Expense
            </button>
          )}
        </div>
      </div>

      {/* Expenses Table */}
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
              <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'left', whiteSpace: 'nowrap' }}>Category</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'left', whiteSpace: 'nowrap' }}>Description</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'left', whiteSpace: 'nowrap' }}>Amount</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'left', whiteSpace: 'nowrap' }}>Month</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'center', whiteSpace: 'nowrap' }}>Status</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'left', whiteSpace: 'nowrap' }}>Employee</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'left', whiteSpace: 'nowrap' }}>Created By</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'left', whiteSpace: 'nowrap' }}>Date</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'center', whiteSpace: 'nowrap' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                  No expense records found. Click "Add Expense" to create one.
                </td>
              </tr>
            ) : (
              expenses.map((expense) => (
                <tr key={expense.id}>
                  <td style={{ padding: '8px', border: '1px solid #ddd', whiteSpace: 'nowrap' }}>
                    <span style={{
                      padding: '2px 6px',
                      borderRadius: '3px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      backgroundColor: expense.category === 'Salary' ? '#5bc0de' : '#f0ad4e',
                      color: '#fff'
                    }}>
                      {expense.category}
                    </span>
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', whiteSpace: 'nowrap' }}>
                    {expense.description}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', whiteSpace: 'nowrap', fontWeight: 'bold', color: '#5cb85c' }}>
                    {formatCurrency(expense.amount)}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', whiteSpace: 'nowrap' }}>
                    {expense.month}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', whiteSpace: 'nowrap' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '3px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      backgroundColor: expense.paid ? '#5cb85c' : '#d9534f',
                      color: '#fff'
                    }}>
                      {expense.paid ? 'Paid' : 'Unpaid'}
                    </span>
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', whiteSpace: 'nowrap' }}>
                    {expense.salary?.employee ? (
                      <div>
                        <div style={{ fontWeight: 'bold' }}>{expense.salary.employee.name}</div>
                        <div style={{ fontSize: '11px', color: '#777' }}>{expense.salary.employee.position}</div>
                      </div>
                    ) : '-'}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', whiteSpace: 'nowrap' }}>
                    {expense.user?.name || 'N/A'}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', whiteSpace: 'nowrap' }}>
                    {new Date(expense.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', whiteSpace: 'nowrap' }}>
                    {!expense.salaryId && (
                      <button
                        onClick={() => handleEdit(expense)}
                        style={{
                          backgroundColor: '#337ab7',
                          color: '#fff',
                          border: 'none',
                          padding: '4px 8px',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          marginRight: '5px'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#286090'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#337ab7'}
                      >
                        Edit
                      </button>
                    )}
                    {!expense.paid && (
                      <button
                        onClick={() => handleMarkAsPaid(expense.id)}
                        style={{
                          backgroundColor: '#5cb85c',
                          color: '#fff',
                          border: 'none',
                          padding: '4px 8px',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          marginRight: '5px'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#449d44'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#5cb85c'}
                      >
                        Mark Paid
                      </button>
                    )}
                    {!expense.salaryId && (
                      <button
                        onClick={() => handleDelete(expense.id)}
                        style={{
                          backgroundColor: '#d9534f',
                          color: '#fff',
                          border: 'none',
                          padding: '4px 8px',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#c9302c'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#d9534f'}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Expense Modal */}
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
                {editingId ? 'Edit Expense' : 'Add New Expense'}
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
                    Category:
                  </label>
                  <select
                    name="category"
                    value={formData.category}
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
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Description:
                  </label>
                  <input
                    type="text"
                    name="description"
                    value={formData.description}
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
                    type="text"
                    name="month"
                    value={formData.month}
                    onChange={handleChange}
                    required
                    placeholder="e.g., January 2025"
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

    </div>
  );
};

export default Expenses;