import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import studentService from '../services/studentService';
import Loader from '../components/Loader';
import Breadcrumb from '../components/common/Breadcrumb';
import PageHeader from '../components/common/PageHeader';
import ActionButton from '../components/common/ActionButton';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../utils/constants';
import { formatCurrency } from '../utils/currencyFormatter';
import { formatDateUTC, formatLocaleDate } from '../utils/formatDate';
import { calculateFeeStats } from '../utils/dataCalculations';
import { confirmRejoin, confirmDelete } from '../utils/confirmation';
import { handleError, showSuccess, showError } from '../utils/errorHandler';
import { pageContainerStyle } from '../utils/pageStyles';

const Alumni = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingStudent, setViewingStudent] = useState(null);
  const [showFeeDetails, setShowFeeDetails] = useState(false);
  const [showAcademicDetails, setShowAcademicDetails] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // 'GRADUATED', 'DROPPED', or '' for all
  
  const isAdmin = user?.role === ROLES.ADMIN || user?.role === ROLES.SUPER_ADMIN;
  const isAccountant = user?.role === ROLES.ACCOUNTANT;

  useEffect(() => {
    fetchAlumni();
  }, [statusFilter]);

  const fetchAlumni = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchQuery) {
        params.searchQuery = searchQuery;
      }
      if (statusFilter) {
        params.status = statusFilter;
      }
      
      const response = await studentService.getAlumni(params);
      if (response.success && response.data) {
        setAlumni(response.data.alumni || []);
      }
    } catch (error) {
      handleError(error, 'fetchAlumni', 'Failed to fetch alumni records');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchAlumni();
  };

  const handleFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };


  const handleRejoin = async (student) => {
    if (!confirmRejoin(student.name, 'student')) {
      return;
    }

    try {
      // Format date as YYYY-MM-DD for the backend
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const actionDate = `${year}-${month}-${day}`;
      
      const response = await studentService.changeStatus(student.id, 'ACTIVE', 'Rejoined the school', actionDate);
      
      if (response.success) {
        showSuccess(`${student.name} has been successfully rejoined. You will now be redirected to the Students page where you can edit their profile.`);
        navigate(`/students?rejoinId=${student.id}`);
        fetchAlumni();
      } else {
        showError(response.message || 'Failed to rejoin student. Please try again.');
      }
    } catch (error) {
      handleError(error, 'handleRejoin', 'Failed to rejoin student. Please try again.');
    }
  };

  const handleDelete = async (student) => {
    if (!confirmDelete(student.name, 'student', 'fees, promotions, status logs')) {
      return;
    }

    try {
      const response = await studentService.delete(student.id);
      if (response.success) {
        showSuccess(`${student.name} has been successfully deleted.`);
        fetchAlumni();
      } else {
        showError(response.message || 'Failed to delete student');
      }
    } catch (error) {
      handleError(error, 'handleDelete', 'Failed to delete student. Please try again.');
    }
  };

  const viewStudentDetails = async (student) => {
    try {
      const response = await studentService.getById(student.id);
      setViewingStudent(response.data.student);
      setShowViewModal(true);
      setShowFeeDetails(false);
      setShowAcademicDetails(false);
    } catch (error) {
      handleError(error, 'viewStudentDetails');
      setViewingStudent(student);
      setShowViewModal(true);
      setShowFeeDetails(false);
      setShowAcademicDetails(false);
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
            <Link to="/students" style={{ color: '#337ab7', textDecoration: 'none' }}>
              Students
            </Link>
          </li>
          <li style={{ color: '#ccc' }}>/</li>
          <li style={{ color: '#333' }}>Alumni</li>
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
            <i className="fas fa-graduation-cap" style={{ color: '#337ab7' }}></i>
            Alumni
          </h1>
          <Link
            to="/students"
            style={{
              padding: '6px 12px',
              backgroundColor: '#337ab7',
              color: '#fff',
              textDecoration: 'none',
              borderRadius: '4px',
              fontSize: '13px'
            }}
          >
            ← Back to Students
          </Link>
        </div>
        <p style={{ margin: '5px 0 0 0', color: '#777', fontSize: '13px' }}>
          Former students (Graduated or Dropped)
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
              Search by Registration No, Roll No, Name, or NIC:
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
                    fetchAlumni();
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
              <option value="GRADUATED">Graduated</option>
              <option value="DROPPED">Dropped</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alumni Table */}
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
              <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'left', whiteSpace: 'nowrap' }}>Roll No</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'left', whiteSpace: 'nowrap' }}>Name</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'left', whiteSpace: 'nowrap' }}>Father Name</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'left', whiteSpace: 'nowrap' }}>Program</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'left', whiteSpace: 'nowrap' }}>Section</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'left', whiteSpace: 'nowrap' }}>Session</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'left', whiteSpace: 'nowrap' }}>Leaving Date</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'center', whiteSpace: 'nowrap' }}>Status</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'center', whiteSpace: 'nowrap' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {alumni.length === 0 ? (
              <tr>
                <td colSpan="10" style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                  No alumni records found.
                </td>
              </tr>
            ) : (
              alumni.map((student) => (
                <tr key={student.id}>
                  <td style={{ padding: '8px', border: '1px solid #ddd', whiteSpace: 'nowrap' }}>{student.registrationNo}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', whiteSpace: 'nowrap' }}>{student.rollNo}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', whiteSpace: 'nowrap' }}>{student.name}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', whiteSpace: 'nowrap' }}>{student.fatherName}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', whiteSpace: 'nowrap' }}>{student.program}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', whiteSpace: 'nowrap' }}>
                    {student.sectionRelation?.name || student.section || 'N/A'}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', whiteSpace: 'nowrap' }}>{student.session}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', whiteSpace: 'nowrap' }}>
                    {formatDateUTC(student.leavingDate)}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', whiteSpace: 'nowrap' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '3px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      backgroundColor: student.status === 'GRADUATED' ? '#5bc0de' : '#d9534f',
                      color: '#fff'
                    }}>
                      {student.status}
                    </span>
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', whiteSpace: 'nowrap' }}>
                    <button
                      onClick={() => viewStudentDetails(student)}
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
                          onClick={() => handleRejoin(student)}
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
                          onClick={() => handleDelete(student)}
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

      {/* View Student Profile Modal - Same as Students page */}
      {showViewModal && viewingStudent && (
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
                <i className="fas fa-graduation-cap" style={{ marginRight: '8px', color: '#337ab7' }}></i>
                Alumni Profile: {viewingStudent.name}
              </h4>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setViewingStudent(null);
                  setShowFeeDetails(false);
                  setShowAcademicDetails(false);
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

            {/* Modal Body - Reuse same structure as Students page */}
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
                      <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>{viewingStudent.registrationNo}</p>
                    </div>
                    <div>
                      <strong style={{ color: '#555', fontSize: '12px' }}>Roll Number:</strong>
                      <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>{viewingStudent.rollNo}</p>
                    </div>
                    <div>
                      <strong style={{ color: '#555', fontSize: '12px' }}>Full Name:</strong>
                      <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>{viewingStudent.name}</p>
                    </div>
                    <div>
                      <strong style={{ color: '#555', fontSize: '12px' }}>Father Name:</strong>
                      <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>{viewingStudent.fatherName}</p>
                    </div>
                    {viewingStudent.nic && (
                      <div>
                        <strong style={{ color: '#555', fontSize: '12px' }}>NIC:</strong>
                        <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>{viewingStudent.nic}</p>
                      </div>
                    )}
                    {viewingStudent.gender && (
                      <div>
                        <strong style={{ color: '#555', fontSize: '12px' }}>Gender:</strong>
                        <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>
                          {viewingStudent.gender === 'MALE' ? 'Boys' : viewingStudent.gender === 'FEMALE' ? 'Girls' : viewingStudent.gender}
                        </p>
                      </div>
                    )}
                    {viewingStudent.religion && (
                      <div>
                        <strong style={{ color: '#555', fontSize: '12px' }}>Religion:</strong>
                        <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>{viewingStudent.religion}</p>
                      </div>
                    )}
                    {viewingStudent.dateOfBirth && (
                      <div>
                        <strong style={{ color: '#555', fontSize: '12px' }}>Date of Birth:</strong>
                        <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>
                          {(() => {
                            const date = new Date(viewingStudent.dateOfBirth);
                            // Use UTC methods to avoid timezone conversion
                            const day = date.getUTCDate().toString().padStart(2, '0');
                            const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
                            const year = date.getUTCFullYear();
                            return `${day}/${month}/${year}`;
                          })()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Academic Information Section - Alumni: Only Status, Leaving Date, and Reason */}
                <div style={{
                  padding: '15px',
                  backgroundColor: '#f9f9f9',
                  borderRadius: '4px',
                  border: '1px solid #e0e0e0'
                }}>
                  <h5 style={{ margin: '0 0 15px 0', color: '#337ab7', borderBottom: '2px solid #337ab7', paddingBottom: '8px' }}>
                    <i className="fas fa-book" style={{ marginRight: '8px' }}></i>
                    Academic Information
                  </h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <strong style={{ color: '#555', fontSize: '12px' }}>Status:</strong>
                      <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '3px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          backgroundColor: viewingStudent.status === 'GRADUATED' ? '#5bc0de' : '#d9534f',
                          color: '#fff'
                        }}>
                          {viewingStudent.status}
                        </span>
                      </p>
                    </div>
                    {viewingStudent.leavingDate && (
                      <div>
                        <strong style={{ color: '#555', fontSize: '12px' }}>Leaving Date:</strong>
                        <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>
                          {(() => {
                            const date = new Date(viewingStudent.leavingDate);
                            // Use UTC methods to avoid timezone conversion
                            const day = date.getUTCDate().toString().padStart(2, '0');
                            const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
                            const year = date.getUTCFullYear();
                            return `${day}/${month}/${year}`;
                          })()}
                        </p>
                      </div>
                    )}
                    {viewingStudent.statusLogs && viewingStudent.statusLogs.length > 0 && viewingStudent.statusLogs[0].description && (
                      <div>
                        <strong style={{ color: '#555', fontSize: '12px' }}>Reason:</strong>
                        <p style={{ margin: '4px 0 0 0', fontSize: '14px', whiteSpace: 'pre-wrap' }}>
                          {viewingStudent.statusLogs[0].description}
                        </p>
                      </div>
                    )}
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
                    <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>{viewingStudent.phoneNumber}</p>
                  </div>
                  <div>
                    <strong style={{ color: '#555', fontSize: '12px' }}>Email:</strong>
                    <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>{viewingStudent.email || 'N/A'}</p>
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
                      {viewingStudent.currentAddress}
                    </p>
                  </div>
                  <div>
                    <strong style={{ color: '#555', fontSize: '12px' }}>Permanent Address:</strong>
                    <p style={{ margin: '4px 0 0 0', fontSize: '14px', whiteSpace: 'pre-wrap' }}>
                      {viewingStudent.permanentAddress}
                    </p>
                  </div>
                </div>
              </div>

              {/* Academic Statistics Section */}
              {(() => {
                // Calculate academic statistics
                const joiningDate = viewingStudent.joiningDate ? new Date(viewingStudent.joiningDate) : new Date(viewingStudent.createdAt);
                const leavingDate = viewingStudent.leavingDate ? new Date(viewingStudent.leavingDate) : null;
                const totalClasses = viewingStudent.promotions 
                  ? (viewingStudent.promotions.length + 1) // +1 for initial class
                  : 1;
                const totalYears = leavingDate 
                  ? Math.round((leavingDate - joiningDate) / (365.25 * 24 * 60 * 60 * 1000) * 10) / 10
                  : Math.round((new Date() - joiningDate) / (365.25 * 24 * 60 * 60 * 1000) * 10) / 10;
                
                return (
                  <div style={{
                    marginTop: '20px',
                    padding: '15px',
                    backgroundColor: '#d1ecf1',
                    borderRadius: '4px',
                    border: '2px solid #5bc0de'
                  }}>
                    <h5 style={{ margin: '0 0 15px 0', color: '#0c5460', borderBottom: '2px solid #5bc0de', paddingBottom: '8px' }}>
                      <i className="fas fa-graduation-cap" style={{ marginRight: '8px' }}></i>
                      Academic Statistics
                    </h5>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                      <div>
                        <strong style={{ color: '#555', fontSize: '12px' }}>Joining Date:</strong>
                        <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: 'bold', color: '#337ab7' }}>
                          {joiningDate.toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <strong style={{ color: '#555', fontSize: '12px' }}>Total Classes Attended:</strong>
                        <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: 'bold', color: '#337ab7' }}>
                          {totalClasses}
                        </p>
                      </div>
                      <div>
                        <strong style={{ color: '#555', fontSize: '12px' }}>Total Years of Study:</strong>
                        <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: 'bold', color: '#337ab7' }}>
                          {totalYears.toFixed(1)} {totalYears === 1 ? 'year' : 'years'}
                        </p>
                      </div>
                      {leavingDate && (
                        <div>
                          <strong style={{ color: '#555', fontSize: '12px' }}>Leaving Date:</strong>
                          <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: 'bold', color: viewingStudent.status === 'GRADUATED' ? '#5cb85c' : '#d9534f' }}>
                            {(() => {
                              const date = new Date(leavingDate);
                              // Use UTC methods to avoid timezone conversion
                              const day = date.getUTCDate().toString().padStart(2, '0');
                              const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
                              const year = date.getUTCFullYear();
                              return `${day}/${month}/${year}`;
                            })()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Button to Show/Hide Class History */}
              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={() => setShowAcademicDetails(!showAcademicDetails)}
                  style={{
                    padding: '10px 20px',
                    fontSize: '14px',
                    color: '#fff',
                    backgroundColor: showAcademicDetails ? '#d9534f' : '#337ab7',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = showAcademicDetails ? '#c9302c' : '#286090'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = showAcademicDetails ? '#d9534f' : '#337ab7'}
                >
                  <i className={`fas ${showAcademicDetails ? 'fa-eye-slash' : 'fa-eye'}`} style={{ marginRight: '8px' }}></i>
                  {showAcademicDetails ? 'Hide Class History' : 'Show Class History'}
                </button>
              </div>

              {/* Class History Section (Hidden by default) */}
              {showAcademicDetails && (
                <div style={{
                  marginTop: '20px',
                  padding: '15px',
                  backgroundColor: '#f9f9f9',
                  borderRadius: '4px',
                  border: '2px solid #e0e0e0'
                }}>
                  <h5 style={{ margin: '0 0 15px 0', color: '#337ab7', borderBottom: '2px solid #337ab7', paddingBottom: '8px' }}>
                    <i className="fas fa-history" style={{ marginRight: '8px' }}></i>
                    Detailed Academic Information
                  </h5>
                  {(() => {
                    // Build class history from promotions and current class
                    const classHistory = [];
                    
                    // Add initial class (from joining date to first promotion)
                    if (viewingStudent.joiningDate || viewingStudent.createdAt) {
                      const firstPromotion = viewingStudent.promotions && viewingStudent.promotions.length > 0 
                        ? viewingStudent.promotions[0] 
                        : null;
                      
                      const startDate = viewingStudent.joiningDate 
                        ? new Date(viewingStudent.joiningDate) 
                        : new Date(viewingStudent.createdAt);
                      
                      // End date: promotion date if promoted, leaving date if left, null if still active
                      let endDate = null;
                      let status = 'ACTIVE';
                      
                      if (firstPromotion) {
                        // Student was promoted - end date is the promotion date
                        endDate = new Date(firstPromotion.createdAt);
                        status = 'PROMOTED';
                      } else if (viewingStudent.status === 'GRADUATED' || viewingStudent.status === 'DROPPED') {
                        // Student left - end date is the leaving date
                        endDate = viewingStudent.leavingDate ? new Date(viewingStudent.leavingDate) : null;
                        status = viewingStudent.status;
                      }
                      // Otherwise, endDate remains null (still active, will show "Present")
                      
                      // Determine initial class from first promotion or current class
                      let initialClass = firstPromotion ? firstPromotion.oldClass : (viewingStudent.classRelation?.name || viewingStudent.class);
                      let initialSession = firstPromotion ? firstPromotion.oldSession : viewingStudent.session;
                      
                      classHistory.push({
                        class: initialClass,
                        session: initialSession,
                        startDate: startDate,
                        endDate: endDate,
                        status: status
                      });
                    }
                    
                    // Add all promotions
                    if (viewingStudent.promotions && viewingStudent.promotions.length > 0) {
                      viewingStudent.promotions.forEach((promotion, index) => {
                        const nextPromotion = index < viewingStudent.promotions.length - 1 
                          ? viewingStudent.promotions[index + 1] 
                          : null;
                        
                        // End date: next promotion date if promoted again, leaving date if left, null if still active
                        let endDate = null;
                        let status = promotion.status === 'REPEATED' ? 'REPEATED' : 'PROMOTED';
                        
                        if (nextPromotion) {
                          // Student was promoted to next class - end date is the next promotion date
                          endDate = new Date(nextPromotion.createdAt);
                          status = 'PROMOTED';
                        } else if (viewingStudent.status === 'GRADUATED' || viewingStudent.status === 'DROPPED') {
                          // Student left - end date is the leaving date
                          endDate = viewingStudent.leavingDate ? new Date(viewingStudent.leavingDate) : null;
                          status = viewingStudent.status;
                        }
                        // Otherwise, endDate remains null (still active, will show "Present")
                        
                        classHistory.push({
                          class: promotion.newClass,
                          session: promotion.newSession,
                          startDate: new Date(promotion.createdAt),
                          endDate: endDate,
                          status: status,
                          promotedFrom: promotion.oldClass,
                          promotedFromSession: promotion.oldSession
                        });
                      });
                    }
                    
                    
                    return (
                      <div>
                        {classHistory.length > 0 ? (
                          <div style={{ overflowX: 'auto' }}>
                            <table style={{
                              width: '100%',
                              borderCollapse: 'collapse',
                              fontSize: '13px',
                              backgroundColor: '#fff'
                            }}>
                              <thead>
                                <tr style={{ backgroundColor: '#f5f5f5' }}>
                                  <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left', fontWeight: 'bold' }}>Class</th>
                                  <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left', fontWeight: 'bold' }}>Session</th>
                                  <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 'bold' }}>Start Date</th>
                                  <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 'bold' }}>End Date</th>
                                  <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 'bold' }}>Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {classHistory.map((entry, index) => (
                                  <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                                    <td style={{ padding: '10px', border: '1px solid #ddd', fontWeight: '500' }}>
                                      {entry.class}
                                      {entry.promotedFrom && (
                                        <span style={{ fontSize: '11px', color: '#999', marginLeft: '5px' }}>
                                          (from {entry.promotedFrom})
                                        </span>
                                      )}
                                    </td>
                                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                      {entry.session}
                                    </td>
                                    <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center', fontSize: '12px' }}>
                                      {entry.startDate ? formatDateUTC(entry.startDate) : 'N/A'}
                                    </td>
                                    <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center', fontSize: '12px' }}>
                                      {entry.endDate ? formatDateUTC(entry.endDate) : 'Present'}
                                    </td>
                                    <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                                      <span style={{
                                        padding: '4px 10px',
                                        borderRadius: '4px',
                                        fontSize: '11px',
                                        fontWeight: 'bold',
                                        backgroundColor: entry.status === 'ACTIVE' ? '#d4edda' : 
                                                        entry.status === 'PROMOTED' ? '#d1ecf1' : 
                                                        entry.status === 'REPEATED' ? '#fff3cd' : 
                                                        entry.status === 'GRADUATED' ? '#d1ecf1' : '#f8d7da',
                                        color: entry.status === 'ACTIVE' ? '#155724' : 
                                               entry.status === 'PROMOTED' ? '#0c5460' : 
                                               entry.status === 'REPEATED' ? '#856404' : 
                                               entry.status === 'GRADUATED' ? '#0c5460' : '#721c24',
                                        display: 'inline-block'
                                      }}>
                                        {entry.status}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
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
                            No class history available
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Fee Statistics Section */}
              {(() => {
                const feeStats = calculateFeeStats(viewingStudent);
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
                      Fee Statistics
                    </h5>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                      <div>
                        <strong style={{ color: '#555', fontSize: '12px' }}>Total Months:</strong>
                        <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: 'bold', color: '#337ab7' }}>
                          {feeStats.totalMonths}
                        </p>
                      </div>
                      <div>
                        <strong style={{ color: '#555', fontSize: '12px' }}>Paid Months:</strong>
                        <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: 'bold', color: '#5cb85c' }}>
                          {feeStats.paidMonths}
                        </p>
                      </div>
                      <div>
                        <strong style={{ color: '#555', fontSize: '12px' }}>Total Paid Amount:</strong>
                        <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: 'bold', color: '#5cb85c' }}>
                          {formatCurrency(feeStats.paidAmount)}
                        </p>
                      </div>
                      <div>
                        <strong style={{ color: '#555', fontSize: '12px' }}>Total Overdue Months:</strong>
                        <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: 'bold', color: '#d9534f' }}>
                          {feeStats.overdueMonths}
                        </p>
                      </div>
                      <div>
                        <strong style={{ color: '#555', fontSize: '12px' }}>Total Overdue Amount:</strong>
                        <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: 'bold', color: '#d9534f' }}>
                          {formatCurrency(feeStats.overdueAmount)}
                        </p>
                      </div>
                      <div>
                        <strong style={{ color: '#555', fontSize: '12px' }}>Total Remaining Amount:</strong>
                        <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: 'bold', color: '#f0ad4e' }}>
                          {formatCurrency(feeStats.remainingAmount)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Button to Show/Hide Fee Details */}
              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={() => setShowFeeDetails(!showFeeDetails)}
                  style={{
                    padding: '10px 20px',
                    fontSize: '14px',
                    color: '#fff',
                    backgroundColor: showFeeDetails ? '#d9534f' : '#337ab7',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = showFeeDetails ? '#c9302c' : '#286090'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = showFeeDetails ? '#d9534f' : '#337ab7'}
                >
                  <i className={`fas ${showFeeDetails ? 'fa-eye-slash' : 'fa-eye'}`} style={{ marginRight: '8px' }}></i>
                  {showFeeDetails ? 'Hide Fee Details' : 'Show Fee Details'}
                </button>
              </div>

              {/* Monthly Fee Details Section (Hidden by default) */}
              {showFeeDetails && (() => {
                const feeStats = calculateFeeStats(viewingStudent);
                const monthNames = ["January", "February", "March", "April", "May", "June",
                  "July", "August", "September", "October", "November", "December"];
                const currentDate = new Date();
                const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                
                // Sort fees by month (newest first)
                const sortedFees = viewingStudent.fees ? [...viewingStudent.fees].sort((a, b) => {
                  const [monthA, yearA] = a.month.split(' ');
                  const [monthB, yearB] = b.month.split(' ');
                  const monthIndexA = monthNames.indexOf(monthA);
                  const monthIndexB = monthNames.indexOf(monthB);
                  const dateA = monthIndexA !== -1 ? new Date(parseInt(yearA), monthIndexA, 1) : new Date(0);
                  const dateB = monthIndexB !== -1 ? new Date(parseInt(yearB), monthIndexB, 1) : new Date(0);
                  return dateB - dateA; // Descending order (newest first)
                }) : [];

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
                      Monthly Fee Details
                    </h5>
                    {sortedFees.length > 0 ? (
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
                              <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 'bold' }}>Payment Date</th>
                              <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left', fontWeight: 'bold' }}>Paid By</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sortedFees.map((fee) => {
                              const [monthName, year] = fee.month.split(' ');
                              const monthIndex = monthNames.indexOf(monthName);
                              const feeDate = monthIndex !== -1 ? new Date(parseInt(year), monthIndex, 1) : null;
                              const isOverdue = !fee.paid && feeDate && feeDate < currentMonth;
                              
                              return (
                                <tr 
                                  key={fee.id} 
                                  style={{ 
                                    backgroundColor: isOverdue ? '#fff5f5' : fee.paid ? '#f0f9f4' : 'transparent'
                                  }}
                                >
                                  <td style={{ padding: '10px', border: '1px solid #ddd', fontWeight: '500' }}>
                                    {fee.month}
                                  </td>
                                  <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'right', fontWeight: '500' }}>
                                    {formatCurrency(fee.amount)}
                                  </td>
                                  <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                                    <span style={{
                                      padding: '4px 10px',
                                      borderRadius: '4px',
                                      fontSize: '11px',
                                      fontWeight: 'bold',
                                      backgroundColor: fee.paid ? '#d4edda' : isOverdue ? '#f8d7da' : '#fff3cd',
                                      color: fee.paid ? '#155724' : isOverdue ? '#721c24' : '#856404',
                                      display: 'inline-block'
                                    }}>
                                      {fee.paid ? '✓ Paid' : isOverdue ? '⚠ Overdue' : '⏳ Pending'}
                                    </span>
                                  </td>
                                  <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center', fontSize: '12px' }}>
                                    {fee.paid && fee.paidDate ? (
                                      <span style={{ color: '#155724' }}>
                                        {new Date(fee.paidDate).toLocaleDateString()} {new Date(fee.paidDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    ) : (
                                      <span style={{ color: '#999' }}>—</span>
                                    )}
                                  </td>
                                  <td style={{ padding: '10px', border: '1px solid #ddd', fontSize: '12px' }}>
                                    {fee.paid && fee.user ? (
                                      <span style={{ color: '#555' }}>
                                        {fee.user.name}
                                        {fee.user.email && <span style={{ color: '#999', marginLeft: '5px' }}>({fee.user.email})</span>}
                                      </span>
                                    ) : (
                                      <span style={{ color: '#999' }}>—</span>
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
                        No fee records found for this student.
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
              textAlign: 'right',
              backgroundColor: '#f5f5f5'
            }}>
              <button
                type="button"
                onClick={() => {
                  setShowViewModal(false);
                  setViewingStudent(null);
                  setShowFeeDetails(false);
                  setShowAcademicDetails(false);
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

export default Alumni;

