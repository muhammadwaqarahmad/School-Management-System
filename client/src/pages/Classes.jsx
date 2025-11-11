import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import classService from '../services/classService';
import sectionService from '../services/sectionService';
import promotionService from '../services/promotionService';
import settingsService from '../services/settingsService';
import studentService from '../services/studentService';
import Loader from '../components/Loader';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../utils/constants';

const Classes = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedClassForSections, setSelectedClassForSections] = useState(null);
  const [sections, setSections] = useState([]);
  const [sectionFormData, setSectionFormData] = useState({ name: '' });
  const [editingSection, setEditingSection] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    program: ''
  });
  const [promotionData, setPromotionData] = useState({
    currentClass: '',
    nextClass: '',
    session: '',
    promotionType: 'ALL',
    action: 'PROMOTE',
    sourceSectionIds: [], // Sections to promote FROM
    targetSectionId: '' // Section to promote TO
  });
  const [students, setStudents] = useState([]);
  const [currentClassSections, setCurrentClassSections] = useState([]);
  const [nextClassSections, setNextClassSections] = useState([]);
  const [currentClassId, setCurrentClassId] = useState(null);
  const [nextClassId, setNextClassId] = useState(null);

  const isAdmin = user?.role === ROLES.ADMIN || user?.role === ROLES.SUPER_ADMIN;

  // Resolve current session for a given program from settings
  const getCurrentSessionForProgram = async (program) => {
    try {
      const resp = await settingsService.getSessions(program);
      const list = resp.data?.sessions || resp.sessions || [];
      const current = list.find(s => s.isCurrent);
      return current?.session || '';
    } catch {
      return '';
    }
  };

  useEffect(() => {
    fetchClasses();
    fetchPrograms();
    if (showPromoteModal) {
      fetchClassesForPromotion();
    }
  }, [showPromoteModal]);

  const fetchClasses = async () => {
    try {
      const response = await classService.getAll();
      if (response.success && response.data) {
        setClasses(response.data.classes || []);
      }
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const fetchClassesForPromotion = async () => {
    try {
      const response = await promotionService.getClasses();
      if (response.success && response.data) {
        setAvailableClasses(response.data.classes || []);
      }
    } catch (error) {
      console.error('Failed to fetch classes for promotion');
    }
  };

  const fetchStudentsForClass = async (className) => {
    try {
      const response = await studentService.getAll({ class: className });
      const studentsList = response.data?.students || response.students || [];
      setStudents(studentsList.filter(s => s.status === 'ACTIVE'));
    } catch (error) {
      console.error('Failed to fetch students');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await classService.create(formData);
      alert('Class created successfully!');
      fetchClasses();
      handleCloseModal();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create class');
    }
  };

  const handlePromote = async () => {
    if (!promotionData.currentClass || (promotionData.action === 'PROMOTE' && !promotionData.nextClass)) {
      alert('Please select both current and next class');
      return;
    }

    if (promotionData.promotionType === 'SELECTED' && selectedStudents.length === 0) {
      alert('Please select at least one student to promote');
      return;
    }

    // If sections exist and user selected "ALL" students, require section selection
    // But if sections don't exist or user selected specific students, it's optional
    if (promotionData.promotionType === 'ALL' && currentClassSections.length > 0 && promotionData.sourceSectionIds.length === 0) {
      alert('Please select at least one source section to promote from, or switch to "Promote Selected Students" mode');
      return;
    }

    // Target section is required only if the next class has sections
    if (promotionData.action === 'PROMOTE' && nextClassSections.length > 0 && !promotionData.targetSectionId) {
      alert('Please select a target section for the new class');
      return;
    }

    try {
      const data = {
        ...promotionData,
        studentIds: promotionData.promotionType === 'SELECTED' ? selectedStudents : null,
        session: promotionData.session || '',
        sourceSectionIds: promotionData.sourceSectionIds.length > 0 ? promotionData.sourceSectionIds.map(id => parseInt(id)) : null,
        targetSectionId: promotionData.targetSectionId ? parseInt(promotionData.targetSectionId) : null
      };

      const response = await promotionService.promote(data);
      if (response.success) {
        alert(response.message);
        fetchClasses();
        handleClosePromoteModal();
        // Refresh students if viewing a class
        if (selectedClass) {
          fetchStudentsForClass(selectedClass);
        }
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to promote students');
    }
  };

  const handleOpenPromoteModal = async (className) => {
    setSelectedClass(className);
    // Find the class to get its ID
    const classItem = classes.find(c => c.name === className);
    if (classItem) {
      setCurrentClassId(classItem.id);
      // Fetch sections for current class
      try {
        const response = await sectionService.getByClass(classItem.id);
        if (response.success && response.data) {
          setCurrentClassSections(response.data.sections || []);
        }
      } catch (error) {
        console.error('Failed to fetch sections');
      }
    }
    
    setPromotionData({
      currentClass: className,
      nextClass: '',
      session: '',
      promotionType: 'ALL',
      action: 'PROMOTE',
      sourceSectionIds: [],
      targetSectionId: ''
    });
    setSelectedStudents([]);
    fetchStudentsForClass(className);
    setNextClassSections([]);
    setNextClassId(null);
    setShowPromoteModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({ name: '', program: '' });
  };

  const handleOpenSectionModal = async (classItem) => {
    setSelectedClassForSections(classItem);
    setShowSectionModal(true);
    await fetchSections(classItem.id);
  };

  const fetchSections = async (classId) => {
    try {
      const response = await sectionService.getByClass(classId);
      if (response.success && response.data) {
        setSections(response.data.sections || []);
      }
    } catch (error) {
      console.error('Failed to fetch sections:', error);
      alert('Failed to load sections');
    }
  };

  const handleSectionSubmit = async (e) => {
    e.preventDefault();
    if (!sectionFormData.name.trim()) {
      alert('Section name is required');
      return;
    }

    try {
      if (editingSection) {
        await sectionService.update(editingSection.id, { name: sectionFormData.name.trim() });
        alert('Section updated successfully!');
      } else {
        await sectionService.create(selectedClassForSections.id, { name: sectionFormData.name.trim() });
        alert('Section created successfully!');
      }
      await fetchSections(selectedClassForSections.id);
      setSectionFormData({ name: '' });
      setEditingSection(null);
      fetchClasses(); // Refresh classes to update section counts
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to save section');
    }
  };

  const handleSectionEdit = (section) => {
    setEditingSection(section);
    setSectionFormData({ name: section.name });
  };

  const handleSectionDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to delete section "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await sectionService.delete(id);
      alert('Section deleted successfully!');
      await fetchSections(selectedClassForSections.id);
      fetchClasses(); // Refresh classes to update section counts
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete section');
    }
  };

  const handleCloseSectionModal = () => {
    setShowSectionModal(false);
    setSelectedClassForSections(null);
    setSections([]);
    setSectionFormData({ name: '' });
    setEditingSection(null);
  };

  const handleClosePromoteModal = () => {
    setShowPromoteModal(false);
    setSelectedClass(null);
    setSelectedStudents([]);
    setStudents([]);
    setCurrentClassSections([]);
    setNextClassSections([]);
    setCurrentClassId(null);
    setNextClassId(null);
    setPromotionData({
      currentClass: '',
      nextClass: '',
      session: '',
      promotionType: 'ALL',
      action: 'PROMOTE',
      sourceSectionIds: [],
      targetSectionId: ''
    });
  };

  const handleDeleteClass = async (classItem) => {
    // Check if class has active students
    if (classItem.activeStudentsCount > 0) {
      alert(`Cannot delete class "${classItem.name}". It has ${classItem.activeStudentsCount} active student(s). Please remove or reassign students first.`);
      return;
    }

    // Check if class has sections
    if (classItem.sections && classItem.sections.length > 0) {
      const sectionsWithStudents = classItem.sections.filter(s => (s.activeStudentsCount || 0) > 0);
      if (sectionsWithStudents.length > 0) {
        alert(`Cannot delete class "${classItem.name}". Some sections have active students.`);
        return;
      }
    }

    if (!confirm(`Are you sure you want to delete class "${classItem.name}"?\n\nThis will also delete all associated sections. This action cannot be undone.`)) {
      return;
    }

    try {
      await classService.delete(classItem.id);
      alert('Class deleted successfully!');
      fetchClasses();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete class');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePromotionChange = async (e) => {
    const { name, value } = e.target;
    
    setPromotionData({
      ...promotionData,
      [name]: value
    });
    
    // When next class is selected, fetch its sections
    if (name === 'nextClass' && value) {
      const classItem = availableClasses.find(c => c.name === value);
      if (classItem) {
        setNextClassId(classItem.id);
        try {
          const response = await sectionService.getByClass(classItem.id);
          if (response.success && response.data) {
            setNextClassSections(response.data.sections || []);
          }
        } catch (error) {
          console.error('Failed to fetch sections for next class');
          setNextClassSections([]);
        }
        // Also resolve current session for the program of the next class
        try {
          const sessionStr = await getCurrentSessionForProgram(classItem.program);
          if (sessionStr) {
            setPromotionData(prev => ({ ...prev, session: sessionStr }));
          }
        } catch {}
      }
    } else if (name === 'nextClass' && !value) {
      setNextClassSections([]);
      setNextClassId(null);
    }
  };
  
  const handleSourceSectionToggle = (sectionId) => {
    setPromotionData({
      ...promotionData,
      sourceSectionIds: promotionData.sourceSectionIds.includes(sectionId)
        ? promotionData.sourceSectionIds.filter(id => id !== sectionId)
        : [...promotionData.sourceSectionIds, sectionId]
    });
  };

  const toggleStudentSelection = (studentId) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
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
            <Link to="/classes" style={{ color: '#337ab7', textDecoration: 'none' }}>
              Classes
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
          <i className="fas fa-chalkboard-teacher" style={{ color: '#337ab7' }}></i>
          Class Management
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
          <strong>Note!</strong> Manage classes and promote students to next academic sessions.
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
            Add New Class
          </button>
        )}
      </div>

      {/* Classes Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
        gap: '20px',
        marginBottom: '20px'
      }}>
        {classes.map((classItem) => (
          <div
            key={classItem.id}
            style={{
              padding: '20px',
              backgroundColor: '#fff',
              border: '2px solid #ddd',
              borderRadius: '4px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
              <div>
                <h3 style={{ margin: '0 0 5px 0', fontSize: '18px', fontWeight: 'bold', color: '#337ab7' }}>
                  {classItem.name}
                </h3>
                <p style={{ margin: '0', fontSize: '13px', color: '#777' }}>
                  {classItem.program}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#5cb85c' }}>
                  {classItem.activeStudentsCount || 0}
                </div>
                <div style={{ fontSize: '11px', color: '#999' }}>Students</div>
              </div>
            </div>

            {/* Sections */}
            {classItem.sections && classItem.sections.length > 0 && (
              <div style={{ marginBottom: '15px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
                <strong style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '5px' }}>Sections:</strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {classItem.sections.map((section) => (
                    <span
                      key={section.id}
                      style={{
                        padding: '4px 10px',
                        backgroundColor: '#e8f4f8',
                        borderRadius: '3px',
                        fontSize: '11px',
                        color: '#555',
                        border: '1px solid #bce8f1'
                      }}
                    >
                      {section.name} ({section.activeStudentsCount || 0})
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '15px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Link
                  to={`/students?classId=${classItem.id}`}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    backgroundColor: '#337ab7',
                    color: '#fff',
                    textDecoration: 'none',
                    borderRadius: '4px',
                    textAlign: 'center',
                    fontSize: '13px',
                    display: 'block'
                  }}
                >
                  View Students
                </Link>
                {isAdmin && (
                  <button
                    onClick={() => handleOpenPromoteModal(classItem.name)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      backgroundColor: '#f0ad4e',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    Promote
                  </button>
                )}
              </div>
              {isAdmin && (
                <>
                  <button
                    onClick={() => handleOpenSectionModal(classItem)}
                    style={{
                      width: '100%',
                      padding: '6px 12px',
                      backgroundColor: '#5bc0de',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    <i className="fas fa-cog" style={{ marginRight: '5px' }}></i>
                    Manage Sections
                  </button>
                  <button
                    onClick={() => handleDeleteClass(classItem)}
                    style={{
                      width: '100%',
                      padding: '6px 12px',
                      backgroundColor: '#d9534f',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#c9302c'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#d9534f'}
                  >
                    <i className="fas fa-trash" style={{ marginRight: '5px' }}></i>
                    Delete Class
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {classes.length === 0 && (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center', 
          color: '#999',
          backgroundColor: '#f9f9f9',
          borderRadius: '4px'
        }}>
          <i className="fas fa-chalkboard-teacher" style={{ fontSize: '48px', marginBottom: '15px', display: 'block' }}></i>
          <p>No classes found. {isAdmin && 'Click "Add New Class" to create one.'}</p>
        </div>
      )}

      {/* Add Class Modal */}
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
            <div style={{
              padding: '15px',
              borderBottom: '1px solid #e5e5e5',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 500 }}>Add New Class</h4>
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
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ padding: '15px' }}>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Class Name:
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="e.g., Class 1, Class 2, Grade 1"
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

              </div>

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
                >
                  Create
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
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Promote Class Modal */}
      {showPromoteModal && (
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
          overflow: 'auto',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '6px',
            boxShadow: '0 5px 15px rgba(0,0,0,0.5)',
            width: '90%',
            maxWidth: '700px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{
              padding: '15px',
              borderBottom: '1px solid #e5e5e5',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'sticky',
              top: 0,
              backgroundColor: '#fff',
              zIndex: 1
            }}>
              <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 500 }}>
                Promote Class: {selectedClass}
              </h4>
              <button
                onClick={handleClosePromoteModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '21px',
                  fontWeight: 'bold',
                  color: '#000',
                  opacity: 0.2,
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: '20px' }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Action:
                </label>
                <select
                  name="action"
                  value={promotionData.action}
                  onChange={handlePromotionChange}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '14px',
                    border: '1px solid #ccc',
                    borderRadius: '4px'
                  }}
                >
                  <option value="PROMOTE">Promote to Next Class</option>
                  <option value="REPEAT">Repeat in Same Class</option>
                </select>
              </div>

              {promotionData.action === 'PROMOTE' && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Next Class:
                  </label>
                  <select
                    name="nextClass"
                    value={promotionData.nextClass}
                    onChange={handlePromotionChange}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: '14px',
                      border: '1px solid #ccc',
                      borderRadius: '4px'
                    }}
                  >
                    <option value="">Select Next Class</option>
                    {availableClasses
                      .filter(c => c.name !== selectedClass)
                      .map(cls => (
                        <option key={cls.id} value={cls.name}>
                          {cls.name} ({cls.program})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Source Sections Selection (Current Class) */}
              {currentClassSections.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                    Promote From Sections (Current Class):
                  </label>
                  <div style={{ 
                    border: '1px solid #ddd', 
                    borderRadius: '4px', 
                    padding: '10px',
                    maxHeight: '150px',
                    overflowY: 'auto',
                    backgroundColor: '#f9f9f9'
                  }}>
                    {currentClassSections.length === 0 ? (
                      <p style={{ color: '#999', fontSize: '13px', margin: 0 }}>No sections in this class</p>
                    ) : (
                      currentClassSections.map(section => (
                        <label
                          key={section.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '6px',
                            marginBottom: '5px',
                            backgroundColor: promotionData.sourceSectionIds.includes(section.id) ? '#e7f3ff' : '#fff',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={promotionData.sourceSectionIds.includes(section.id)}
                            onChange={() => handleSourceSectionToggle(section.id)}
                            style={{ marginRight: '8px' }}
                          />
                          <span style={{ fontSize: '13px' }}>
                            {section.name} ({section.activeStudentsCount || 0} students)
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                  <small style={{ color: '#666', fontSize: '11px' }}>
                    Select which sections to promote from. If none selected, all sections will be promoted.
                  </small>
                </div>
              )}

              {/* Target Section Selection (Next Class) */}
              {promotionData.action === 'PROMOTE' && nextClassSections.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Promote To Section (Next Class):
                  </label>
                  <select
                    name="targetSectionId"
                    value={promotionData.targetSectionId}
                    onChange={(e) => setPromotionData({ ...promotionData, targetSectionId: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: '14px',
                      border: '1px solid #ccc',
                      borderRadius: '4px'
                    }}
                  >
                    <option value="">Select Target Section</option>
                    {nextClassSections.map(section => (
                      <option key={section.id} value={section.id}>
                        {section.name} ({section.activeStudentsCount || 0} students)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  New Session:
                </label>
                <input
                  type="text"
                  name="session"
                  value={promotionData.session}
                  onChange={handlePromotionChange}
                  placeholder="e.g., 2025-2026"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '14px',
                    border: '1px solid #ccc',
                    borderRadius: '4px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Promotion Type:
                </label>
                <select
                  name="promotionType"
                  value={promotionData.promotionType}
                  onChange={handlePromotionChange}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '14px',
                    border: '1px solid #ccc',
                    borderRadius: '4px'
                  }}
                >
                  <option value="ALL">Promote All Students</option>
                  <option value="SELECTED">Promote Selected Students</option>
                </select>
              </div>

              {promotionData.promotionType === 'SELECTED' && (
                <div style={{ marginBottom: '20px', maxHeight: '300px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '4px', padding: '10px' }}>
                  <strong style={{ display: 'block', marginBottom: '10px' }}>Select Students:</strong>
                  {students.length === 0 ? (
                    <p style={{ color: '#999', fontSize: '13px' }}>No active students in this class</p>
                  ) : (
                    students.map(student => (
                      <label
                        key={student.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '8px',
                          marginBottom: '5px',
                          backgroundColor: selectedStudents.includes(student.id) ? '#e7f3ff' : '#f9f9f9',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student.id)}
                          onChange={() => toggleStudentSelection(student.id)}
                          style={{ marginRight: '10px' }}
                        />
                        <span>{student.name} ({student.rollNo})</span>
                      </label>
                    ))
                  )}
                </div>
              )}

              <div style={{
                padding: '15px',
                backgroundColor: '#f9f9f9',
                borderRadius: '4px',
                marginBottom: '20px'
              }}>
                <strong>Summary:</strong>
                <ul style={{ margin: '10px 0 0 0', paddingLeft: '20px', fontSize: '13px' }}>
                  <li>Current Class: {selectedClass}</li>
                  <li>New Class: {promotionData.action === 'REPEAT' ? selectedClass : promotionData.nextClass || 'Not selected'}</li>
                  <li>New Session: {promotionData.session || 'Not set'}</li>
                  <li>Action: {promotionData.action === 'REPEAT' ? 'Repeat in Same Class' : 'Promote to Next Class'}</li>
                  <li>Students: {promotionData.promotionType === 'ALL' ? `All (${students.length})` : `Selected (${selectedStudents.length})`}</li>
                </ul>
              </div>

              <div style={{ textAlign: 'right' }}>
                <button
                  onClick={handlePromote}
                  style={{
                    padding: '8px 20px',
                    fontSize: '14px',
                    color: '#fff',
                    backgroundColor: '#f0ad4e',
                    border: '1px solid #eea236',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    marginRight: '10px'
                  }}
                >
                  {promotionData.action === 'REPEAT' ? 'Repeat Students' : 'Promote Students'}
                </button>
                <button
                  onClick={handleClosePromoteModal}
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
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section Management Modal */}
      {showSectionModal && selectedClassForSections && (
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
            <div style={{
              padding: '15px',
              borderBottom: '1px solid #e5e5e5',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 500 }}>
                Manage Sections - {selectedClassForSections.name}
              </h4>
              <button
                onClick={handleCloseSectionModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '21px',
                  fontWeight: 'bold',
                  color: '#000',
                  opacity: 0.2,
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: '15px' }}>
              {/* Add/Edit Section Form */}
              <form onSubmit={handleSectionSubmit} style={{ marginBottom: '20px' }}>
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '13px' }}>
                    Section Name:
                  </label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="text"
                      value={sectionFormData.name}
                      onChange={(e) => setSectionFormData({ name: e.target.value })}
                      placeholder="e.g., A, B, 1, 2"
                      required
                      style={{
                        flex: 1,
                        padding: '6px 12px',
                        fontSize: '14px',
                        border: '1px solid #ccc',
                        borderRadius: '4px'
                      }}
                    />
                    <button
                      type="submit"
                      style={{
                        padding: '6px 20px',
                        fontSize: '14px',
                        color: '#fff',
                        backgroundColor: editingSection ? '#337ab7' : '#5cb85c',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      {editingSection ? 'Update' : 'Add'}
                    </button>
                    {editingSection && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingSection(null);
                          setSectionFormData({ name: '' });
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
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </form>

              {/* Sections List */}
              <div>
                <strong style={{ fontSize: '13px', display: 'block', marginBottom: '10px' }}>
                  Existing Sections ({sections.length}):
                </strong>
                {sections.length === 0 ? (
                  <p style={{ color: '#999', fontSize: '12px', fontStyle: 'italic' }}>
                    No sections created yet. Add a section above.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {sections.map((section) => (
                      <div
                        key={section.id}
                        style={{
                          padding: '10px',
                          backgroundColor: '#f9f9f9',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <strong style={{ fontSize: '14px' }}>{section.name}</strong>
                          <span style={{ fontSize: '12px', color: '#666', marginLeft: '10px' }}>
                            {section.activeStudentsCount || 0} student(s)
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button
                            onClick={() => handleSectionEdit(section)}
                            style={{
                              padding: '4px 10px',
                              fontSize: '12px',
                              backgroundColor: '#337ab7',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '3px',
                              cursor: 'pointer'
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleSectionDelete(section.id, section.name)}
                            style={{
                              padding: '4px 10px',
                              fontSize: '12px',
                              backgroundColor: '#d9534f',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '3px',
                              cursor: 'pointer'
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{
              padding: '15px',
              borderTop: '1px solid #e5e5e5',
              textAlign: 'right'
            }}>
              <button
                onClick={handleCloseSectionModal}
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
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Classes;

