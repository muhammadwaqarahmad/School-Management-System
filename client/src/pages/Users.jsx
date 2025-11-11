import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import userService from '../services/userService';
import Loader from '../components/Loader';
import { ROLES } from '../utils/constants';

const Users = () => {
  const { user: authUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    registrationNo: '',
    name: '',
    fatherName: '',
    email: '',
    password: '',
    role: authUser?.role === ROLES.ADMIN ? ROLES.ACCOUNTANT : ROLES.ADMIN,
    mobileNumber: '',
    permanentAddress: '',
    currentAddress: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await userService.getUsers();
      if (response.success && response.users) {
        // Filter users based on current user role
        let filteredUsers = response.users;
        if (authUser?.role === ROLES.ADMIN) {
          // Admins can only see and manage Accountants
          filteredUsers = response.users.filter(u => u.role === ROLES.ACCOUNTANT);
        }
        setUsers(filteredUsers);
      }
    } catch (error) {
      console.error('Users error:', error);
      alert('Failed to load users. Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        // When editing, don't send password if it's empty
        const updateData = { ...formData };
        if (!updateData.password) {
          delete updateData.password;
        }
        await userService.updateUser(editingId, updateData);
        alert('User updated successfully!');
      } else {
        await userService.createUser(formData);
        alert('User created successfully!');
      }
      fetchUsers();
      handleCloseModal();
    } catch (error) {
      alert(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    try {
      await userService.deleteUser(id);
      alert('User deleted successfully!');
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleEdit = (user) => {
    setFormData({
      registrationNo: user.registrationNo,
      name: user.name,
      fatherName: user.fatherName,
      email: user.email,
      password: '', // Don't show password
      role: user.role,
      mobileNumber: user.mobileNumber,
      permanentAddress: user.permanentAddress,
      currentAddress: user.currentAddress
    });
    setEditingId(user.id);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      registrationNo: '',
      name: '',
      fatherName: '',
      email: '',
      password: '',
      role: authUser?.role === ROLES.ADMIN ? ROLES.ACCOUNTANT : ROLES.ADMIN,
      mobileNumber: '',
      permanentAddress: '',
      currentAddress: ''
    });
  };

  const handleResetPassword = async (id) => {
    const newPassword = prompt('Enter new password (min 6 characters):');
    if (!newPassword) return;
    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }
    try {
      await userService.resetUserPassword(id, newPassword);
      alert('Password reset successfully!');
    } catch (error) {
      alert('Failed to reset password');
    }
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
            <Link to="/users" style={{ color: '#337ab7', textDecoration: 'none' }}>
              {authUser?.role === ROLES.SUPER_ADMIN ? 'User Management' : 'Accountant Management'}
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
          <i className="fas fa-users" style={{ color: '#337ab7' }}></i>
          {authUser?.role === ROLES.SUPER_ADMIN ? 'User Management' : 'Accountant Management'}
        </h1>
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
          <strong>Note!</strong> {authUser?.role === ROLES.SUPER_ADMIN 
            ? 'Manage system administrators and accountants.'
            : 'Manage accountant accounts.'}
        </div>
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
          {authUser?.role === ROLES.SUPER_ADMIN ? 'Add New User' : 'Add New Accountant'}
        </button>
      </div>

      {/* Users Table */}
      <table style={{
        width: '100%',
        border: '1px solid #ddd',
        borderCollapse: 'collapse',
        backgroundColor: '#fff',
        marginBottom: '20px'
      }}>
        <thead>
          <tr style={{ backgroundColor: '#f5f5f5' }}>
            <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'left' }}>Reg No</th>
            <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'left' }}>Name</th>
            <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'left' }}>Father Name</th>
            <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'left' }}>Email</th>
            <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'left' }}>Mobile</th>
            <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'left' }}>Role</th>
            <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'center' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan="7" style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                No users found. Click "Add New User" to create one.
              </td>
            </tr>
          ) : (
            users.map((user) => (
              <tr key={user.id}>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{user.registrationNo}</td>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{user.name}</td>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{user.fatherName}</td>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{user.email}</td>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{user.mobileNumber}</td>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '3px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    backgroundColor: user.role === 'SUPER_ADMIN' ? '#d9534f' : user.role === 'ADMIN' ? '#5bc0de' : '#5cb85c',
                    color: '#fff'
                  }}>
                    {user.role === 'SUPER_ADMIN' ? 'Super Admin' : user.role === 'ADMIN' ? 'Admin' : 'Accountant'}
                  </span>
                </td>
                <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>
                  <button
                    onClick={() => handleEdit(user)}
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
                    onClick={() => handleResetPassword(user.id)}
                    style={{
                      backgroundColor: '#f0ad4e',
                      color: '#fff',
                      border: 'none',
                      padding: '4px 8px',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      marginRight: '5px'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ec971f'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f0ad4e'}
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => handleDelete(user.id)}
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
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Add/Edit User Modal */}
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
            maxWidth: '600px',
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
                {editingId ? 'Edit User' : 'Add New User'}
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
                <div style={{ marginBottom: '15px' }}>
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

                <div style={{ marginBottom: '15px' }}>
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

                <div style={{ marginBottom: '15px' }}>
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

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Email:
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
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
                    Password {editingId && '(leave empty to keep current)'}:
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required={!editingId}
                    minLength="6"
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
                    Role:
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    disabled={authUser?.role === ROLES.ADMIN}
                    required
                    style={{
                      width: '100%',
                      padding: '6px 12px',
                      fontSize: '14px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      backgroundColor: authUser?.role === ROLES.ADMIN ? '#f5f5f5' : '#fff'
                    }}
                  >
                    {authUser?.role === ROLES.SUPER_ADMIN && (
                      <>
                        <option value={ROLES.SUPER_ADMIN}>Super Admin</option>
                        <option value={ROLES.ADMIN}>Admin</option>
                      </>
                    )}
                    <option value={ROLES.ACCOUNTANT}>Accountant</option>
                  </select>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Mobile Number:
                  </label>
                  <input
                    type="tel"
                    name="mobileNumber"
                    value={formData.mobileNumber}
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

                <div style={{ marginBottom: '15px' }}>
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
    </div>
  );
};

export default Users;
