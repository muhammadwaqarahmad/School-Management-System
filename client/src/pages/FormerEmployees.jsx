import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import employeeService from '../services/employeeService';
import Loader from '../components/Loader';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../utils/constants';
import { formatCurrency } from '../utils/currencyFormatter';

const FormerEmployees = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formerEmployees, setFormerEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingEmployee, setViewingEmployee] = useState(null);
  const [showSalaryDetails, setShowSalaryDetails] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // 'RESIGNED', 'TERMINATED', 'RETIRED', or '' for all
  
  const isAdmin = user?.role === ROLES.ADMIN || user?.role === ROLES.SUPER_ADMIN;

  useEffect(() => {
    fetchFormerEmployees();
  }, [statusFilter]);

  const fetchFormerEmployees = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchQuery && searchQuery.trim()) {
        params.searchQuery = searchQuery.trim();
      }
      if (statusFilter) {
        params.status = statusFilter;
      }
      
      const response = await employeeService.getFormer(params);
      const employees = response.data?.employees || response.employees || [];
      setFormerEmployees(employees);
    } catch (error) {
      console.error('Failed to fetch former employees:', error);
      alert(error.response?.data?.message || 'Failed to fetch former employee records');
      setFormerEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchFormerEmployees();
  };

  const handleFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const calculateSalaryStats = (employee) => {
    if (!employee.salaries || employee.salaries.length === 0) {
      return {
        totalMonths: 0,
        paidMonths: 0,
        unpaidMonths: 0,
        totalAmount: 0,
        paidAmount: 0,
        unpaidAmount: 0,
        remainingAmount: 0
      };
    }

    const totalMonths = employee.salaries.length;
    const paidSalaries = employee.salaries.filter(s => s.paid);
    const unpaidSalaries = employee.salaries.filter(s => !s.paid);
    
    const paidMonths = paidSalaries.length;
    const unpaidMonths = unpaidSalaries.length;

    const totalAmount = employee.salaries.reduce((sum, salary) => sum + parseFloat(salary.amount || 0), 0);
    const paidAmount = paidSalaries.reduce((sum, salary) => sum + parseFloat(salary.amount || 0), 0);
    const unpaidAmount = unpaidSalaries.reduce((sum, salary) => sum + parseFloat(salary.amount || 0), 0);
    const remainingAmount = unpaidAmount;

    return {
      totalMonths,
      paidMonths,
      unpaidMonths,
      totalAmount,
      paidAmount,
      unpaidAmount,
      remainingAmount
    };
  };

  const handleRejoin = async (employee) => {
    if (!confirm(`Are you sure you want to rejoin ${employee.name}? This will change their status to ACTIVE and make their profile editable.`)) {
      return;
    }

    try {
      // Change status to ACTIVE with current date as action date
      // Format date as YYYY-MM-DD for the backend
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const actionDate = `${year}-${month}-${day}`;
      
      const response = await employeeService.changeStatus(employee.id, 'ACTIVE', 'Rejoined the school', actionDate);
      
      if (response.success) {
        alert(`${employee.name} has been successfully rejoined. You will now be redirected to the Employees page where you can edit their profile.`);
        
        // Navigate to Employees page with employee ID to open edit modal
        navigate(`/employees?rejoinId=${employee.id}`);
        
        // Refresh former employees list
        fetchFormerEmployees();
      } else {
        alert(response.message || 'Failed to rejoin employee. Please try again.');
      }
    } catch (error) {
      console.error('Failed to rejoin employee:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to rejoin employee. Please try again.';
      alert(errorMessage);
    }
  };

  const handleDelete = async (employee) => {
    if (!confirm(`Are you sure you want to permanently delete ${employee.name}? This action cannot be undone and will delete all associated records (salaries, status logs, etc.).`)) {
      return;
    }

    try {
      const response = await employeeService.delete(employee.id);
      if (response.success) {
        alert(`${employee.name} has been successfully deleted.`);
        fetchFormerEmployees();
      } else {
        alert(response.message || 'Failed to delete employee');
      }
    } catch (error) {
      console.error('Failed to delete employee:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete employee. Please try again.';
      alert(errorMessage);
    }
  };

  const viewEmployeeDetails = async (employee) => {
    try {
      const response = await employeeService.getById(employee.id);
      setViewingEmployee(response.data.employee);
      setShowViewModal(true);
      setShowSalaryDetails(false);
    } catch (error) {
      console.error('Failed to fetch employee details:', error);
      setViewingEmployee(employee);
      setShowViewModal(true);
      setShowSalaryDetails(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'RESIGNED':
        return '#5bc0de';
      case 'TERMINATED':
        return '#d9534f';
      case 'RETIRED':
        return '#5cb85c';
      default:
        return '#999';
    }
  };

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
            <Link to="/employees" style={{ color: '#337ab7', textDecoration: 'none' }}>
              Employees
            </Link>
          </li>
          <li style={{ color: '#ccc' }}>/</li>
          <li style={{ color: '#333' }}>Former Employees</li>
        </ol>
      </div>

      {/* Page Heading */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
          <h1 style={{ 
            fontSize: '24px',
            fontWeight: 500,
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <i className="fas fa-user-times" style={{ color: '#337ab7' }}></i>
            Former Employees
          </h1>
          <Link
            to="/employees"
            style={{
              padding: '6px 12px',
              backgroundColor: '#337ab7',
              color: '#fff',
              textDecoration: 'none',
              borderRadius: '4px',
              fontSize: '13px'
            }}
          >
            ← Back to Employees
          </Link>
        </div>
        <p style={{ margin: '5px 0 0 0', color: '#777', fontSize: '13px' }}>
          Former employees (Resigned, Terminated, or Retired)
        </p>
      </div>

      {/* Search and Filter Section */}
      <div style={{
        padding: '15px',
        backgroundColor: '#f9f9f9',
        border: '1px solid #ddd',
        borderRadius: '4px',
        marginBottom: '20px'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '15px', fontSize: '16px', fontWeight: 'bold' }}>
          <i className="fas fa-filter" style={{ marginRight: '8px', color: '#337ab7' }}></i>
          Search & Filter
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px auto', gap: '10px', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '12px' }}>
              Search by Registration No, NIC, or Name:
            </label>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter search query..."
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  fontSize: '14px',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '8px 20px',
                  fontSize: '14px',
                  color: '#fff',
                  backgroundColor: '#337ab7',
                  border: '1px solid #2e6da4',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#286090'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#337ab7'}
              >
                Search
              </button>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    // Clear search and refetch - will trigger fetchFormerEmployees through useEffect or manual call
                    setTimeout(() => {
                      fetchFormerEmployees();
                    }, 0);
                  }}
                  style={{
                    padding: '8px 20px',
                    fontSize: '14px',
                    color: '#333',
                    backgroundColor: '#fff',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Clear
                </button>
              )}
            </form>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '12px' }}>
              Filter by Status:
            </label>
            <select
              value={statusFilter}
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
              <option value="RESIGNED">Resigned</option>
              <option value="TERMINATED">Terminated</option>
              <option value="RETIRED">Retired</option>
            </select>
          </div>
        </div>
      </div>

      {/* Former Employees Table */}
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
              <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'left', whiteSpace: 'nowrap' }}>Reg No</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'left', whiteSpace: 'nowrap' }}>Name</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'left', whiteSpace: 'nowrap' }}>Father Name</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'left', whiteSpace: 'nowrap' }}>Position</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'left', whiteSpace: 'nowrap' }}>NIC</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'left', whiteSpace: 'nowrap' }}>Phone</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'left', whiteSpace: 'nowrap' }}>Leaving Date</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'center', whiteSpace: 'nowrap' }}>Status</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'center', whiteSpace: 'nowrap' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {formerEmployees.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                  No former employee records found.
                </td>
              </tr>
            ) : (
              formerEmployees.map((employee) => (
                <tr key={employee.id}>
                  <td style={{ padding: '8px', border: '1px solid #ddd', whiteSpace: 'nowrap' }}>{employee.registrationNo}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', whiteSpace: 'nowrap' }}>{employee.name}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', whiteSpace: 'nowrap' }}>{employee.fatherName}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', whiteSpace: 'nowrap' }}>{employee.position}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', whiteSpace: 'nowrap' }}>{employee.nic || 'N/A'}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', whiteSpace: 'nowrap' }}>{employee.phoneNumber}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', whiteSpace: 'nowrap' }}>
                    {employee.leavingDate ? new Date(employee.leavingDate).toLocaleDateString() : 'N/A'}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', whiteSpace: 'nowrap' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '3px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      backgroundColor: getStatusColor(employee.status),
                      color: '#fff'
                    }}>
                      {employee.status}
                    </span>
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', whiteSpace: 'nowrap' }}>
                    <button
                      onClick={() => viewEmployeeDetails(employee)}
                      style={{
                        backgroundColor: '#5bc0de',
                        color: '#fff',
                        border: 'none',
                        padding: '4px 8px',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        marginRight: isAdmin ? '5px' : '0'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#46b8da'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#5bc0de'}
                    >
                      View
                    </button>
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => handleRejoin(employee)}
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
                          title="Rejoin - Change status to ACTIVE and edit profile"
                        >
                          Rejoin
                        </button>
                        <button
                          onClick={() => handleDelete(employee)}
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
                          title="Delete - Permanently delete this record"
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

      {/* View Employee Profile Modal - Similar to Employees page */}
      {showViewModal && viewingEmployee && (
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
            maxWidth: '900px',
            margin: '20px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '15px',
              borderBottom: '1px solid #e5e5e5',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#f5f5f5'
            }}>
              <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 500 }}>
                <i className="fas fa-user-times" style={{ marginRight: '8px', color: '#337ab7' }}></i>
                Former Employee Profile: {viewingEmployee.name}
              </h4>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setViewingEmployee(null);
                  setShowSalaryDetails(false);
                }}
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
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Personal Information Section */}
                <div style={{
                  padding: '15px',
                  backgroundColor: '#f9f9f9',
                  borderRadius: '4px',
                  border: '1px solid #e0e0e0'
                }}>
                  <h5 style={{ margin: '0 0 15px 0', color: '#337ab7', borderBottom: '2px solid #337ab7', paddingBottom: '8px' }}>
                    <i className="fas fa-id-card" style={{ marginRight: '8px' }}></i>
                    Personal Information
                  </h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <strong style={{ color: '#555', fontSize: '12px' }}>Registration Number:</strong>
                      <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>{viewingEmployee.registrationNo}</p>
                    </div>
                    <div>
                      <strong style={{ color: '#555', fontSize: '12px' }}>Full Name:</strong>
                      <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>{viewingEmployee.name}</p>
                    </div>
                    <div>
                      <strong style={{ color: '#555', fontSize: '12px' }}>Father Name:</strong>
                      <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>{viewingEmployee.fatherName}</p>
                    </div>
                    {viewingEmployee.nic && (
                      <div>
                        <strong style={{ color: '#555', fontSize: '12px' }}>NIC:</strong>
                        <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>{viewingEmployee.nic}</p>
                      </div>
                    )}
                    {viewingEmployee.gender && (
                      <div>
                        <strong style={{ color: '#555', fontSize: '12px' }}>Gender:</strong>
                        <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>
                          {viewingEmployee.gender === 'MALE' ? 'Men' : viewingEmployee.gender === 'FEMALE' ? 'Women' : viewingEmployee.gender}
                        </p>
                      </div>
                    )}
                    {viewingEmployee.religion && (
                      <div>
                        <strong style={{ color: '#555', fontSize: '12px' }}>Religion:</strong>
                        <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>{viewingEmployee.religion}</p>
                      </div>
                    )}
                    {viewingEmployee.dateOfBirth && (
                      <div>
                        <strong style={{ color: '#555', fontSize: '12px' }}>Date of Birth:</strong>
                        <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>
                          {new Date(viewingEmployee.dateOfBirth).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Employment Information Section */}
                <div style={{
                  padding: '15px',
                  backgroundColor: '#f9f9f9',
                  borderRadius: '4px',
                  border: '1px solid #e0e0e0'
                }}>
                  <h5 style={{ margin: '0 0 15px 0', color: '#337ab7', borderBottom: '2px solid #337ab7', paddingBottom: '8px' }}>
                    <i className="fas fa-briefcase" style={{ marginRight: '8px' }}></i>
                    Employment Information
                  </h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <strong style={{ color: '#555', fontSize: '12px' }}>Position:</strong>
                      <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>{viewingEmployee.position}</p>
                    </div>
                    <div>
                      <strong style={{ color: '#555', fontSize: '12px' }}>Joining Date:</strong>
                      <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>
                        {new Date(viewingEmployee.joiningDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <strong style={{ color: '#555', fontSize: '12px' }}>Salary:</strong>
                      <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: 'bold', color: '#5cb85c' }}>
                        {formatCurrency(viewingEmployee.salary)}
                      </p>
                    </div>
                    <div>
                      <strong style={{ color: '#555', fontSize: '12px' }}>Status:</strong>
                      <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '3px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          backgroundColor: getStatusColor(viewingEmployee.status),
                          color: '#fff'
                        }}>
                          {viewingEmployee.status}
                        </span>
                      </p>
                      {viewingEmployee.leavingDate && (
                        <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#666' }}>
                          <strong>Leaving Date:</strong> {new Date(viewingEmployee.leavingDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information Section */}
              <div style={{
                marginTop: '20px',
                padding: '15px',
                backgroundColor: '#f9f9f9',
                borderRadius: '4px',
                border: '1px solid #e0e0e0'
              }}>
                <h5 style={{ margin: '0 0 15px 0', color: '#337ab7', borderBottom: '2px solid #337ab7', paddingBottom: '8px' }}>
                  <i className="fas fa-phone" style={{ marginRight: '8px' }}></i>
                  Contact Information
                </h5>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <strong style={{ color: '#555', fontSize: '12px' }}>Phone Number:</strong>
                    <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>{viewingEmployee.phoneNumber}</p>
                  </div>
                  <div>
                    <strong style={{ color: '#555', fontSize: '12px' }}>Email:</strong>
                    <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>{viewingEmployee.emailAddress || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Address Information Section */}
              <div style={{
                marginTop: '20px',
                padding: '15px',
                backgroundColor: '#f9f9f9',
                borderRadius: '4px',
                border: '1px solid #e0e0e0'
              }}>
                <h5 style={{ margin: '0 0 15px 0', color: '#337ab7', borderBottom: '2px solid #337ab7', paddingBottom: '8px' }}>
                  <i className="fas fa-map-marker-alt" style={{ marginRight: '8px' }}></i>
                  Address Information
                </h5>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <strong style={{ color: '#555', fontSize: '12px' }}>Current Address:</strong>
                    <p style={{ margin: '4px 0 0 0', fontSize: '14px', whiteSpace: 'pre-wrap' }}>
                      {viewingEmployee.currentAddress}
                    </p>
                  </div>
                  <div>
                    <strong style={{ color: '#555', fontSize: '12px' }}>Permanent Address:</strong>
                    <p style={{ margin: '4px 0 0 0', fontSize: '14px', whiteSpace: 'pre-wrap' }}>
                      {viewingEmployee.permanentAddress}
                    </p>
                  </div>
                </div>
              </div>

              {/* Salary Statistics Section */}
              {(() => {
                const salaryStats = calculateSalaryStats(viewingEmployee);
                return (
                  <div style={{
                    marginTop: '20px',
                    padding: '15px',
                    backgroundColor: '#fff3cd',
                    borderRadius: '4px',
                    border: '2px solid #ffc107'
                  }}>
                    <h5 style={{ margin: '0 0 15px 0', color: '#856404', borderBottom: '2px solid #ffc107', paddingBottom: '8px' }}>
                      <i className="fas fa-money-bill-wave" style={{ marginRight: '8px' }}></i>
                      Salary Statistics
                    </h5>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                      <div>
                        <strong style={{ color: '#555', fontSize: '12px' }}>Total Months:</strong>
                        <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: 'bold', color: '#337ab7' }}>
                          {salaryStats.totalMonths}
                        </p>
                      </div>
                      <div>
                        <strong style={{ color: '#555', fontSize: '12px' }}>Paid Months:</strong>
                        <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: 'bold', color: '#5cb85c' }}>
                          {salaryStats.paidMonths}
                        </p>
                      </div>
                      <div>
                        <strong style={{ color: '#555', fontSize: '12px' }}>Total Paid Amount:</strong>
                        <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: 'bold', color: '#5cb85c' }}>
                          {formatCurrency(salaryStats.paidAmount)}
                        </p>
                      </div>
                      <div>
                        <strong style={{ color: '#555', fontSize: '12px' }}>Unpaid Months:</strong>
                        <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: 'bold', color: '#d9534f' }}>
                          {salaryStats.unpaidMonths}
                        </p>
                      </div>
                      <div>
                        <strong style={{ color: '#555', fontSize: '12px' }}>Total Unpaid Amount:</strong>
                        <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: 'bold', color: '#d9534f' }}>
                          {formatCurrency(salaryStats.unpaidAmount)}
                        </p>
                      </div>
                      <div>
                        <strong style={{ color: '#555', fontSize: '12px' }}>Total Remaining Amount:</strong>
                        <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: 'bold', color: '#f0ad4e' }}>
                          {formatCurrency(salaryStats.remainingAmount)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Button to Show/Hide Salary Details */}
              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={() => setShowSalaryDetails(!showSalaryDetails)}
                  style={{
                    padding: '10px 20px',
                    fontSize: '14px',
                    color: '#fff',
                    backgroundColor: showSalaryDetails ? '#d9534f' : '#337ab7',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = showSalaryDetails ? '#c9302c' : '#286090'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = showSalaryDetails ? '#d9534f' : '#337ab7'}
                >
                  <i className={`fas ${showSalaryDetails ? 'fa-eye-slash' : 'fa-eye'}`} style={{ marginRight: '8px' }}></i>
                  {showSalaryDetails ? 'Hide Salary Details' : 'Show Salary Details'}
                </button>
              </div>

              {/* Monthly Salary Details Section */}
              {showSalaryDetails && viewingEmployee.salaries && viewingEmployee.salaries.length > 0 && (() => {
                const sortedSalaries = [...viewingEmployee.salaries].sort((a, b) => {
                  const dateA = new Date(a.createdAt);
                  const dateB = new Date(b.createdAt);
                  return dateB - dateA;
                });

                return (
                  <div style={{
                    marginTop: '20px',
                    padding: '15px',
                    backgroundColor: '#fff',
                    borderRadius: '4px',
                    border: '2px solid #337ab7'
                  }}>
                    <h5 style={{ margin: '0 0 15px 0', color: '#337ab7', borderBottom: '2px solid #337ab7', paddingBottom: '8px' }}>
                      <i className="fas fa-calendar-check" style={{ marginRight: '8px' }}></i>
                      Monthly Salary Details
                    </h5>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontSize: '13px',
                        backgroundColor: '#fff'
                      }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f5f5f5' }}>
                            <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left', fontWeight: 'bold' }}>Month</th>
                            <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'right', fontWeight: 'bold' }}>Amount</th>
                            <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 'bold' }}>Status</th>
                            <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left', fontWeight: 'bold' }}>Created Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedSalaries.map((salary) => (
                            <tr key={salary.id}>
                              <td style={{ padding: '10px', border: '1px solid #ddd', fontWeight: '500' }}>
                                {salary.month}
                              </td>
                              <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'right', fontWeight: '500' }}>
                                {formatCurrency(salary.amount)}
                              </td>
                              <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                                <span style={{
                                  padding: '4px 10px',
                                  borderRadius: '4px',
                                  fontSize: '11px',
                                  fontWeight: 'bold',
                                  backgroundColor: salary.paid ? '#d4edda' : '#fff3cd',
                                  color: salary.paid ? '#155724' : '#856404',
                                  display: 'inline-block'
                                }}>
                                  {salary.paid ? '✓ Paid' : '⏳ Pending'}
                                </span>
                              </td>
                              <td style={{ padding: '10px', border: '1px solid #ddd', fontSize: '12px' }}>
                                {new Date(salary.createdAt).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '15px',
              borderTop: '1px solid #e5e5e5',
              textAlign: 'right',
              backgroundColor: '#f5f5f5'
            }}>
              <button
                type="button"
                onClick={() => {
                  setShowViewModal(false);
                  setViewingEmployee(null);
                  setShowSalaryDetails(false);
                }}
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
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormerEmployees;

