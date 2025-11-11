import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import studentService from '../services/studentService';
import classService from '../services/classService';
import sectionService from '../services/sectionService';
import settingsService from '../services/settingsService';
import Loader from '../components/Loader';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../utils/constants';
import { formatCurrency } from '../utils/currencyFormatter';

const Students = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const classFilter = searchParams.get('class');
  const classIdFilter = searchParams.get('classId');
  const sectionIdFilter = searchParams.get('sectionId');
  const rejoinId = searchParams.get('rejoinId');
  const [students, setStudents] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResult, setShowSearchResult] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [formSections, setFormSections] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(classIdFilter ? parseInt(classIdFilter) : '');
  const [selectedSectionId, setSelectedSectionId] = useState(sectionIdFilter ? parseInt(sectionIdFilter) : '');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    registrationNo: '',
    name: '',
    fatherName: '',
    rollNo: '',
    nic: '',
    gender: '',
    religion: '',
    dateOfBirth: '',
    joiningDate: '',
    program: '',
    session: '',
    class: '',
    section: '',
    classId: '',
    sectionId: '',
    phoneNumber: '',
    email: '',
    currentAddress: '',
    permanentAddress: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingStudent, setViewingStudent] = useState(null);
  const [showFeeDetails, setShowFeeDetails] = useState(false);
  const [showAcademicDetails, setShowAcademicDetails] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState(''); // 'GRADUATED' or 'DROPPED'
  const [actionDescription, setActionDescription] = useState('');
  const [actionDay, setActionDay] = useState('');
  const [actionMonth, setActionMonth] = useState('');
  const [actionYear, setActionYear] = useState('');
  const [academicSessions, setAcademicSessions] = useState([]);
  
  // Check if user is an accountant (read-only access)
  const isAccountant = user?.role === ROLES.ACCOUNTANT;
  const isAdmin = user?.role === ROLES.ADMIN || user?.role === ROLES.SUPER_ADMIN;

  // Load sessions when program changes
  useEffect(() => {
    const loadSessions = async () => {
      if (!formData.program) {
        setAcademicSessions([]);
        setFormData(prev => ({ ...prev, session: '' }));
        return;
      }
      try {
        // Use settingsService directly (already imported)
        const resp = await settingsService.getSessions(formData.program);
        // API interceptor returns response.data directly
        // Response structure from backend: { success: true, data: { sessions: [...] } }
        // After API interceptor: { success: true, data: { sessions: [...] } }
        // But settingsService.getSessions might return response.data if nested
        let sessionsData = [];
        if (resp && resp.success) {
          // Check various possible response structures
          if (resp.data?.sessions) {
            sessionsData = resp.data.sessions;
          } else if (resp.sessions) {
            sessionsData = resp.sessions;
          } else if (Array.isArray(resp.data)) {
            sessionsData = resp.data;
          } else if (Array.isArray(resp)) {
            sessionsData = resp;
          }
        }
        
        const mapped = sessionsData.map(s => ({ 
          value: s.session, 
          label: s.isCurrent ? `${s.session} (Current Session)` : s.session, 
          isCurrent: s.isCurrent 
        }));
        setAcademicSessions(mapped);
        
        // Check if current session value exists in the loaded sessions
        const currentSessionValue = formData.session;
        const currentSessionExists = currentSessionValue && mapped.some(s => s.value === currentSessionValue);
        
        if (currentSessionExists) {
          // Session exists in list, keep it (no change needed)
          return;
        }
        
        // Session doesn't exist or no session selected
        if (currentSessionValue) {
          // Session was set but doesn't exist in list, clear it and auto-select
          const current = mapped.find(s => s.isCurrent);
          if (current) {
            setFormData(prev => ({ ...prev, session: current.value }));
          } else if (mapped.length > 0) {
            setFormData(prev => ({ ...prev, session: mapped[0].value }));
          } else {
            setFormData(prev => ({ ...prev, session: '' }));
          }
        } else {
          // No session selected, auto-select
          if (mapped.length > 0) {
            const current = mapped.find(s => s.isCurrent);
            if (current) {
              setFormData(prev => ({ ...prev, session: current.value }));
            } else {
              setFormData(prev => ({ ...prev, session: mapped[0].value }));
            }
          }
        }
      } catch (e) {
        console.error('Failed to load sessions for program:', formData.program, e);
        setAcademicSessions([]);
        setFormData(prev => ({ ...prev, session: '' }));
      }
    };
    loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.program]);

  useEffect(() => {
    fetchPrograms();
    fetchClasses();
    fetchStudents(); // Initial load
  }, []);

  // Fetch students when URL params change (but not when state changes via dropdowns)
  useEffect(() => {
    if (classIdFilter || sectionIdFilter || classFilter) {
      fetchStudents();
    }
  }, [classIdFilter, sectionIdFilter, classFilter]);

  useEffect(() => {
    if (selectedClassId) {
      fetchSectionsForClass(selectedClassId);
    } else {
      setSections([]);
    }
  }, [selectedClassId]);

  useEffect(() => {
    if (classIdFilter) {
      setSelectedClassId(parseInt(classIdFilter));
    }
    if (sectionIdFilter) {
      setSelectedSectionId(parseInt(sectionIdFilter));
    }
  }, [classIdFilter, sectionIdFilter]);

  // Handle rejoinId - open edit modal for rejoined student
  useEffect(() => {
    const handleRejoinEdit = async () => {
      if (rejoinId && classes.length > 0) {
        try {
          const response = await studentService.getById(parseInt(rejoinId));
          const student = response.data.student;
          
          // Prepare edit data
          const editData = {
            registrationNo: student.registrationNo,
            name: student.name,
            fatherName: student.fatherName,
            rollNo: student.rollNo,
            nic: student.nic || '',
            gender: student.gender || '',
            religion: student.religion || '',
            dateOfBirth: student.dateOfBirth ? student.dateOfBirth.split('T')[0] : '',
            joiningDate: student.joiningDate ? student.joiningDate.split('T')[0] : '',
            program: student.program,
            session: student.session,
            class: student.class,
            section: student.section || '',
            classId: student.classId || '',
            sectionId: student.sectionId || '',
            phoneNumber: student.phoneNumber,
            email: student.email || '',
            currentAddress: student.currentAddress,
            permanentAddress: student.permanentAddress
          };
          
          setFormData(editData);
          setEditingId(student.id);
          
          // Fetch sections for the selected class if classId exists
          if (student.classId) {
            await fetchSectionsForClass(student.classId, true);
          } else {
            setFormSections([]);
          }
          
          setShowModal(true);
          
          // Remove rejoinId from URL
          const newParams = new URLSearchParams(searchParams);
          newParams.delete('rejoinId');
          setSearchParams(newParams, { replace: true });
        } catch (error) {
          console.error('Failed to load student for edit:', error);
          alert('Failed to load student information. Please try again.');
          // Remove rejoinId from URL even on error
          const newParams = new URLSearchParams(searchParams);
          newParams.delete('rejoinId');
          setSearchParams(newParams, { replace: true });
        }
      }
    };

    handleRejoinEdit();
  }, [rejoinId, classes.length]);

  const fetchPrograms = async () => {
    try {
      // Use the new getPrograms endpoint which returns programs with name property
      // API interceptor returns response.data directly, so response is the data object
      const response = await settingsService.getPrograms();
      
      if (response && response.success) {
        if (response.programs && Array.isArray(response.programs)) {
          // New format: programs array with name property
          setPrograms(response.programs);
        } else if (response.programFees && Array.isArray(response.programFees)) {
          // Legacy format: programFees array with program property
          setPrograms(response.programFees.map(pf => ({
            id: pf.id,
            name: pf.program || pf.name,
            program: pf.program || pf.name, // Keep both for compatibility
            description: null,
            feeAmount: pf.feeAmount
          })));
        }
      }
    } catch (error) {
      console.error('Failed to fetch programs:', error);
      // If error, try to show user-friendly message
      if (error.response?.data?.message) {
        console.error('Error message:', error.response.data.message);
      }
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await classService.getAll();
      if (response.success && response.data) {
        setClasses(response.data.classes || []);
      }
    } catch (error) {
      console.error('Failed to fetch classes');
    }
  };

  const fetchSectionsForClass = async (classId, isForForm = false) => {
    try {
      const response = await sectionService.getByClass(classId);
      if (response.success && response.data) {
        const sectionsList = response.data.sections || [];
        if (isForForm) {
          setFormSections(sectionsList);
        } else {
          setSections(sectionsList);
        }
      }
    } catch (error) {
      console.error('Failed to fetch sections');
      if (isForForm) {
        setFormSections([]);
      } else {
        setSections([]);
      }
    }
  };

  const fetchStudents = async (overrideClassId = null, overrideSectionId = null) => {
    try {
      setLoading(true);
      const params = {};
      
      // Use override values if provided, otherwise use state or URL params
      const classId = overrideClassId !== null ? overrideClassId : (selectedClassId || classIdFilter || null);
      const sectionId = overrideSectionId !== null ? overrideSectionId : (selectedSectionId || sectionIdFilter || null);
      
      if (classId) {
        params.classId = classId;
      } else if (classFilter) {
        params.class = classFilter;
      }
      
      if (sectionId) {
        params.sectionId = sectionId;
      }
      
      const response = await studentService.getAll(params);
      const studentsList = response.data?.students || response.students || [];
      setStudents(studentsList);
    } catch (error) {
      console.error('Students error:', error);
      alert('Failed to load students. Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      alert('Please enter a search term');
      return;
    }

    setIsSearching(true);
    try {
      const response = await studentService.search(searchQuery.trim());
      const results = response.data?.students || [];
      setSearchResults(results);
      if (results.length === 0) {
        alert('No students found matching your search criteria.');
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('Failed to search students. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResult(null);
  };

  const viewStudentDetails = async (student) => {
    // Fetch full student data with fees (same as View button)
    try {
      const response = await studentService.getById(student.id);
      setViewingStudent(response.data.student);
      setShowViewModal(true);
      setShowFeeDetails(false); // Reset to hidden
      // Clear search results when opening modal
      setShowSearchResult(null);
    } catch (error) {
      console.error('Failed to fetch student details:', error);
      // Fallback to using the search result data if fetch fails
      setViewingStudent(student);
      setShowViewModal(true);
      setShowFeeDetails(false);
      setShowSearchResult(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let response;
      if (editingId) {
        response = await studentService.update(editingId, formData);
      } else {
        response = await studentService.create(formData);
      }
      
      // API interceptor returns response.data directly
      if (response.success) {
        alert(response.message || (editingId ? 'Student updated successfully!' : 'Student created successfully!'));
        fetchStudents();
        handleCloseModal();
      } else {
        alert(response.message || 'Operation failed');
      }
    } catch (error) {
      console.error('Submit error:', error);
      // Error is already formatted by API interceptor
      const errorMessage = error.message || error.response?.data?.message || 'Operation failed';
      alert(errorMessage);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this student? This action cannot be undone.')) return;
    try {
      console.log('Deleting student with ID:', id, typeof id);
      const response = await studentService.delete(id);
      console.log('Delete response:', response);
      
      // API interceptor returns response.data directly
      if (response.success) {
        alert(response.message || 'Student deleted successfully!');
        fetchStudents();
      } else {
        alert(response.message || 'Failed to delete student');
      }
    } catch (error) {
      console.error('Delete error:', error);
      // Error is already formatted by API interceptor
      const errorMessage = error.message || error.response?.data?.message || 'Failed to delete student';
      alert(errorMessage);
    }
  };

  const handleEdit = async (student) => {
    const editData = {
      registrationNo: student.registrationNo,
      name: student.name,
      fatherName: student.fatherName,
      rollNo: student.rollNo,
      nic: student.nic || '',
      gender: student.gender || '',
      religion: student.religion || '',
      dateOfBirth: student.dateOfBirth ? student.dateOfBirth.split('T')[0] : '',
      joiningDate: student.joiningDate ? student.joiningDate.split('T')[0] : '',
      program: student.program,
      session: student.session,
      class: student.class,
      section: student.section || '',
      classId: student.classId || '',
      sectionId: student.sectionId || '',
      phoneNumber: student.phoneNumber,
      email: student.email || '',
      currentAddress: student.currentAddress,
      permanentAddress: student.permanentAddress
    };
    setFormData(editData);
    setEditingId(student.id);
    
    // Fetch sections for the selected class if classId exists
    if (student.classId) {
      await fetchSectionsForClass(student.classId, true);
    } else {
      setFormSections([]);
    }
    
    setShowModal(true);
  };

  // Calculate fee statistics for a student
  const calculateFeeStats = (student) => {
    if (!student.fees || student.fees.length === 0) {
      return {
        totalMonths: 0,
        paidMonths: 0,
        unpaidMonths: 0,
        overdueMonths: 0,
        totalAmount: 0,
        paidAmount: 0,
        unpaidAmount: 0,
        overdueAmount: 0,
        remainingAmount: 0
      };
    }

    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];
    const currentDate = new Date();
    const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

    const totalMonths = student.fees.length;
    const paidFees = student.fees.filter(f => f.paid);
    const unpaidFees = student.fees.filter(f => !f.paid);
    
    const paidMonths = paidFees.length;
    const unpaidMonths = unpaidFees.length;

    // Calculate overdue fees
    const overdueFees = unpaidFees.filter(fee => {
      const [monthName, year] = fee.month.split(' ');
      const monthIndex = monthNames.indexOf(monthName);
      if (monthIndex === -1) return false;
      const feeDate = new Date(parseInt(year), monthIndex, 1);
      return feeDate < currentMonth;
    });
    const overdueMonths = overdueFees.length;

    // Calculate amounts
    const totalAmount = student.fees.reduce((sum, fee) => sum + parseFloat(fee.amount || 0), 0);
    const paidAmount = paidFees.reduce((sum, fee) => sum + parseFloat(fee.amount || 0), 0);
    const unpaidAmount = unpaidFees.reduce((sum, fee) => sum + parseFloat(fee.amount || 0), 0);
    const overdueAmount = overdueFees.reduce((sum, fee) => sum + parseFloat(fee.amount || 0), 0);
    const remainingAmount = unpaidAmount; // Remaining = unpaid amount

    return {
      totalMonths,
      paidMonths,
      unpaidMonths,
      overdueMonths,
      totalAmount,
      paidAmount,
      unpaidAmount,
      overdueAmount,
      remainingAmount
    };
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormSections([]);
    setFormData({
      registrationNo: '',
      name: '',
      fatherName: '',
      rollNo: '',
      nic: '',
      gender: '',
      religion: '',
      dateOfBirth: '',
      joiningDate: '',
      program: '',
      session: '',
      class: '',
      section: '',
      classId: '',
      sectionId: '',
      phoneNumber: '',
      email: '',
      currentAddress: '',
      permanentAddress: ''
    });
  };


  const handleChange = async (e) => {
    const { name, value } = e.target;
    
    if (name === 'classId') {
      const classId = value ? parseInt(value) : '';
      const selectedClass = classes.find(c => c.id === classId);
      
      setFormData({
        ...formData,
        classId: classId,
        sectionId: '', // Clear section when class changes
        class: selectedClass ? selectedClass.name : '',
        section: ''
      });
      
      // Fetch sections for the selected class
      if (classId) {
        await fetchSectionsForClass(classId, true);
      } else {
        setFormSections([]);
      }
    } else if (name === 'sectionId') {
      const sectionId = value ? parseInt(value) : '';
      const selectedSection = formSections.find(s => s.id === sectionId);
      
      setFormData({
        ...formData,
        sectionId: sectionId,
        section: selectedSection ? selectedSection.name : ''
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
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
            Student Management
          </h1>
          {classFilter && (
            <Link
              to="/classes"
              style={{
                padding: '6px 12px',
                backgroundColor: '#337ab7',
                color: '#fff',
                textDecoration: 'none',
                borderRadius: '4px',
                fontSize: '13px'
              }}
            >
              ← Back to Classes
            </Link>
          )}
        </div>
        {classFilter && (
          <p style={{ margin: '5px 0 0 0', color: '#777', fontSize: '13px' }}>
            Showing students from: <strong>{classFilter}</strong>
          </p>
        )}
      </div>

      {/* Filters Section */}
      <div style={{
        padding: '15px',
        backgroundColor: '#fff',
        border: '1px solid #ddd',
        borderRadius: '4px',
        marginBottom: '20px'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '15px', fontSize: '16px', fontWeight: 'bold' }}>
          <i className="fas fa-filter" style={{ marginRight: '8px', color: '#337ab7' }}></i>
          Filter Students
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold' }}>
              Class:
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => {
                const newClassId = e.target.value ? parseInt(e.target.value) : '';
                setSelectedClassId(newClassId);
                setSelectedSectionId(''); // Clear section when class changes
                // Update URL without page reload
                const params = new URLSearchParams(window.location.search);
                if (newClassId) {
                  params.set('classId', newClassId);
                  params.delete('class'); // Remove old class name filter
                  params.delete('sectionId'); // Clear section when changing class
                } else {
                  params.delete('classId');
                  params.delete('sectionId');
                }
                window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
                // Fetch sections for the new class
                if (newClassId) {
                  fetchSectionsForClass(newClassId);
                } else {
                  setSections([]);
                }
                // Trigger fetch with new values immediately
                fetchStudents(newClassId, '');
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '14px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            >
              <option value="">All Classes</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({cls.program})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold' }}>
              Section:
            </label>
            <select
              value={selectedSectionId}
              onChange={(e) => {
                const newSectionId = e.target.value ? parseInt(e.target.value) : '';
                setSelectedSectionId(newSectionId);
                // Update URL
                const params = new URLSearchParams(window.location.search);
                if (newSectionId) {
                  params.set('sectionId', newSectionId);
                } else {
                  params.delete('sectionId');
                }
                window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
                // Trigger fetch with new values immediately
                fetchStudents(selectedClassId, newSectionId);
              }}
              disabled={!selectedClassId}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '14px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                backgroundColor: !selectedClassId ? '#f5f5f5' : '#fff'
              }}
            >
              <option value="">All Sections</option>
              {sections.map(section => (
                <option key={section.id} value={section.id}>
                  {section.name} ({section.activeStudentsCount || 0} students)
                </option>
              ))}
            </select>
          </div>
          <div>
            <button
              onClick={() => {
                setSelectedClassId('');
                setSelectedSectionId('');
                setSections([]);
                const params = new URLSearchParams();
                window.history.pushState({}, '', window.location.pathname);
                fetchStudents('', '');
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '14px',
                color: '#333',
                backgroundColor: '#fff',
                border: '1px solid #ccc',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Clear Filters
            </button>
          </div>
        </div>
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
          Search Student
        </h3>
        <p style={{ fontSize: '12px', color: '#777', margin: '0 0 10px 0' }}>
          Search by Registration Number, Roll Number, Name, or NIC
        </p>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter registration number, roll number, name, or NIC..."
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
            {searchResults.map((student) => (
              <div
                key={student.id}
                style={{
                  padding: '15px',
                  backgroundColor: '#f9f9f9',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
                onClick={() => viewStudentDetails(student)}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: '0 0 5px 0', fontSize: '16px', fontWeight: 'bold' }}>
                      {student.name}
                    </h4>
                    <p style={{ margin: '2px 0', fontSize: '13px', color: '#666' }}>
                      <strong>Roll No:</strong> {student.rollNo} | 
                      <strong> Reg No:</strong> {student.registrationNo} |
                      {student.nic && <><strong> NIC:</strong> {student.nic}</>}
                    </p>
                    <p style={{ margin: '2px 0', fontSize: '13px', color: '#666' }}>
                      <strong>Class:</strong> {student.class} ({student.program}) | 
                      <strong> Session:</strong> {student.session}
                    </p>
                    {student.feeStatus && (
                      <p style={{ margin: '5px 0 0 0', fontSize: '12px' }}>
                        <span style={{ 
                          padding: '2px 6px', 
                          backgroundColor: student.feeStatus.overdue > 0 ? '#f2dede' : '#dff0d8',
                          color: student.feeStatus.overdue > 0 ? '#a94442' : '#3c763d',
                          borderRadius: '3px'
                        }}>
                          Fees: {student.feeStatus.paid}/{student.feeStatus.total} paid
                          {student.feeStatus.overdue > 0 && ` (${student.feeStatus.overdue} overdue)`}
                        </span>
                      </p>
                    )}
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
            ? 'You have read-only access to student records.'
            : 'Manage all student records and information.'}
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
            Add New Student
          </button>
        )}
      </div>

      {/* Students Table */}
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
              <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'left', whiteSpace: 'nowrap' }}>Class</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'left', whiteSpace: 'nowrap' }}>Session</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'left', whiteSpace: 'nowrap' }}>Section</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'left', whiteSpace: 'nowrap' }}>Phone</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'left', whiteSpace: 'nowrap' }}>Email</th>
              {isAdmin && (
                <th style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'center', whiteSpace: 'nowrap' }}>Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? "10" : "9"} style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                  No students found. {isAdmin && 'Click "Add New Student" to create one.'}
                </td>
              </tr>
            ) : (
              students.map((student) => (
                <tr key={student.id}>
                  <td style={{ padding: '8px', border: '1px solid #ddd', whiteSpace: 'nowrap' }}>{student.registrationNo}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', whiteSpace: 'nowrap' }}>{student.rollNo}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', whiteSpace: 'nowrap' }}>{student.name}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', whiteSpace: 'nowrap' }}>{student.fatherName}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', whiteSpace: 'nowrap' }}>{student.classRelation?.name || student.class}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', whiteSpace: 'nowrap' }}>{student.session}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', whiteSpace: 'nowrap' }}>
                    {student.sectionRelation?.name || student.section || 'N/A'}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', whiteSpace: 'nowrap' }}>{student.phoneNumber}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', whiteSpace: 'nowrap' }}>{student.email}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', whiteSpace: 'nowrap' }}>
                    <button
                      onClick={async () => {
                        // Fetch full student data with fees
                        try {
                          const response = await studentService.getById(student.id);
                          setViewingStudent(response.data.student);
                          setShowViewModal(true);
                          setShowFeeDetails(false); // Reset to hidden
                          setShowAcademicDetails(false); // Reset to hidden
                        } catch (error) {
                          console.error('Failed to fetch student details:', error);
                          setViewingStudent(student);
                          setShowViewModal(true);
                          setShowFeeDetails(false);
                          setShowAcademicDetails(false);
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
                          onClick={() => handleEdit(student)}
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
                          onClick={() => handleDelete(student.id)}
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

      {/* Add/Edit Student Modal */}
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
                {editingId ? 'Edit Student' : 'Add New Student'}
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
                      Roll No:
                    </label>
                    <input
                      type="text"
                      name="rollNo"
                      value={formData.rollNo}
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
                      placeholder="National Identity Card Number"
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
                      <option value="MALE">Boys</option>
                      <option value="FEMALE">Girls</option>
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
                          // Trigger the date picker when clicking on the text field
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
                      <span
                        style={{
                          position: 'absolute',
                          right: '8px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          pointerEvents: 'none',
                          color: '#666',
                          fontSize: '14px',
                          zIndex: 0
                        }}
                      >
                        📅
                      </span>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      Program:
                    </label>
                    <select
                      name="program"
                      value={formData.program}
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
                      <option value="">Select Program</option>
                      {programs.length === 0 ? (
                        <option value="" disabled>No programs available. Please create a program in Settings first.</option>
                      ) : (
                        programs.map(prog => (
                          <option key={prog.id} value={prog.name || prog.program}>
                            {prog.name || prog.program}
                          </option>
                        ))
                      )}
                    </select>
                    {programs.length === 0 && (
                      <p style={{ fontSize: '11px', color: '#d9534f', margin: '5px 0 0 0' }}>
                        No programs found. Please create a program in the Settings page first.
                      </p>
                    )}
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      Session:
                    </label>
                    <select
                      name="session"
                      value={formData.session}
                      onChange={handleChange}
                      required
                      disabled={!formData.program || academicSessions.length === 0}
                      style={{
                        width: '100%',
                        padding: '6px 12px',
                        fontSize: '14px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        backgroundColor: (!formData.program || academicSessions.length === 0) ? '#f5f5f5' : '#fff',
                        cursor: (!formData.program || academicSessions.length === 0) ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <option value="">
                        {!formData.program 
                          ? 'Select Program first' 
                          : academicSessions.length === 0 
                            ? 'No sessions available for this program' 
                            : 'Select Academic Session'}
                      </option>
                      {academicSessions.map((session) => (
                        <option key={session.value} value={session.value}>{session.label}</option>
                      ))}
                    </select>
                    {formData.program && academicSessions.length === 0 && (
                      <p style={{ fontSize: '11px', color: '#d9534f', margin: '5px 0 0 0' }}>
                        No sessions found for this program. Please create sessions in the Settings page and link them to this program.
                      </p>
                    )}
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      Class:
                    </label>
                    <select
                      name="classId"
                      value={formData.classId}
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
                      <option value="">Select Class</option>
                      {classes.map(cls => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name} ({cls.program})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      Section:
                    </label>
                    <select
                      name="sectionId"
                      value={formData.sectionId}
                      onChange={handleChange}
                      disabled={!formData.classId}
                      style={{
                        width: '100%',
                        padding: '6px 12px',
                        fontSize: '14px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        backgroundColor: !formData.classId ? '#f5f5f5' : '#fff'
                      }}
                    >
                      <option value="">Select Section (Optional)</option>
                      {formSections.map(section => (
                        <option key={section.id} value={section.id}>
                          {section.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      Joining Date:
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
                          // Trigger the date picker when clicking on the text field
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
                      />
                      <span
                        style={{
                          position: 'absolute',
                          right: '8px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          pointerEvents: 'none',
                          color: '#666',
                          fontSize: '14px',
                          zIndex: 0
                        }}
                      >
                        📅
                      </span>
                    </div>
                  </div>

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

      {/* View Student Profile Modal */}
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
                Student Profile: {viewingStudent.name}
              </h4>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setViewingStudent(null);
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

                {/* Academic Information Section - Shows only active/current session and program */}
                {(() => {
                  // Determine current/active session, class, and program
                  // If student has promotions, get the latest promotion's newClass and newSession
                  // Otherwise, use the student's current values
                  let activeSession = viewingStudent.session;
                  let activeClass = viewingStudent.classRelation?.name || viewingStudent.class;
                  let activeProgram = viewingStudent.classRelation?.program || viewingStudent.program;
                  let activeSection = viewingStudent.sectionRelation?.name || viewingStudent.section;
                  
                  // If there are promotions, the last promotion contains the current/active information
                  if (viewingStudent.promotions && viewingStudent.promotions.length > 0) {
                    const lastPromotion = viewingStudent.promotions[viewingStudent.promotions.length - 1];
                    activeSession = lastPromotion.newSession;
                    activeClass = lastPromotion.newClass;
                    // Program should come from the class relation, but if not available, try to get from the last promotion's class
                    // For now, we'll use the current student's program since promotion doesn't change program
                    activeProgram = viewingStudent.classRelation?.program || viewingStudent.program;
                  }
                  
                  return (
                <div style={{
                  padding: '15px',
                  backgroundColor: '#f9f9f9',
                  borderRadius: '4px',
                  border: '1px solid #e0e0e0'
                }}>
                  <h5 style={{ margin: '0 0 15px 0', color: '#337ab7', borderBottom: '2px solid #337ab7', paddingBottom: '8px' }}>
                    <i className="fas fa-book" style={{ marginRight: '8px' }}></i>
                        Academic Information (Active)
                  </h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <strong style={{ color: '#555', fontSize: '12px' }}>Program:</strong>
                          <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>{activeProgram}</p>
                    </div>
                    <div>
                      <strong style={{ color: '#555', fontSize: '12px' }}>Academic Session:</strong>
                          <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>{activeSession}</p>
                    </div>
                    <div>
                      <strong style={{ color: '#555', fontSize: '12px' }}>Class:</strong>
                          <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>{activeClass}</p>
                    </div>
                    <div>
                      <strong style={{ color: '#555', fontSize: '12px' }}>Section:</strong>
                      <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>
                            {activeSection || 'N/A'}
                      </p>
                    </div>
                        {viewingStudent.joiningDate && (
                          <div>
                            <strong style={{ color: '#555', fontSize: '12px' }}>Joining Date:</strong>
                            <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>
                              {(() => {
                                const date = new Date(viewingStudent.joiningDate);
                                const day = date.getUTCDate().toString().padStart(2, '0');
                                const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
                                const year = date.getUTCFullYear();
                                return `${day}/${month}/${year}`;
                              })()}
                            </p>
                          </div>
                        )}
                    <div>
                      <strong style={{ color: '#555', fontSize: '12px' }}>Status:</strong>
                      <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '3px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          backgroundColor: viewingStudent.status === 'ACTIVE' ? '#5cb85c' : 
                                        viewingStudent.status === 'PROMOTED' ? '#337ab7' : 
                                        viewingStudent.status === 'GRADUATED' ? '#5bc0de' : '#d9534f',
                          color: '#fff'
                        }}>
                          {viewingStudent.status}
                        </span>
                      </p>
                      {viewingStudent.leavingDate && (viewingStudent.status === 'GRADUATED' || viewingStudent.status === 'DROPPED') && (
                        <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#666' }}>
                              <strong>Leaving Date:</strong> {(() => {
                                const date = new Date(viewingStudent.leavingDate);
                                // Use UTC methods to avoid timezone conversion
                                const day = date.getUTCDate().toString().padStart(2, '0');
                                const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
                                const year = date.getUTCFullYear();
                                return `${day}/${month}/${year}`;
                              })()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                  );
                })()}
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
                          {(() => {
                            const day = joiningDate.getUTCDate().toString().padStart(2, '0');
                            const month = (joiningDate.getUTCMonth() + 1).toString().padStart(2, '0');
                            const year = joiningDate.getUTCFullYear();
                            return `${day}/${month}/${year}`;
                          })()}
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
                                      {entry.startDate ? (() => {
                                        const date = new Date(entry.startDate);
                                        // Use UTC methods to avoid timezone conversion
                                        const day = date.getUTCDate().toString().padStart(2, '0');
                                        const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
                                        const year = date.getUTCFullYear();
                                        return `${day}/${month}/${year}`;
                                      })() : 'N/A'}
                                    </td>
                                    <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center', fontSize: '12px' }}>
                                      {entry.endDate ? (() => {
                                        const date = new Date(entry.endDate);
                                        // Use UTC methods to avoid timezone conversion
                                        const day = date.getUTCDate().toString().padStart(2, '0');
                                        const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
                                        const year = date.getUTCFullYear();
                                        return `${day}/${month}/${year}`;
                                      })() : 'Present'}
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

              {/* Additional Info */}
              <div style={{
                marginTop: '20px',
                padding: '10px',
                backgroundColor: '#e8f4f8',
                borderRadius: '4px',
                fontSize: '12px',
                color: '#555'
              }}>
                <strong>Record Created:</strong> {new Date(viewingStudent.createdAt).toLocaleDateString()} at {new Date(viewingStudent.createdAt).toLocaleTimeString()}
                {viewingStudent.updatedAt && (
                  <span style={{ marginLeft: '15px' }}>
                    <strong>Last Updated:</strong> {new Date(viewingStudent.updatedAt).toLocaleDateString()} at {new Date(viewingStudent.updatedAt).toLocaleTimeString()}
                  </span>
                )}
              </div>
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
              {isAdmin && viewingStudent?.status === 'ACTIVE' && (
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
                    setViewingStudent(null);
                    setShowFeeDetails(false);
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
                      setShowFeeDetails(false);
                      handleEdit(viewingStudent);
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
                    Edit Student
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Modal for Status Change */}
      {showActionModal && viewingStudent && (
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
                Student Action
              </h4>
              <button
                onClick={() => {
                  setShowActionModal(false);
                  setActionType('');
                  setActionDescription('');
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
                Select an action for <strong>{viewingStudent.name}</strong>:
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
                  <option value="GRADUATED">Promote to Alumni (Graduated)</option>
                  <option value="DROPPED">Mark as Dropped/Expelled</option>
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
                  placeholder={`Enter description or reason for ${actionType === 'GRADUATED' ? 'graduation' : actionType === 'DROPPED' ? 'dropping/expulsion' : 'this action'}...`}
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
                  
                  if (!confirm(`Are you sure you want to ${actionType === 'GRADUATED' ? 'promote this student to Alumni (Graduated)' : 'mark this student as Dropped/Expelled'}?`)) {
                    return;
                  }

                  try {
                    // Format date as YYYY-MM-DD (ensure proper padding)
                    const paddedDay = actionDay.padStart(2, '0');
                    const paddedMonth = actionMonth.padStart(2, '0');
                    const actionDate = `${actionYear}-${paddedMonth}-${paddedDay}`;
                    await studentService.changeStatus(viewingStudent.id, actionType, actionDescription, actionDate);
                    alert(`Student status updated to ${actionType} successfully!`);
                    setShowActionModal(false);
                    setShowViewModal(false);
                    setViewingStudent(null);
                    setActionType('');
                    setActionDescription('');
                    setActionDay('');
                    setActionMonth('');
                    setActionYear('');
                    fetchStudents();
                  } catch (error) {
                    alert(error.response?.data?.message || 'Failed to update student status');
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

export default Students;
