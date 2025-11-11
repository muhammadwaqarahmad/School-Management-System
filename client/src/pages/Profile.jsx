import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import profileService from '../services/profileService';
import Loader from '../components/Loader';
import { ROLES } from '../utils/constants';

const Profile = () => {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    fatherName: '',
    mobileNumber: '',
    permanentAddress: '',
    currentAddress: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await profileService.getProfile();
      if (response.success && response.data?.user) {
        setUser(response.data.user);
        setFormData({
          name: response.data.user.name,
          fatherName: response.data.user.fatherName,
          mobileNumber: response.data.user.mobileNumber,
          permanentAddress: response.data.user.permanentAddress,
          currentAddress: response.data.user.currentAddress
        });
      }
    } catch (error) {
      console.error('Profile error:', error);
      alert('Failed to load profile. Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await profileService.updateProfile(formData);
      alert('Profile updated successfully!');
      setEditing(false);
      setShowModal(false);
      fetchProfile();
    } catch (error) {
      alert('Failed to update profile');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleEditClick = () => {
    setEditing(true);
    setShowModal(true);
  };

  const handleCancel = () => {
    setEditing(false);
    setShowModal(false);
    setFormData({
      name: user.name,
      fatherName: user.fatherName,
      mobileNumber: user.mobileNumber,
      permanentAddress: user.permanentAddress,
      currentAddress: user.currentAddress
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
            <Link to="/profile" style={{ color: '#337ab7', textDecoration: 'none' }}>
              Profile Information
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
          <i className="fas fa-user" style={{ color: '#337ab7' }}></i>
          Profile Information
        </h1>
      </div>

      {/* Alert */}
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
            ? 'You can edit your profile information below.'
            : 'In case of any correction in below information, please contact the administrator.'}
        </div>
        {authUser?.role === ROLES.SUPER_ADMIN && (
          <button
            onClick={handleEditClick}
            style={{
              color: '#fff',
              backgroundColor: '#337ab7',
              border: '1px solid #2e6da4',
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'normal',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#286090'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#337ab7'}
          >
            Update Profile
          </button>
        )}
      </div>

      {/* Profile Table */}
      <table style={{
        width: '100%',
        border: '1px solid #ddd',
        borderCollapse: 'collapse',
        backgroundColor: '#fff',
        marginBottom: '20px'
      }}>
        <tbody>
          <tr>
            <th style={{
              padding: '8px',
              border: '1px solid #ddd',
              backgroundColor: '#f5f5f5',
              fontWeight: 'bold',
              textAlign: 'left',
              width: '25%'
            }}>
              Registration No.
            </th>
            <td style={{
              padding: '8px',
              border: '1px solid #ddd',
              width: '25%'
            }}>
              {user?.registrationNo}
            </td>
            <th style={{
              padding: '8px',
              border: '1px solid #ddd',
              backgroundColor: '#f5f5f5',
              fontWeight: 'bold',
              textAlign: 'left',
              width: '25%'
            }}>
              Role
            </th>
            <td style={{
              padding: '8px',
              border: '1px solid #ddd',
              width: '25%'
            }}>
              {user?.role}
            </td>
          </tr>
          <tr>
            <th style={{
              padding: '8px',
              border: '1px solid #ddd',
              backgroundColor: '#f5f5f5',
              fontWeight: 'bold',
              textAlign: 'left'
            }}>
              Name
            </th>
            <td style={{
              padding: '8px',
              border: '1px solid #ddd'
            }}>
              {user?.name}
            </td>
            <th style={{
              padding: '8px',
              border: '1px solid #ddd',
              backgroundColor: '#f5f5f5',
              fontWeight: 'bold',
              textAlign: 'left'
            }}>
              Father Name
            </th>
            <td style={{
              padding: '8px',
              border: '1px solid #ddd'
            }}>
              {user?.fatherName}
            </td>
          </tr>
          <tr>
            <th style={{
              padding: '8px',
              border: '1px solid #ddd',
              backgroundColor: '#f5f5f5',
              fontWeight: 'bold',
              textAlign: 'left'
            }}>
              Mobile No.
            </th>
            <td style={{
              padding: '8px',
              border: '1px solid #ddd'
            }}>
              {user?.mobileNumber}
            </td>
            <th style={{
              padding: '8px',
              border: '1px solid #ddd',
              backgroundColor: '#f5f5f5',
              fontWeight: 'bold',
              textAlign: 'left'
            }}>
              Email
            </th>
            <td style={{
              padding: '8px',
              border: '1px solid #ddd'
            }}>
              {user?.email}
            </td>
          </tr>
          <tr>
            <th style={{
              padding: '8px',
              border: '1px solid #ddd',
              backgroundColor: '#f5f5f5',
              fontWeight: 'bold',
              textAlign: 'left'
            }}>
              Current Address
            </th>
            <td colSpan="3" style={{
              padding: '8px',
              border: '1px solid #ddd'
            }}>
              {user?.currentAddress}
            </td>
          </tr>
          <tr>
            <th style={{
              padding: '8px',
              border: '1px solid #ddd',
              backgroundColor: '#f5f5f5',
              fontWeight: 'bold',
              textAlign: 'left'
            }}>
              Permanent Address
            </th>
            <td colSpan="3" style={{
              padding: '8px',
              border: '1px solid #ddd'
            }}>
              {user?.permanentAddress}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Edit Modal */}
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
                Edit Profile
              </h4>
              <button
                onClick={handleCancel}
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
                      lineHeight: '1.42857143',
                      color: '#555',
                      backgroundColor: '#fff',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      boxShadow: 'inset 0 1px 1px rgba(0,0,0,0.075)',
                      transition: 'border-color ease-in-out .15s, box-shadow ease-in-out .15s'
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
                      lineHeight: '1.42857143',
                      color: '#555',
                      backgroundColor: '#fff',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      boxShadow: 'inset 0 1px 1px rgba(0,0,0,0.075)'
                    }}
                  />
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
                      lineHeight: '1.42857143',
                      color: '#555',
                      backgroundColor: '#fff',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      boxShadow: 'inset 0 1px 1px rgba(0,0,0,0.075)'
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
                      lineHeight: '1.42857143',
                      color: '#555',
                      backgroundColor: '#fff',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      boxShadow: 'inset 0 1px 1px rgba(0,0,0,0.075)',
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
                      lineHeight: '1.42857143',
                      color: '#555',
                      backgroundColor: '#fff',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      boxShadow: 'inset 0 1px 1px rgba(0,0,0,0.075)',
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
                    fontWeight: 'normal',
                    lineHeight: '1.42857143',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    border: '1px solid transparent',
                    borderRadius: '4px',
                    color: '#fff',
                    backgroundColor: '#337ab7',
                    borderColor: '#2e6da4',
                    marginRight: '5px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#286090'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#337ab7'}
                >
                  Update
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  style={{
                    padding: '6px 12px',
                    fontSize: '14px',
                    fontWeight: 'normal',
                    lineHeight: '1.42857143',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    color: '#333',
                    backgroundColor: '#fff'
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

export default Profile;

