import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import salaryService from '../services/salaryService';
import employeeService from '../services/employeeService';
import Loader from '../components/Loader';
import { formatCurrency } from '../utils/currencyFormatter';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../utils/constants';

const Salaries = () => {
  const { user } = useAuth();
  const [salaries, setSalaries] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    employeeId: '',
    amount: '',
    month: ''
  });

  const isAdmin = user?.role === ROLES.ADMIN || user?.role === ROLES.SUPER_ADMIN;

  useEffect(() => {
    fetchSalaries();
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await employeeService.getAll();
      setEmployees(response.data.employees);
    } catch (error) {
      console.error('Failed to fetch employees');
    }
  };

  const fetchSalaries = async () => {
    try {
      const response = await salaryService.getAll();
      setSalaries(response.data.salaries);
    } catch (error) {
      console.error('Failed to fetch salaries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await salaryService.update(editingId, formData);
        alert('Salary updated successfully!');
      } else {
        await salaryService.create(formData);
        alert('Salary created successfully!');
      }
      fetchSalaries();
      handleCloseModal();
    } catch (error) {
      alert(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this salary record?')) return;
    try {
      await salaryService.delete(id);
      alert('Salary deleted successfully!');
      fetchSalaries();
    } catch (error) {
      alert('Failed to delete salary');
    }
  };

  const handleEdit = (salary) => {
    setFormData({
      employeeId: salary.employeeId,
      amount: salary.amount,
      month: salary.month
    });
    setEditingId(salary.id);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      employeeId: '',
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

  const handleMarkAsPaid = async (id) => {
    if (!confirm('Mark this salary as paid?')) return;
    try {
      await salaryService.markAsPaid(id);
      alert('Salary marked as paid successfully!');
      fetchSalaries();
    } catch (error) {
      alert('Failed to mark salary as paid');
    }
  };

  if (loading) return <Loader />;

  const totalSalaries = salaries.reduce((sum, salary) => sum + parseFloat(salary.amount), 0);
  const paidSalaries = salaries.filter(s => s.paid).reduce((sum, salary) => sum + parseFloat(salary.amount), 0);
  const unpaidSalaries = totalSalaries - paidSalaries;

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
            <Link to="/salaries" style={{ color: '#337ab7', textDecoration: 'none' }}>
              Salaries
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
          <i className="fas fa-money-bill-wave" style={{ color: '#337ab7' }}></i>
          Salary Management
        </h1>
      </div>

      {/* Stats Cards */}
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
          <p style={{ fontSize: '12px', color: '#777', margin: '0 0 5px 0' }}>Total Salaries</p>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#337ab7', margin: 0 }}>
            {formatCurrency(totalSalaries)}
          </p>
        </div>
        
        <div style={{
          padding: '15px',
          backgroundColor: '#f5f5f5',
          border: '1px solid #ddd',
          borderRadius: '4px'
        }}>
          <p style={{ fontSize: '12px', color: '#777', margin: '0 0 5px 0' }}>Paid Salaries</p>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#5cb85c', margin: 0 }}>
            {formatCurrency(paidSalaries)}
          </p>
        </div>

        <div style={{
          padding: '15px',
          backgroundColor: '#f5f5f5',
          border: '1px solid #ddd',
          borderRadius: '4px'
        }}>
          <p style={{ fontSize: '12px', color: '#777', margin: '0 0 5px 0' }}>Unpaid Salaries</p>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#d9534f', margin: 0 }}>
            {formatCurrency(unpaidSalaries)}
          </p>
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
          <strong>Note!</strong> Track employee salary payments and disbursements.
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
            Add New Salary
          </button>
        )}
      </div>

      {/* Salaries Table */}
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
              <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'left', whiteSpace: 'nowrap' }}>Employee Name</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'left', whiteSpace: 'nowrap' }}>Position</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'left', whiteSpace: 'nowrap' }}>Amount</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'left', whiteSpace: 'nowrap' }}>Month</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'center', whiteSpace: 'nowrap' }}>Status</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'left', whiteSpace: 'nowrap' }}>Created Date</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'left', whiteSpace: 'nowrap' }}>Payment Info</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'center', whiteSpace: 'nowrap' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {salaries.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                  No salary records found. {isAdmin && 'Click "Add New Salary" to create one.'}
                </td>
              </tr>
            ) : (
              salaries.map((salary) => (
                <tr key={salary.id}>
                  <td style={{ padding: '8px', border: '1px solid #ddd', whiteSpace: 'nowrap' }}>
                    {salary.employee?.name || 'N/A'}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', whiteSpace: 'nowrap' }}>
                    {salary.employee?.position || 'N/A'}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', whiteSpace: 'nowrap', fontWeight: 'bold', color: '#5cb85c' }}>
                    {formatCurrency(salary.amount)}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', whiteSpace: 'nowrap' }}>
                    {salary.month}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', whiteSpace: 'nowrap' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '3px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      backgroundColor: salary.paid ? '#5cb85c' : '#d9534f',
                      color: '#fff'
                    }}>
                      {salary.paid ? 'Paid' : 'Unpaid'}
                    </span>
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', whiteSpace: 'nowrap' }}>
                    {new Date(salary.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', whiteSpace: 'nowrap', fontSize: '12px' }}>
                    {salary.paid ? (
                      <div>
                        <div><strong>Paid:</strong> {salary.paidDate ? new Date(salary.paidDate).toLocaleDateString() : 'N/A'}</div>
                        {salary.user && (
                          <div style={{ color: '#777', marginTop: '2px' }}>
                            <strong>By:</strong> {salary.user.name}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span style={{ color: '#999' }}>Not paid</span>
                    )}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', whiteSpace: 'nowrap' }}>
                    {!salary.paid && (
                      <button
                        onClick={() => handleMarkAsPaid(salary.id)}
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
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => handleEdit(salary)}
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
                        <button
                          onClick={() => handleDelete(salary.id)}
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
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Salary Modal */}
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
                {editingId ? 'Edit Salary' : 'Add New Salary'}
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
                    Employee:
                  </label>
                  <select
                    name="employeeId"
                    value={formData.employeeId}
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
                    <option value="">Select Employee</option>
                    {employees.map(employee => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name} ({employee.position})
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
    </div>
  );
};

export default Salaries;
