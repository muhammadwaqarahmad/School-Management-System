import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import employeeService from '../services/employeeService';
import Loader from '../components/Loader';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../utils/constants';
import { formatCurrency } from '../utils/currencyFormatter';

const Employees = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const rejoinId = searchParams.get('rejoinId');
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingEmployee, setViewingEmployee] = useState(null);
  const [showSalaryDetails, setShowSalaryDetails] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState(''); // 'RESIGNED', 'TERMINATED', or 'RETIRED'
  const [actionDescription, setActionDescription] = useState('');
  const [actionDay, setActionDay] = useState('');
  const [actionMonth, setActionMonth] = useState('');
  const [actionYear, setActionYear] = useState('');
  const [formData, setFormData] = useState({
    registrationNo: '',
    name: '',
    fatherName: '',
    position: '',
    positionType: '', // 'ADMINISTRATIVE', 'TEACHING_STAFF', 'OTHERS'
    customPosition: '', // Custom position text when 'OTHERS' is selected
    phoneNumber: '',
    joiningDate: '',
    salary: '',
    emailAddress: '',
    currentAddress: '',
    permanentAddress: '',
    nic: '',
    gender: '',
    religion: '',
    dateOfBirth: '',
    status: 'ACTIVE'
  });
  const [editingId, setEditingId] = useState(null);
  
  // Only ADMIN and SUPER_ADMIN can manage employees
  const isAdmin = user?.role === ROLES.ADMIN || user?.role === ROLES.SUPER_ADMIN;
  const isAccountant = user?.role === ROLES.ACCOUNTANT;

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Handle rejoinId - open edit modal for rejoined employee
  useEffect(() => {
    const handleRejoinEdit = async () => {
      if (rejoinId) {
        try {
          const response = await employeeService.getById(parseInt(rejoinId));
          const employee = response.data.employee;
          
          // Determine position type based on existing position value
          let positionType = '';
          let customPosition = '';
          const existingPosition = employee.position || '';
          
          if (existingPosition.toLowerCase() === 'administrative' || existingPosition.toLowerCase().includes('administrative')) {
            positionType = 'ADMINISTRATIVE';
            customPosition = '';
          } else if (existingPosition.toLowerCase() === 'teaching staff' || existingPosition.toLowerCase().includes('teaching')) {
            positionType = 'TEACHING_STAFF';
            customPosition = '';
          } else if (existingPosition) {
            // If position doesn't match predefined options, treat as "Others"
            positionType = 'OTHERS';
            customPosition = existingPosition;
          }
          
          // Prepare edit data
          setFormData({
            registrationNo: employee.registrationNo,
            name: employee.name,
            fatherName: employee.fatherName,
            position: employee.position,
            positionType: positionType,
            customPosition: customPosition,
            phoneNumber: employee.phoneNumber,
            joiningDate: employee.joiningDate ? employee.joiningDate.split('T')[0] : '',
            salary: employee.salary,
            emailAddress: employee.emailAddress,
            currentAddress: employee.currentAddress,
            permanentAddress: employee.permanentAddress,
            nic: employee.nic || '',
            gender: employee.gender || '',
            religion: employee.religion || '',
            dateOfBirth: employee.dateOfBirth ? employee.dateOfBirth.split('T')[0] : '',
            status: employee.status || 'ACTIVE'
          });
          
          setEditingId(employee.id);
          setShowModal(true);
          
          // Remove rejoinId from URL
          const newParams = new URLSearchParams(searchParams);
          newParams.delete('rejoinId');
          setSearchParams(newParams, { replace: true });
        } catch (error) {
          console.error('Failed to load employee for edit:', error);
          alert('Failed to load employee information. Please try again.');
          // Remove rejoinId from URL even on error
          const newParams = new URLSearchParams(searchParams);
          newParams.delete('rejoinId');
          setSearchParams(newParams, { replace: true });
        }
      }
    };

    handleRejoinEdit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rejoinId]);

  const fetchEmployees = async () => {
    try {
      const response = await employeeService.getAll();
      // Filter to show only ACTIVE employees on main page
      const activeEmployees = (response.data.employees || []).filter(
        emp => !emp.status || emp.status === 'ACTIVE'
      );
      setEmployees(activeEmployees);
    } catch (error) {
      alert(error.message || 'Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Determine final position value based on positionType
      let finalPosition = '';
      if (formData.positionType === 'ADMINISTRATIVE') {
        finalPosition = 'Administrative';
      } else if (formData.positionType === 'TEACHING_STAFF') {
        finalPosition = 'Teaching Staff';
      } else if (formData.positionType === 'OTHERS') {
        finalPosition = formData.customPosition.trim();
        if (!finalPosition) {
          alert('Please enter a custom position when selecting "Others".');
          return;
        }
      } else {
        alert('Please select a position type.');
        return;
      }

      const submitData = {
        ...formData,
        position: finalPosition
      };

      if (editingId) {
        await employeeService.update(editingId, submitData);
        alert('Employee updated successfully!');
      } else {
        await employeeService.create(submitData);
        alert('Employee created successfully!');
      }
      fetchEmployees();
      handleCloseModal();
    } catch (error) {
      alert(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this employee? This action cannot be undone and will delete all associated records (salaries, etc.).')) {
      return;
    }
    
    try {
      const response = await employeeService.delete(id);
      if (response.success) {
        alert('Employee deleted successfully!');
        fetchEmployees();
      } else {
        alert(response.message || 'Failed to delete employee');
      }
    } catch (error) {
      console.error('Delete employee error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete employee. Please try again.';
      alert(errorMessage);
    }
  };

  const handleEdit = (employee) => {
    // Determine position type based on existing position value
    let positionType = '';
    let customPosition = '';
    const existingPosition = employee.position || '';
    
    if (existingPosition.toLowerCase() === 'administrative' || existingPosition.toLowerCase().includes('administrative')) {
      positionType = 'ADMINISTRATIVE';
      customPosition = '';
    } else if (existingPosition.toLowerCase() === 'teaching staff' || existingPosition.toLowerCase().includes('teaching')) {
      positionType = 'TEACHING_STAFF';
      customPosition = '';
    } else if (existingPosition) {
      // If position doesn't match predefined options, treat as "Others"
      positionType = 'OTHERS';
      customPosition = existingPosition;
    }
    
    setFormData({
      registrationNo: employee.registrationNo,
      name: employee.name,
      fatherName: employee.fatherName,
      position: employee.position,
      positionType: positionType,
      customPosition: customPosition,
      phoneNumber: employee.phoneNumber,
      joiningDate: employee.joiningDate ? employee.joiningDate.split('T')[0] : '',
      salary: employee.salary,
      emailAddress: employee.emailAddress,
      currentAddress: employee.currentAddress,
      permanentAddress: employee.permanentAddress,
      nic: employee.nic || '',
      gender: employee.gender || '',
      religion: employee.religion || '',
      dateOfBirth: employee.dateOfBirth ? employee.dateOfBirth.split('T')[0] : '',
      status: employee.status || 'ACTIVE'
    });
    setEditingId(employee.id);
    setShowModal(true);
  };

  // Calculate salary statistics for an employee
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

    // Calculate amounts
    const totalAmount = employee.salaries.reduce((sum, sal) => sum + parseFloat(sal.amount || 0), 0);
    const paidAmount = paidSalaries.reduce((sum, sal) => sum + parseFloat(sal.amount || 0), 0);
    const unpaidAmount = unpaidSalaries.reduce((sum, sal) => sum + parseFloat(sal.amount || 0), 0);
    const remainingAmount = unpaidAmount; // Remaining = unpaid amount

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

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      alert('Please enter a search query');
      return;
    }

    try {
      setIsSearching(true);
      const response = await employeeService.search(searchQuery.trim());
      if (response.success && response.data) {
        setSearchResults(response.data.employees || []);
        if (response.data.employees.length === 0) {
          alert('No employees found matching your search.');
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('Failed to search employees. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    fetchEmployees();
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

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      registrationNo: '',
      name: '',
      fatherName: '',
      position: '',
      positionType: '',
      customPosition: '',
      phoneNumber: '',
      joiningDate: '',
      salary: '',
      emailAddress: '',
      currentAddress: '',
      permanentAddress: '',
      nic: '',
      gender: '',
      religion: '',
      dateOfBirth: '',
      status: 'ACTIVE'
    });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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
          <i className="fas fa-briefcase" style={{ color: '#337ab7' }}></i>
          Employee Management
        </h1>
      </div>

      {/* Search Section */}
      <div style={{
        padding: '15px',
        backgroundColor: '#f9f9f9',
        border: '1px solid #ddd',
        borderRadius: '4px',
        marginBottom: '20px'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '10px', fontSize: '16px', fontWeight: 'bold' }}>
          <i className="fas fa-search" style={{ marginRight: '8px', color: '#337ab7' }}></i>
          Search Employee
        </h3>
        <p style={{ fontSize: '12px', color: '#777', margin: '0 0 10px 0' }}>
          Search by Registration Number, NIC, or Name
        </p>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter registration number, NIC, or name..."
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
            disabled={isSearching}
            style={{
              padding: '8px 20px',
              fontSize: '14px',
              color: '#fff',
              backgroundColor: '#337ab7',
              border: '1px solid #2e6da4',
              borderRadius: '4px',
              cursor: isSearching ? 'not-allowed' : 'pointer',
              opacity: isSearching ? 0.6 : 1
            }}
            onMouseEnter={(e) => !isSearching && (e.currentTarget.style.backgroundColor = '#286090')}
            onMouseLeave={(e) => !isSearching && (e.currentTarget.style.backgroundColor = '#337ab7')}
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
          {searchResults.length > 0 && (
            <button
              type="button"
              onClick={clearSearch}
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

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div style={{
          padding: '15px',
          backgroundColor: '#fff',
          border: '2px solid #337ab7',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '15px', fontSize: '16px', fontWeight: 'bold' }}>
            Search Results ({searchResults.length} found)
          </h3>
          <div style={{ display: 'grid', gap: '15px' }}>
            {searchResults.map((employee) => (
              <div
                key={employee.id}
                style={{
                  padding: '15px',
                  backgroundColor: '#f9f9f9',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
                onClick={() => viewEmployeeDetails(employee)}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: '0 0 5px 0', fontSize: '16px', fontWeight: 'bold' }}>
                      {employee.name}
                    </h4>
                    <p style={{ margin: '2px 0', fontSize: '13px', color: '#666' }}>
                      <strong>Reg No:</strong> {employee.registrationNo} |
                      {employee.nic && <><strong> NIC:</strong> {employee.nic}</>}
                    </p>
                    <p style={{ margin: '2px 0', fontSize: '13px', color: '#666' }}>
                      <strong>Position:</strong> {employee.position} | 
                      <strong> Phone:</strong> {employee.phoneNumber}
                    </p>
                  </div>
                  <i className="fas fa-chevron-right" style={{ color: '#337ab7', fontSize: '18px' }}></i>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alert with Add Button */}
      <div style={{
        padding: '8px 15px',
        marginBottom: '20px',
        backgroundColor: isAccountant ? '#fcf8e3' : '#d9edf7',
        border: isAccountant ? '1px solid #faebcc' : '1px solid #bce8f1',
        borderRadius: '4px',
        color: isAccountant ? '#8a6d3b' : '#31708f',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <strong>Note!</strong> {isAccountant 
            ? 'You have read-only access to employee records.'
            : 'Manage all employee records and information.'}
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
            Add New Employee
          </button>
        )}
      </div>

      {/* Employees Table */}
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
              <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'left', whiteSpace: 'nowrap' }}>Phone</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'left', whiteSpace: 'nowrap' }}>Email</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'left', whiteSpace: 'nowrap' }}>Joining Date</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'left', whiteSpace: 'nowrap' }}>Salary</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'center', whiteSpace: 'nowrap' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                  No employees found. {isAdmin && 'Click "Add New Employee" to create one.'}
                </td>
              </tr>
            ) : (
              employees.map((employee) => (
                <tr key={employee.id}>
                  <td style={{ padding: '8px', border: '1px solid #ddd', whiteSpace: 'nowrap' }}>{employee.registrationNo}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', whiteSpace: 'nowrap' }}>{employee.name}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', whiteSpace: 'nowrap' }}>{employee.fatherName}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', whiteSpace: 'nowrap' }}>{employee.position}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', whiteSpace: 'nowrap' }}>{employee.phoneNumber}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', whiteSpace: 'nowrap' }}>{employee.emailAddress}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', whiteSpace: 'nowrap' }}>
                    {new Date(employee.joiningDate).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', whiteSpace: 'nowrap' }}>
                    {formatCurrency(employee.salary)}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', whiteSpace: 'nowrap' }}>
                    <button
                      onClick={async () => {
                        // Fetch full employee data with salaries
                        try {
                          const response = await employeeService.getById(employee.id);
                          setViewingEmployee(response.data.employee);
                          setShowViewModal(true);
                          setShowSalaryDetails(false); // Reset to hidden
                        } catch (error) {
                          console.error('Failed to fetch employee details:', error);
                          setViewingEmployee(employee);
                          setShowViewModal(true);
                          setShowSalaryDetails(false);
                        }
                      }}
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
                          onClick={() => handleEdit(employee)}
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
                          onClick={() => handleDelete(employee.id)}
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

      {/* Add/Edit Employee Modal */}
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
            maxWidth: '700px',
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
                {editingId ? 'Edit Employee' : 'Add New Employee'}
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
              <div style={{ padding: '15px', maxHeight: '500px', overflowY: 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      Registration No:
                    </label>
                    <input
                      type="text"
                      name="registrationNo"
                      value={formData.registrationNo}
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

                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      Name:
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
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

                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      Father Name:
                    </label>
                    <input
                      type="text"
                      name="fatherName"
                      value={formData.fatherName}
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

                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      NIC:
                    </label>
                    <input
                      type="text"
                      name="nic"
                      value={formData.nic}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '6px 12px',
                        fontSize: '14px',
                        border: '1px solid #ccc',
                        borderRadius: '4px'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      Position Type: <span style={{ color: 'red' }}>*</span>
                    </label>
                    <select
                      name="positionType"
                      value={formData.positionType}
                      onChange={(e) => {
                        const newType = e.target.value;
                        setFormData({
                          ...formData,
                          positionType: newType,
                          customPosition: newType !== 'OTHERS' ? '' : formData.customPosition
                        });
                      }}
                      required
                      style={{
                        width: '100%',
                        padding: '6px 12px',
                        fontSize: '14px',
                        border: '1px solid #ccc',
                        borderRadius: '4px'
                      }}
                    >
                      <option value="">Select Position Type</option>
                      <option value="ADMINISTRATIVE">Administrative</option>
                      <option value="TEACHING_STAFF">Teaching Staff</option>
                      <option value="OTHERS">Others</option>
                    </select>
                  </div>

                  {formData.positionType === 'OTHERS' && (
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                        Custom Position: <span style={{ color: 'red' }}>*</span>
                      </label>
                      <input
                        type="text"
                        name="customPosition"
                        value={formData.customPosition}
                        onChange={handleChange}
                        required
                        placeholder="e.g., Security, Maintenance, etc."
                        style={{
                          width: '100%',
                          padding: '6px 12px',
                          fontSize: '14px',
                          border: '1px solid #ccc',
                          borderRadius: '4px'
                        }}
                      />
                    </div>
                  )}

                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      Phone Number:
                    </label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
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

                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      Email Address:
                    </label>
                    <input
                      type="email"
                      name="emailAddress"
                      value={formData.emailAddress}
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

                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      Gender:
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '6px 12px',
                        fontSize: '14px',
                        border: '1px solid #ccc',
                        borderRadius: '4px'
                      }}
                    >
                      <option value="">Select Gender</option>
                      <option value="MALE">Men</option>
                      <option value="FEMALE">Women</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      Religion:
                    </label>
                    <input
                      type="text"
                      name="religion"
                      value={formData.religion}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '6px 12px',
                        fontSize: '14px',
                        border: '1px solid #ccc',
                        borderRadius: '4px'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      Date of Birth:
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        name="dateOfBirth"
                        readOnly
                        value={formData.dateOfBirth ? (() => {
                          const date = new Date(formData.dateOfBirth);
                          const day = date.getUTCDate().toString().padStart(2, '0');
                          const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
                          const year = date.getUTCFullYear();
                          return `${day}/${month}/${year}`;
                        })() : ''}
                        placeholder="DD/MM/YYYY"
                        style={{
                          width: '100%',
                          padding: '6px 35px 6px 12px',
                          fontSize: '14px',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          backgroundColor: '#fff'
                        }}
                        onClick={(e) => {
                          e.target.nextElementSibling?.showPicker?.();
                        }}
                      />
                      <input
                        type="date"
                        value={formData.dateOfBirth || ''}
                        style={{
                          position: 'absolute',
                          right: '0',
                          top: '0',
                          width: '100%',
                          height: '100%',
                          opacity: 0,
                          cursor: 'pointer',
                          zIndex: 1
                        }}
                        onChange={(e) => {
                          if (e.target.value) {
                            setFormData({ ...formData, dateOfBirth: e.target.value });
                          }
                        }}
                      />
                      <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#666', fontSize: '14px', zIndex: 0 }}>📅</span>
                    </div>
                  </div>

                  {editingId && (
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                        Status:
                      </label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        style={{
                          width: '100%',
                          padding: '6px 12px',
                          fontSize: '14px',
                          border: '1px solid #ccc',
                          borderRadius: '4px'
                        }}
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="RESIGNED">Resigned</option>
                        <option value="TERMINATED">Terminated</option>
                        <option value="RETIRED">Retired</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      Joining Date: <span style={{ color: 'red' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        name="joiningDate"
                        readOnly
                        value={formData.joiningDate ? (() => {
                          const date = new Date(formData.joiningDate);
                          const day = date.getUTCDate().toString().padStart(2, '0');
                          const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
                          const year = date.getUTCFullYear();
                          return `${day}/${month}/${year}`;
                        })() : ''}
                        placeholder="DD/MM/YYYY"
                        required
                        style={{
                          width: '100%',
                          padding: '6px 35px 6px 12px',
                          fontSize: '14px',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          backgroundColor: '#fff'
                        }}
                        onClick={(e) => {
                          e.target.nextElementSibling?.showPicker?.();
                        }}
                      />
                      <input
                        type="date"
                        value={formData.joiningDate || ''}
                        style={{
                          position: 'absolute',
                          right: '0',
                          top: '0',
                          width: '100%',
                          height: '100%',
                          opacity: 0,
                          cursor: 'pointer',
                          zIndex: 1
                        }}
                        onChange={(e) => {
                          if (e.target.value) {
                            setFormData({ ...formData, joiningDate: e.target.value });
                          }
                        }}
                        required
                      />
                      <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#666', fontSize: '14px', zIndex: 0 }}>📅</span>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      Salary:
                    </label>
                    <input
                      type="number"
                      name="salary"
                      value={formData.salary}
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
                </div>

                <div style={{ marginTop: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Current Address:
                  </label>
                  <textarea
                    name="currentAddress"
                    value={formData.currentAddress}
                    onChange={handleChange}
                    required
                    rows="3"
                    style={{
                      width: '100%',
                      padding: '6px 12px',
                      fontSize: '14px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div style={{ marginTop: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Permanent Address:
                  </label>
                  <textarea
                    name="permanentAddress"
                    value={formData.permanentAddress}
                    onChange={handleChange}
                    required
                    rows="3"
                    style={{
                      width: '100%',
                      padding: '6px 12px',
                      fontSize: '14px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      resize: 'vertical'
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

      {/* View Employee Profile Modal */}
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
            maxWidth: '800px',
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
                <i className="fas fa-user" style={{ marginRight: '8px', color: '#337ab7' }}></i>
                Employee Profile: {viewingEmployee.name}
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
                      <strong style={{ color: '#555', fontSize: '12px' }}>Monthly Salary:</strong>
                      <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#5cb85c', fontWeight: 'bold' }}>
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
                          backgroundColor: viewingEmployee.status === 'ACTIVE' ? '#5cb85c' : 
                                        viewingEmployee.status === 'RESIGNED' ? '#5bc0de' :
                                        viewingEmployee.status === 'TERMINATED' ? '#d9534f' :
                                        viewingEmployee.status === 'RETIRED' ? '#5cb85c' : '#999',
                          color: '#fff'
                        }}>
                          {viewingEmployee.status || 'ACTIVE'}
                        </span>
                      </p>
                      {viewingEmployee.leavingDate && (viewingEmployee.status === 'RESIGNED' || viewingEmployee.status === 'TERMINATED' || viewingEmployee.status === 'RETIRED') && (
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
                    <strong style={{ color: '#555', fontSize: '12px' }}>Email Address:</strong>
                    <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>{viewingEmployee.emailAddress}</p>
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
                        <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: 'bold', color: '#f0ad4e' }}>
                          {salaryStats.unpaidMonths}
                        </p>
                      </div>
                      <div>
                        <strong style={{ color: '#555', fontSize: '12px' }}>Total Unpaid Amount:</strong>
                        <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: 'bold', color: '#f0ad4e' }}>
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

              {/* Additional Info */}
              <div style={{
                marginTop: '20px',
                padding: '10px',
                backgroundColor: '#e8f4f8',
                borderRadius: '4px',
                fontSize: '12px',
                color: '#555'
              }}>
                <strong>Record Created:</strong> {new Date(viewingEmployee.createdAt).toLocaleDateString()} at {new Date(viewingEmployee.createdAt).toLocaleTimeString()}
              </div>

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

              {/* Monthly Salary Details Section (Hidden by default) */}
              {showSalaryDetails && (() => {
                const monthNames = ["January", "February", "March", "April", "May", "June",
                  "July", "August", "September", "October", "November", "December"];
                const currentDate = new Date();
                const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                
                // Sort salaries by month (newest first)
                const sortedSalaries = viewingEmployee.salaries ? [...viewingEmployee.salaries].sort((a, b) => {
                  const [monthA, yearA] = a.month.split(' ');
                  const [monthB, yearB] = b.month.split(' ');
                  const monthIndexA = monthNames.indexOf(monthA);
                  const monthIndexB = monthNames.indexOf(monthB);
                  const dateA = monthIndexA !== -1 ? new Date(parseInt(yearA), monthIndexA, 1) : new Date(0);
                  const dateB = monthIndexB !== -1 ? new Date(parseInt(yearB), monthIndexB, 1) : new Date(0);
                  return dateB - dateA; // Descending order (newest first)
                }) : [];

                const totalMonths = sortedSalaries.length;
                const paidSalaries = sortedSalaries.filter(s => s.paid);
                const unpaidSalaries = sortedSalaries.filter(s => !s.paid);
                const paidMonths = paidSalaries.length;
                const unpaidMonths = unpaidSalaries.length;

                // Calculate amounts
                const totalAmount = sortedSalaries.reduce((sum, sal) => sum + parseFloat(sal.amount || 0), 0);
                const paidAmount = paidSalaries.reduce((sum, sal) => sum + parseFloat(sal.amount || 0), 0);
                const unpaidAmount = unpaidSalaries.reduce((sum, sal) => sum + parseFloat(sal.amount || 0), 0);

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
                    {sortedSalaries.length > 0 ? (
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
                              <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left', fontWeight: 'bold' }}>Payment Info</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sortedSalaries.map((salary) => {
                              const [monthName, year] = salary.month.split(' ');
                              const monthIndex = monthNames.indexOf(monthName);
                              const salaryDate = monthIndex !== -1 ? new Date(parseInt(year), monthIndex, 1) : null;
                              
                              return (
                                <tr 
                                  key={salary.id} 
                                  style={{ 
                                    backgroundColor: salary.paid ? '#f0f9f4' : 'transparent'
                                  }}
                                >
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
                                      {salary.paid ? '✓ Paid' : '⏳ Unpaid'}
                                    </span>
                                  </td>
                                  <td style={{ padding: '10px', border: '1px solid #ddd', whiteSpace: 'nowrap', fontSize: '12px' }}>
                                    {new Date(salary.createdAt).toLocaleDateString()}
                                  </td>
                                  <td style={{ padding: '10px', border: '1px solid #ddd', fontSize: '12px' }}>
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
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div style={{ 
                        padding: '20px', 
                        textAlign: 'center', 
                        color: '#999',
                        backgroundColor: '#f9f9f9',
                        borderRadius: '4px'
                      }}>
                        <i className="fas fa-info-circle" style={{ marginRight: '8px' }}></i>
                        No salary records found for this employee.
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '15px',
              borderTop: '1px solid #e5e5e5',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#f5f5f5'
            }}>
              {/* Left side - Action button */}
              {isAdmin && viewingEmployee?.status === 'ACTIVE' && (
                <button
                  type="button"
                  onClick={() => setShowActionModal(true)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '14px',
                    color: '#fff',
                    backgroundColor: '#5cb85c',
                    border: '1px solid #4cae4c',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#449d44'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#5cb85c'}
                >
                  <i className="fas fa-cog" style={{ marginRight: '5px' }}></i>
                  Action
                </button>
              )}
              
              {/* Right side - Close and Edit buttons */}
              <div style={{ display: 'flex', gap: '8px' }}>
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
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowViewModal(false);
                      setShowSalaryDetails(false);
                      handleEdit(viewingEmployee);
                    }}
                    style={{
                      padding: '6px 12px',
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
                    Edit Employee
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Modal for Status Change */}
      {showActionModal && viewingEmployee && (
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
          zIndex: 1060,
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
                <i className="fas fa-cog" style={{ marginRight: '8px', color: '#5cb85c' }}></i>
                Employee Action
              </h4>
              <button
                onClick={() => {
                  setShowActionModal(false);
                  setActionType('');
                  setActionDescription('');
                  setActionDay('');
                  setActionMonth('');
                  setActionYear('');
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
            <div style={{ padding: '15px' }}>
              <p style={{ marginBottom: '15px', fontSize: '14px', color: '#555' }}>
                Select an action for <strong>{viewingEmployee.name}</strong>:
              </p>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Action Type:
                </label>
                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '14px',
                    border: '1px solid #ccc',
                    borderRadius: '4px'
                  }}
                  required
                >
                  <option value="">Select Action</option>
                  <option value="RESIGNED">Mark as Former Employee (Resigned)</option>
                  <option value="RETIRED">Mark as Former Employee (Retired)</option>
                  <option value="TERMINATED">Terminate Employee</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Action Date:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#666' }}>Day</label>
                    <select
                      value={actionDay}
                      onChange={(e) => setActionDay(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        fontSize: '14px',
                        border: '1px solid #ccc',
                        borderRadius: '4px'
                      }}
                      required
                    >
                      <option value="">Day</option>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                        <option key={day} value={day.toString().padStart(2, '0')}>{day}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#666' }}>Month</label>
                    <select
                      value={actionMonth}
                      onChange={(e) => setActionMonth(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        fontSize: '14px',
                        border: '1px solid #ccc',
                        borderRadius: '4px'
                      }}
                      required
                    >
                      <option value="">Month</option>
                      {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map((month, index) => (
                        <option key={month} value={month}>
                          {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][index]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#666' }}>Year</label>
                    <select
                      value={actionYear}
                      onChange={(e) => setActionYear(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        fontSize: '14px',
                        border: '1px solid #ccc',
                        borderRadius: '4px'
                      }}
                      required
                    >
                      <option value="">Year</option>
                      {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Description / Reason:
                </label>
                <textarea
                  value={actionDescription}
                  onChange={(e) => setActionDescription(e.target.value)}
                  placeholder={`Enter description or reason for ${actionType === 'RESIGNED' ? 'resignation' : actionType === 'RETIRED' ? 'retirement' : actionType === 'TERMINATED' ? 'termination' : 'this action'}...`}
                  rows="4"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '14px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    resize: 'vertical'
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
                type="button"
                onClick={async () => {
                  if (!actionType) {
                    alert('Please select an action type');
                    return;
                  }
                  
                  if (!actionDay || !actionMonth || !actionYear) {
                    alert('Please select action date (day, month, and year)');
                    return;
                  }
                  
                  const actionText = actionType === 'RESIGNED' ? 'mark as Resigned' : 
                                   actionType === 'RETIRED' ? 'mark as Retired' : 
                                   'terminate';
                  
                  if (!confirm(`Are you sure you want to ${actionText} this employee?`)) {
                    return;
                  }

                  try {
                    // Format date as YYYY-MM-DD
                    const actionDate = `${actionYear}-${actionMonth}-${actionDay}`;
                    await employeeService.changeStatus(viewingEmployee.id, actionType, actionDescription, actionDate);
                    alert(`Employee status updated to ${actionType} successfully!`);
                    setShowActionModal(false);
                    setShowViewModal(false);
                    setViewingEmployee(null);
                    setActionType('');
                    setActionDescription('');
                    setActionDay('');
                    setActionMonth('');
                    setActionYear('');
                    fetchEmployees();
                  } catch (error) {
                    alert(error.response?.data?.message || 'Failed to update employee status');
                  }
                }}
                style={{
                  padding: '6px 12px',
                  fontSize: '14px',
                  color: '#fff',
                  backgroundColor: '#5cb85c',
                  border: '1px solid #4cae4c',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginRight: '5px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#449d44'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#5cb85c'}
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowActionModal(false);
                  setActionType('');
                  setActionDescription('');
                  setActionDay('');
                  setActionMonth('');
                  setActionYear('');
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
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
