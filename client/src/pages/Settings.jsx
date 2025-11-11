import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import settingsService from '../services/settingsService';
import Loader from '../components/Loader';
import { formatCurrency } from '../utils/currencyFormatter';

const Settings = () => {
  // State for Sessions
  const [sessions, setSessions] = useState([]);
  const [sessionForm, setSessionForm] = useState({ session: '', isCurrent: false });
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [showSessionModal, setShowSessionModal] = useState(false);

  // State for Programs
  const [programs, setPrograms] = useState([]);
  const [programForm, setProgramForm] = useState({ name: '', description: '', selectedSessionIds: [] });
  const [editingProgramId, setEditingProgramId] = useState(null);
  const [showProgramModal, setShowProgramModal] = useState(false);

  // State for Fees
  const [fees, setFees] = useState([]);
  const [feeForm, setFeeForm] = useState({ programId: '', sessionId: '', feeAmount: '' });
  const [editingFeeId, setEditingFeeId] = useState(null);
  const [showFeeModal, setShowFeeModal] = useState(false);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('sessions'); // 'sessions', 'programs', 'fees'

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchSessions(),
        fetchPrograms(),
        fetchFees()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ==================== SESSIONS ====================
  const fetchSessions = async () => {
    try {
      const response = await settingsService.getSessions();
      const list = response.data?.sessions || response.sessions || [];
      setSessions(list);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const handleSessionSubmit = async (e) => {
    e.preventDefault();
    const sessionPattern = /^\d{4}-\d{4}$/;
    if (!sessionPattern.test(sessionForm.session)) {
      alert('Session format is incorrect. Please use YYYY-YYYY format (e.g., 2025-2026)');
      return;
    }
    
    try {
      const sessionData = {
        session: sessionForm.session,
        isCurrent: sessionForm.isCurrent
      };
      
      if (editingSessionId) {
        await settingsService.updateSession(editingSessionId, sessionData);
        alert('Session updated successfully!');
      } else {
        await settingsService.createSession(sessionData);
        alert('Session created successfully!');
      }
      setEditingSessionId(null);
      setSessionForm({ session: '', isCurrent: false });
      setShowSessionModal(false);
      fetchSessions();
    } catch (error) {
      alert(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleSessionEdit = (session) => {
    setEditingSessionId(session.id);
    setSessionForm({ session: session.session, isCurrent: !!session.isCurrent });
    setShowSessionModal(true);
  };

  const handleSessionDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this session?')) return;
    try {
      await settingsService.deleteSession(id);
      alert('Session deleted successfully!');
      fetchSessions();
      fetchPrograms();
      fetchFees();
    } catch (error) {
      alert('Failed to delete session');
    }
  };

  const handleSetCurrentSession = async (id) => {
    try {
      await settingsService.setCurrentSession(id);
      alert('Current session set successfully!');
      fetchSessions();
    } catch (error) {
      alert('Failed to set current session');
    }
  };

  // ==================== PROGRAMS ====================
  const fetchPrograms = async () => {
    try {
      const response = await settingsService.getPrograms();
      if (response.success && response.programs) {
        setPrograms(response.programs);
      }
    } catch (error) {
      console.error('Error fetching programs:', error);
    }
  };

  const handleProgramSubmit = async (e) => {
    e.preventDefault();
    try {
      const programData = {
        name: programForm.name,
        description: programForm.description || '',
        sessionIds: programForm.selectedSessionIds
      };
      
      if (editingProgramId) {
        await settingsService.updateProgram(editingProgramId, programData);
        alert('Program updated successfully!');
      } else {
        await settingsService.createProgram(programData);
        alert('Program created successfully!');
      }
      setEditingProgramId(null);
      setProgramForm({ name: '', description: '', selectedSessionIds: [] });
      setShowProgramModal(false);
      fetchPrograms();
    } catch (error) {
      alert(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleProgramEdit = async (program) => {
    try {
      // Use sessions from program object (already loaded with programs)
      const programSessions = program.sessions || [];
      
      // Get all sessions to find matching Unassigned sessions by session string
      const allSessionsResponse = await settingsService.getSessions();
      const allSessions = allSessionsResponse.data?.sessions || allSessionsResponse.sessions || [];
      
      // Find Unassigned sessions that match program sessions by session string
      const unassignedSessions = allSessions.filter(s => s.program === 'Unassigned');
      
      // Match program sessions to unassigned sessions by session string
      const linkedSessionIds = programSessions.map(ps => {
        const unassigned = unassignedSessions.find(us => us.session === ps.session);
        return unassigned ? unassigned.id : null;
      }).filter(id => id !== null);
      
      setProgramForm({
        name: program.name,
        description: program.description || '',
        selectedSessionIds: linkedSessionIds
      });
      setEditingProgramId(program.id);
      setShowProgramModal(true);
    } catch (error) {
      console.error('Error fetching program sessions:', error);
      // Fallback: use sessionIds if available in program object
      setProgramForm({
        name: program.name,
        description: program.description || '',
        selectedSessionIds: program.sessionIds || []
      });
      setEditingProgramId(program.id);
      setShowProgramModal(true);
    }
  };

  const handleProgramDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this program?')) return;
    try {
      await settingsService.deleteProgram(id);
      alert('Program deleted successfully!');
      fetchPrograms();
      fetchFees();
    } catch (error) {
      alert('Failed to delete program');
    }
  };

  const handleProgramSessionToggle = (sessionId) => {
    setProgramForm(prev => {
      const isSelected = prev.selectedSessionIds.includes(sessionId);
      if (isSelected) {
        return {
          ...prev,
          selectedSessionIds: prev.selectedSessionIds.filter(id => id !== sessionId)
        };
      } else {
        return {
          ...prev,
          selectedSessionIds: [...prev.selectedSessionIds, sessionId]
        };
      }
    });
  };

  // ==================== FEES ====================
  const fetchFees = async () => {
    try {
      const response = await settingsService.getFees();
      if (response.success && response.fees) {
        setFees(response.fees);
      }
    } catch (error) {
      console.error('Error fetching fees:', error);
    }
  };

  const handleFeeSubmit = async (e) => {
    e.preventDefault();
    try {
      const feeData = {
        programId: parseInt(feeForm.programId),
        sessionId: parseInt(feeForm.sessionId),
        feeAmount: parseFloat(feeForm.feeAmount)
      };
      
      if (editingFeeId) {
        await settingsService.updateFee(editingFeeId, feeData);
        alert('Fee updated successfully!');
      } else {
        await settingsService.createFee(feeData);
        alert('Fee created successfully!');
      }
      setEditingFeeId(null);
      setFeeForm({ programId: '', sessionId: '', feeAmount: '' });
      setShowFeeModal(false);
      fetchFees();
    } catch (error) {
      alert(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleFeeEdit = (fee) => {
    setFeeForm({
      programId: fee.programId.toString(),
      sessionId: fee.sessionId.toString(),
      feeAmount: fee.feeAmount.toString()
    });
    setEditingFeeId(fee.id);
    setShowFeeModal(true);
  };

  const handleFeeDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this fee?')) return;
    try {
      await settingsService.deleteFee(id);
      alert('Fee deleted successfully!');
      fetchFees();
    } catch (error) {
      alert('Failed to delete fee');
    }
  };

  // Get active sessions for fee form
  const getActiveSessions = () => {
    return sessions.filter(s => s.isCurrent || sessions.some(ss => ss.session === s.session && ss.isCurrent));
  };

  // Get sessions for a specific program
  const getProgramSessions = (programId) => {
    return sessions.filter(s => {
      // This will be updated when we fetch program-session relationships
      return programs.find(p => p.id === programId)?.sessionIds?.includes(s.id);
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
            <Link to="/settings" style={{ color: '#337ab7', textDecoration: 'none' }}>
              Settings
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
          <i className="fas fa-cog" style={{ color: '#337ab7' }}></i>
          Settings
        </h1>
        <p style={{ margin: '5px 0 0 0', color: '#777', fontSize: '13px' }}>
          Manage sessions, programs, and fees
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '20px',
        borderBottom: '2px solid #e5e5e5'
      }}>
        <button
          onClick={() => setActiveTab('sessions')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeTab === 'sessions' ? '#337ab7' : 'transparent',
            color: activeTab === 'sessions' ? '#fff' : '#333',
            border: 'none',
            borderBottom: activeTab === 'sessions' ? '3px solid #337ab7' : '3px solid transparent',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: activeTab === 'sessions' ? 'bold' : 'normal',
            borderRadius: '4px 4px 0 0'
          }}
        >
          <i className="fas fa-calendar-alt" style={{ marginRight: '8px' }}></i>
          Sessions
        </button>
        <button
          onClick={() => setActiveTab('programs')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeTab === 'programs' ? '#337ab7' : 'transparent',
            color: activeTab === 'programs' ? '#fff' : '#333',
            border: 'none',
            borderBottom: activeTab === 'programs' ? '3px solid #337ab7' : '3px solid transparent',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: activeTab === 'programs' ? 'bold' : 'normal',
            borderRadius: '4px 4px 0 0'
          }}
        >
          <i className="fas fa-graduation-cap" style={{ marginRight: '8px' }}></i>
          Programs
        </button>
        <button
          onClick={() => setActiveTab('fees')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeTab === 'fees' ? '#337ab7' : 'transparent',
            color: activeTab === 'fees' ? '#fff' : '#333',
            border: 'none',
            borderBottom: activeTab === 'fees' ? '3px solid #337ab7' : '3px solid transparent',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: activeTab === 'fees' ? 'bold' : 'normal',
            borderRadius: '4px 4px 0 0'
          }}
        >
          <i className="fas fa-money-bill-wave" style={{ marginRight: '8px' }}></i>
          Fees
        </button>
      </div>

      {/* SESSIONS SECTION */}
      {activeTab === 'sessions' && (
        <div style={{
          padding: '20px',
          backgroundColor: '#fff',
          border: '1px solid #e5e5e5',
          borderRadius: '6px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h2 style={{ 
              fontSize: '18px',
              fontWeight: 500,
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <i className="fas fa-calendar-alt" style={{ color: '#337ab7' }}></i>
              Academic Sessions
            </h2>
            <button
              onClick={() => {
                setSessionForm({ session: '', isCurrent: false });
                setEditingSessionId(null);
                setShowSessionModal(true);
              }}
              style={{
                padding: '6px 12px',
                backgroundColor: '#337ab7',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              <i className="fas fa-plus" style={{ marginRight: '5px' }}></i>
              Add Session
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  <th style={{ textAlign: 'left', padding: '8px', border: '1px solid #e5e5e5' }}>ID</th>
                  <th style={{ textAlign: 'left', padding: '8px', border: '1px solid #e5e5e5' }}>Session</th>
                  <th style={{ textAlign: 'left', padding: '8px', border: '1px solid #e5e5e5' }}>Status</th>
                  <th style={{ textAlign: 'left', padding: '8px', border: '1px solid #e5e5e5' }}>Created</th>
                  <th style={{ textAlign: 'left', padding: '8px', border: '1px solid #e5e5e5' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                      No sessions found. Click "Add Session" to create one.
                    </td>
                  </tr>
                ) : (
                  sessions.map(session => (
                    <tr key={session.id}>
                      <td style={{ padding: '8px', border: '1px solid #e5e5e5' }}>{session.id}</td>
                      <td style={{ padding: '8px', border: '1px solid #e5e5e5', fontWeight: 'bold' }}>
                        {session.session}
                      </td>
                      <td style={{ padding: '8px', border: '1px solid #e5e5e5' }}>
                        {session.isCurrent ? (
                          <span style={{ padding: '4px 8px', backgroundColor: '#5cb85c', color: '#fff', borderRadius: '3px', fontSize: '11px', fontWeight: 'bold' }}>
                            Active
                          </span>
                        ) : (
                          <span style={{ padding: '4px 8px', backgroundColor: '#f0f0f0', color: '#666', borderRadius: '3px', fontSize: '11px' }}>
                            Inactive
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '8px', border: '1px solid #e5e5e5' }}>
                        {new Date(session.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '8px', border: '1px solid #e5e5e5', display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={() => handleSessionEdit(session)} 
                          style={{ padding: '4px 8px', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleSessionDelete(session.id)} 
                          style={{ padding: '4px 8px', border: '1px solid #d9534f', color: '#d9534f', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                        >
                          Delete
                        </button>
                        {!session.isCurrent && (
                          <button 
                            onClick={() => handleSetCurrentSession(session.id)} 
                            style={{ padding: '4px 8px', border: '1px solid #5cb85c', color: '#5cb85c', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                          >
                            Set Active
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PROGRAMS SECTION */}
      {activeTab === 'programs' && (
        <div style={{
          padding: '20px',
          backgroundColor: '#fff',
          border: '1px solid #e5e5e5',
          borderRadius: '6px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h2 style={{ 
              fontSize: '18px',
              fontWeight: 500,
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <i className="fas fa-graduation-cap" style={{ color: '#337ab7' }}></i>
              Programs
            </h2>
            <button
              onClick={() => {
                if (sessions.length === 0) {
                  alert('Please create at least one session before adding a program.');
                  return;
                }
                setProgramForm({ name: '', description: '', selectedSessionIds: [] });
                setEditingProgramId(null);
                setShowProgramModal(true);
              }}
              style={{
                padding: '6px 12px',
                backgroundColor: '#337ab7',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              <i className="fas fa-plus" style={{ marginRight: '5px' }}></i>
              Add Program
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  <th style={{ textAlign: 'left', padding: '8px', border: '1px solid #e5e5e5' }}>ID</th>
                  <th style={{ textAlign: 'left', padding: '8px', border: '1px solid #e5e5e5' }}>Program Name</th>
                  <th style={{ textAlign: 'left', padding: '8px', border: '1px solid #e5e5e5' }}>Session</th>
                  <th style={{ textAlign: 'left', padding: '8px', border: '1px solid #e5e5e5' }}>Created</th>
                  <th style={{ textAlign: 'left', padding: '8px', border: '1px solid #e5e5e5' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {programs.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                      No programs found. Click "Add Program" to create one.
                    </td>
                  </tr>
                ) : (
                  programs.map(program => {
                    // Use sessions array from backend response
                    const programSessions = program.sessions || [];
                    return (
                      <tr key={program.id}>
                        <td style={{ padding: '8px', border: '1px solid #e5e5e5' }}>{program.id}</td>
                        <td style={{ padding: '8px', border: '1px solid #e5e5e5', fontWeight: 'bold' }}>
                          {program.name}
                          {program.description && (
                            <div style={{ fontSize: '11px', color: '#777', marginTop: '2px' }}>
                              {program.description}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '8px', border: '1px solid #e5e5e5' }}>
                          {programSessions.length > 0 ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                              {programSessions.map(session => (
                                <span 
                                  key={session.id}
                                  style={{
                                    padding: '2px 6px',
                                    backgroundColor: session.isCurrent ? '#5cb85c' : '#f0f0f0',
                                    color: session.isCurrent ? '#fff' : '#333',
                                    borderRadius: '3px',
                                    fontSize: '11px'
                                  }}
                                >
                                  {session.session}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span style={{ color: '#999', fontSize: '12px' }}>No sessions linked</span>
                          )}
                        </td>
                        <td style={{ padding: '8px', border: '1px solid #e5e5e5' }}>
                          {new Date(program.createdAt).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '8px', border: '1px solid #e5e5e5', display: 'flex', gap: '8px' }}>
                          <button 
                            onClick={() => handleProgramEdit(program)} 
                            style={{ padding: '4px 8px', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleProgramDelete(program.id)} 
                            style={{ padding: '4px 8px', border: '1px solid #d9534f', color: '#d9534f', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FEES SECTION */}
      {activeTab === 'fees' && (
        <div style={{
          padding: '20px',
          backgroundColor: '#fff',
          border: '1px solid #e5e5e5',
          borderRadius: '6px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h2 style={{ 
              fontSize: '18px',
              fontWeight: 500,
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <i className="fas fa-money-bill-wave" style={{ color: '#337ab7' }}></i>
              Fees
            </h2>
            <button
              onClick={() => {
                if (programs.length === 0) {
                  alert('Please create at least one program before adding a fee.');
                  return;
                }
                if (sessions.filter(s => s.isCurrent).length === 0) {
                  alert('Please set at least one active session before adding a fee.');
                  return;
                }
                setFeeForm({ programId: '', sessionId: '', feeAmount: '' });
                setEditingFeeId(null);
                setShowFeeModal(true);
              }}
              style={{
                padding: '6px 12px',
                backgroundColor: '#337ab7',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              <i className="fas fa-plus" style={{ marginRight: '5px' }}></i>
              Add Fee
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  <th style={{ textAlign: 'left', padding: '8px', border: '1px solid #e5e5e5' }}>ID</th>
                  <th style={{ textAlign: 'left', padding: '8px', border: '1px solid #e5e5e5' }}>Program</th>
                  <th style={{ textAlign: 'left', padding: '8px', border: '1px solid #e5e5e5' }}>Session</th>
                  <th style={{ textAlign: 'right', padding: '8px', border: '1px solid #e5e5e5' }}>Fee Amount</th>
                  <th style={{ textAlign: 'left', padding: '8px', border: '1px solid #e5e5e5' }} title="Shows if this fee is for the currently active academic session">Status</th>
                  <th style={{ textAlign: 'left', padding: '8px', border: '1px solid #e5e5e5' }}>Created</th>
                  <th style={{ textAlign: 'left', padding: '8px', border: '1px solid #e5e5e5' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {fees.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                      No fees found. Click "Add Fee" to create one.
                    </td>
                  </tr>
                ) : (
                  fees.map(fee => {
                    const program = programs.find(p => p.id === fee.programId);
                    // Use sessionData from fee if available, otherwise find from sessions array
                    const session = fee.sessionData || sessions.find(s => s.id === fee.sessionId);
                    return (
                      <tr key={fee.id}>
                        <td style={{ padding: '8px', border: '1px solid #e5e5e5' }}>{fee.id}</td>
                        <td style={{ padding: '8px', border: '1px solid #e5e5e5', fontWeight: 'bold' }}>
                          {fee.programName || program?.name || 'N/A'}
                        </td>
                        <td style={{ padding: '8px', border: '1px solid #e5e5e5' }}>
                          {session && session.session ? (
                            <span style={{
                              padding: '2px 6px',
                              backgroundColor: session.isCurrent ? '#5cb85c' : '#f0f0f0',
                              color: session.isCurrent ? '#fff' : '#333',
                              borderRadius: '3px',
                              fontSize: '11px'
                            }}>
                              {session.session}
                            </span>
                          ) : fee.sessionName ? (
                            <span style={{
                              padding: '2px 6px',
                              backgroundColor: '#f0f0f0',
                              color: '#333',
                              borderRadius: '3px',
                              fontSize: '11px'
                            }}>
                              {fee.sessionName}
                            </span>
                          ) : (
                            <span style={{ color: '#999', fontSize: '12px' }}>No session linked</span>
                          )}
                        </td>
                        <td style={{ padding: '8px', border: '1px solid #e5e5e5', textAlign: 'right', fontWeight: 'bold', color: '#5cb85c' }}>
                          {formatCurrency(fee.feeAmount)}
                        </td>
                        <td style={{ padding: '8px', border: '1px solid #e5e5e5' }}>
                          {fee.isActive || (session && session.isCurrent) ? (
                            <span 
                              style={{ 
                                padding: '4px 8px', 
                                backgroundColor: '#5cb85c', 
                                color: '#fff', 
                                borderRadius: '3px', 
                                fontSize: '11px',
                                cursor: 'help'
                              }}
                              title="This fee is for the currently active academic session"
                            >
                              Active
                            </span>
                          ) : (
                            <span 
                              style={{ 
                                padding: '4px 8px', 
                                backgroundColor: '#f0f0f0', 
                                color: '#666', 
                                borderRadius: '3px', 
                                fontSize: '11px',
                                cursor: 'help'
                              }}
                              title="This fee is for a past or future academic session"
                            >
                              Inactive
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '8px', border: '1px solid #e5e5e5' }}>
                          {new Date(fee.createdAt).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '8px', border: '1px solid #e5e5e5', display: 'flex', gap: '8px' }}>
                          <button 
                            onClick={() => handleFeeEdit(fee)} 
                            style={{ padding: '4px 8px', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleFeeDelete(fee.id)} 
                            style={{ padding: '4px 8px', border: '1px solid #d9534f', color: '#d9534f', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SESSION MODAL */}
      {showSessionModal && (
        <Modal
          title={editingSessionId ? 'Edit Session' : 'Add Session'}
          onClose={() => {
            setShowSessionModal(false);
            setEditingSessionId(null);
            setSessionForm({ session: '', isCurrent: false });
          }}
        >
          <form onSubmit={handleSessionSubmit}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Session:
              </label>
              <input
                type="text"
                value={sessionForm.session}
                onChange={(e) => {
                  let value = e.target.value.replace(/[^\d-]/g, '');
                  if (value.length > 4 && !value.includes('-')) {
                    value = value.slice(0, 4) + '-' + value.slice(4);
                  }
                  if (value.length > 9) {
                    value = value.slice(0, 9);
                  }
                  setSessionForm({ ...sessionForm, session: value });
                }}
                placeholder="2025-2026"
                required
                style={{ width: '100%', padding: '6px 12px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
              {sessionForm.session && !/^\d{4}-\d{4}$/.test(sessionForm.session) && (
                <p style={{ fontSize: '11px', color: '#d9534f', margin: '3px 0 0 0' }}>
                  Format: YYYY-YYYY (e.g., 2025-2026)
                </p>
              )}
            </div>
            <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input 
                id="isCurrent" 
                type="checkbox" 
                checked={sessionForm.isCurrent} 
                onChange={(e) => setSessionForm({ ...sessionForm, isCurrent: e.target.checked })} 
              />
              <label htmlFor="isCurrent" style={{ fontWeight: 'bold' }}>Set as active session</label>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                type="button"
                onClick={() => {
                  setShowSessionModal(false);
                  setEditingSessionId(null);
                  setSessionForm({ session: '', isCurrent: false });
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
              <button
                type="submit"
                style={{
                  padding: '6px 12px',
                  fontSize: '14px',
                  color: '#fff',
                  backgroundColor: '#337ab7',
                  border: '1px solid #2e6da4',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {editingSessionId ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* PROGRAM MODAL */}
      {showProgramModal && (
        <Modal
          title={editingProgramId ? 'Edit Program' : 'Add Program'}
          onClose={() => {
            setShowProgramModal(false);
            setEditingProgramId(null);
            setProgramForm({ name: '', description: '', selectedSessionIds: [] });
          }}
        >
          <form onSubmit={handleProgramSubmit}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Program Name:
              </label>
              <input
                type="text"
                value={programForm.name}
                onChange={(e) => setProgramForm({ ...programForm, name: e.target.value })}
                required
                disabled={!!editingProgramId}
                placeholder="e.g., Computer Science, Business Administration"
                style={{
                  width: '100%',
                  padding: '6px 12px',
                  fontSize: '14px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  backgroundColor: editingProgramId ? '#e9ecef' : '#fff'
                }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Description (Optional):
              </label>
              <textarea
                value={programForm.description}
                onChange={(e) => setProgramForm({ ...programForm, description: e.target.value })}
                placeholder="Program description..."
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
                Link Sessions:
              </label>
              <div style={{
                maxHeight: '200px',
                overflowY: 'auto',
                border: '1px solid #ccc',
                borderRadius: '4px',
                padding: '8px',
                backgroundColor: '#f9f9f9'
              }}>
                {sessions.length === 0 ? (
                  <p style={{ fontSize: '12px', color: '#777', margin: 0 }}>
                    No sessions available. Please create sessions first.
                  </p>
                ) : (
                  sessions.map(session => (
                    <div key={session.id} style={{ marginBottom: '8px' }}>
                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer',
                        fontSize: '13px'
                      }}>
                        <input
                          type="checkbox"
                          checked={programForm.selectedSessionIds.includes(session.id)}
                          onChange={() => handleProgramSessionToggle(session.id)}
                          style={{ marginRight: '8px', cursor: 'pointer' }}
                        />
                        <span style={{ flex: 1 }}>
                          {session.session}
                          {session.isCurrent && (
                            <span style={{
                              marginLeft: '8px',
                              padding: '2px 6px',
                              backgroundColor: '#5cb85c',
                              color: '#fff',
                              borderRadius: '3px',
                              fontSize: '10px',
                              fontWeight: 'bold'
                            }}>
                              Active
                            </span>
                          )}
                        </span>
                      </label>
                    </div>
                  ))
                )}
              </div>
              {programForm.selectedSessionIds.length > 0 && (
                <p style={{ fontSize: '11px', color: '#5cb85c', margin: '5px 0 0 0' }}>
                  {programForm.selectedSessionIds.length} session(s) selected
                </p>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                type="button"
                onClick={() => {
                  setShowProgramModal(false);
                  setEditingProgramId(null);
                  setProgramForm({ name: '', description: '', selectedSessionIds: [] });
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
              <button
                type="submit"
                style={{
                  padding: '6px 12px',
                  fontSize: '14px',
                  color: '#fff',
                  backgroundColor: '#337ab7',
                  border: '1px solid #2e6da4',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {editingProgramId ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* FEE MODAL */}
      {showFeeModal && (
        <Modal
          title={editingFeeId ? 'Edit Fee' : 'Add Fee'}
          onClose={() => {
            setShowFeeModal(false);
            setEditingFeeId(null);
            setFeeForm({ programId: '', sessionId: '', feeAmount: '' });
          }}
        >
          <form onSubmit={handleFeeSubmit}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Program:
              </label>
              <select
                value={feeForm.programId}
                onChange={(e) => setFeeForm({ ...feeForm, programId: e.target.value })}
                required
                disabled={!!editingFeeId}
                style={{
                  width: '100%',
                  padding: '6px 12px',
                  fontSize: '14px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  backgroundColor: editingFeeId ? '#e9ecef' : '#fff'
                }}
              >
                <option value="">-- Select Program --</option>
                {programs.map(program => (
                  <option key={program.id} value={program.id}>{program.name}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Session:
              </label>
              <select
                value={feeForm.sessionId}
                onChange={(e) => setFeeForm({ ...feeForm, sessionId: e.target.value })}
                required
                disabled={!!editingFeeId}
                style={{
                  width: '100%',
                  padding: '6px 12px',
                  fontSize: '14px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  backgroundColor: editingFeeId ? '#e9ecef' : '#fff'
                }}
              >
                <option value="">-- Select Session --</option>
                {sessions.map(session => (
                  <option key={session.id} value={session.id}>
                    {session.session} {session.isCurrent ? '(Active)' : ''}
                  </option>
                ))}
              </select>
              {feeForm.programId && (
                <p style={{ fontSize: '11px', color: '#777', margin: '5px 0 0 0' }}>
                  Selected session will be automatically linked to the program if not already linked.
                </p>
              )}
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Fee Amount (Rs.):
              </label>
              <input
                type="number"
                value={feeForm.feeAmount}
                onChange={(e) => setFeeForm({ ...feeForm, feeAmount: e.target.value })}
                required
                min="0"
                step="1"
                placeholder="e.g., 50000"
                style={{
                  width: '100%',
                  padding: '6px 12px',
                  fontSize: '14px',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                type="button"
                onClick={() => {
                  setShowFeeModal(false);
                  setEditingFeeId(null);
                  setFeeForm({ programId: '', sessionId: '', feeAmount: '' });
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
              <button
                type="submit"
                style={{
                  padding: '6px 12px',
                  fontSize: '14px',
                  color: '#fff',
                  backgroundColor: '#337ab7',
                  border: '1px solid #2e6da4',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {editingFeeId ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

// Modal Component
const Modal = ({ title, children, onClose }) => {
  return (
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
        <div style={{
          padding: '15px',
          borderBottom: '1px solid #e5e5e5',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 500 }}>{title}</h4>
          <button
            onClick={onClose}
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
        <div style={{ padding: '15px' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Settings;
