import { PrismaClient } from "@prisma/client";
import { HTTP_STATUS, SUCCESS_MESSAGES } from "../utils/constants.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const prisma = new PrismaClient();

/**
 * SETTINGS CONTROLLER
 * ===================
 * Manage program fees and system settings
 * Admin Only Access
 */

// Get all program fees
export const getProgramFees = async (req, res, next) => {
  try {
    const programFees = await prisma.programFee.findMany({
      orderBy: { program: 'asc' }
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.FETCH_SUCCESS,
      programFees,
      count: programFees.length
    });
  } catch (error) {
    next(error);
  }
};

// Get fee for a specific program
export const getProgramFee = async (req, res, next) => {
  try {
    const { program } = req.params;

    const programFee = await prisma.programFee.findUnique({
      where: { program }
    });

    if (!programFee) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: `No fee found for program: ${program}`
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      programFee
    });
  } catch (error) {
    next(error);
  }
};

// Create new program fee
export const createProgramFee = async (req, res, next) => {
  try {
    const { program, feeAmount, sessionIds } = req.body;

    // Check if program already exists
    const existing = await prisma.programFee.findUnique({
      where: { program }
    });

    if (existing) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: `Fee for program "${program}" already exists. Please update instead.`
      });
    }

    // Create the program fee
    const programFee = await prisma.programFee.create({
      data: {
        program,
        feeAmount: parseFloat(feeAmount)
      }
    });

    // Link sessions to the program if sessionIds are provided
    if (sessionIds && Array.isArray(sessionIds) && sessionIds.length > 0) {
      // Get the session details (these are the "Unassigned" sessions)
      const sessionsToLink = await prisma.programSession.findMany({
        where: { id: { in: sessionIds.map(id => parseInt(id, 10)) } }
      });

      // For each session, create a new ProgramSession entry for this program
      // Since program+session is unique, we can have the same session linked to multiple programs
      for (const session of sessionsToLink) {
        // Check if this program+session combination already exists
        const existingProgramSession = await prisma.programSession.findUnique({
          where: {
            program_session: {
              program: program,
              session: session.session
            }
          }
        });

        if (!existingProgramSession) {
          // Create a new ProgramSession entry linking this session to the new program
          // Only one session can be current per program, so set isCurrent to false for new links
          await prisma.programSession.create({
            data: {
              program: program,
              session: session.session,
              isCurrent: false, // New links are not current by default
              startYear: session.startYear,
              endYear: session.endYear
            }
          });
        }
      }
    }

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Program fee created successfully',
      programFee
    });
  } catch (error) {
    next(error);
  }
};

// Update program fee
export const updateProgramFee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { program, feeAmount, sessionIds } = req.body;

    // Get the existing program fee to know the program name
    const existingProgramFee = await prisma.programFee.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingProgramFee) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Program fee not found'
      });
    }

    const programName = program || existingProgramFee.program;

    // Update the program fee (program name cannot be changed, only fee amount)
    const programFee = await prisma.programFee.update({
      where: { id: parseInt(id) },
      data: {
        feeAmount: parseFloat(feeAmount)
      }
    });

    // Handle session linking if sessionIds are provided
    if (sessionIds && Array.isArray(sessionIds)) {
      // Get all existing sessions for this program
      const existingSessions = await prisma.programSession.findMany({
        where: { program: programName }
      });

      // Get the session details from the "Unassigned" sessions
      const sessionIdsToLink = sessionIds.map(id => parseInt(id, 10));
      const sessionsToLink = await prisma.programSession.findMany({
        where: { id: { in: sessionIdsToLink } }
      });

      // Get session strings that should be linked
      const sessionStringsToLink = sessionsToLink.map(s => s.session);

      // Remove sessions that are no longer linked (delete ProgramSession entries for this program)
      const sessionsToUnlink = existingSessions.filter(
        es => !sessionStringsToLink.includes(es.session)
      );
      for (const sessionToUnlink of sessionsToUnlink) {
        await prisma.programSession.delete({
          where: { id: sessionToUnlink.id }
        });
      }

      // Add new sessions that should be linked
      for (const session of sessionsToLink) {
        // Check if this session is already linked to this program
        const existingLink = existingSessions.find(es => es.session === session.session);
        
        if (!existingLink) {
          // Check if a ProgramSession with this program+session combination already exists
          const existingProgramSession = await prisma.programSession.findUnique({
            where: {
              program_session: {
                program: programName,
                session: session.session
              }
            }
          });

          if (!existingProgramSession) {
            // Create a new ProgramSession entry linking this session to the program
            // Preserve isCurrent status if it was set for this program
            await prisma.programSession.create({
              data: {
                program: programName,
                session: session.session,
                isCurrent: false, // New links are not current by default
                startYear: session.startYear,
                endYear: session.endYear
              }
            });
          }
        }
      }
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Program fee updated successfully',
      programFee
    });
  } catch (error) {
    next(error);
  }
};

// Delete program fee
export const deleteProgramFee = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.programFee.delete({
      where: { id: parseInt(id) }
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Program fee deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// ==========================
// Program Sessions Endpoints
// ==========================

// Get sessions (optionally by program)
export const getProgramSessions = asyncHandler(async (req, res) => {
  const { program } = req.query;

  let sessions;
  if (program) {
    // Get sessions for a specific program
    sessions = await prisma.programSession.findMany({
      where: { program },
      orderBy: [{ startYear: 'desc' }, { session: 'desc' }]
    });
  } else {
    // Get all unique sessions (by session string, not by program)
    // We'll group by session string and return distinct sessions
    const allSessions = await prisma.programSession.findMany({
      orderBy: [{ startYear: 'desc' }, { session: 'desc' }]
    });
    
    // Group by session string and get the first occurrence (or one with isCurrent=true if exists)
    const sessionMap = new Map();
    for (const s of allSessions) {
      if (!sessionMap.has(s.session)) {
        sessionMap.set(s.session, s);
      } else {
        // Prefer sessions that are current
        const existing = sessionMap.get(s.session);
        if (s.isCurrent && !existing.isCurrent) {
          sessionMap.set(s.session, s);
        }
      }
    }
    sessions = Array.from(sessionMap.values());
  }

  res.status(HTTP_STATUS.OK).json({ success: true, data: { sessions } });
});

// Create session (sessions are created without a program, programs link to sessions later)
export const createProgramSession = asyncHandler(async (req, res) => {
  const { session, isCurrent } = req.body;
  
  // Sessions are created without a program initially
  // They will be linked to programs when programs are created/updated
  const program = 'Unassigned'; // Temporary program name for sessions not yet linked

  // Derive years if possible (YYYY-YYYY)
  let startYear = null;
  let endYear = null;
  const match = typeof session === 'string' ? session.match(/^(\d{4})-(\d{4})$/) : null;
  if (match) {
    startYear = parseInt(match[1], 10);
    endYear = parseInt(match[2], 10);
  }

  // If setting current, unset others globally
  if (isCurrent === true) {
    await prisma.programSession.updateMany({
      data: { isCurrent: false }
    });
  }

  // Check if this session already exists for "Unassigned" program
  const existing = await prisma.programSession.findUnique({
    where: {
      program_session: {
        program: program,
        session: session
      }
    }
  });

  if (existing) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: `Session "${session}" already exists.`
    });
  }

  const created = await prisma.programSession.create({
    data: { program, session, isCurrent: !!isCurrent, startYear, endYear }
  });

  res.status(HTTP_STATUS.CREATED).json({ success: true, message: 'Session created', data: { session: created } });
});

// Update session
export const updateProgramSession = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { session, isCurrent } = req.body;

  // Get the existing session to preserve program
  const existing = await prisma.programSession.findUnique({
    where: { id: parseInt(id, 10) }
  });

  if (!existing) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Session not found'
    });
  }

  let startYear = undefined;
  let endYear = undefined;
  if (typeof session === 'string') {
    const match = session.match(/^(\d{4})-(\d{4})$/);
    if (match) {
      startYear = parseInt(match[1], 10);
      endYear = parseInt(match[2], 10);
    } else {
      startYear = null;
      endYear = null;
    }
  }

  // If setting current, unset others globally
  if (isCurrent === true) {
    await prisma.programSession.updateMany({
      data: { isCurrent: false }
    });
  }

  const updated = await prisma.programSession.update({
    where: { id: parseInt(id, 10) },
    data: {
      ...(session !== undefined ? { session, startYear, endYear } : {}),
      ...(isCurrent !== undefined ? { isCurrent: !!isCurrent } : {})
    }
  });

  res.status(HTTP_STATUS.OK).json({ success: true, message: 'Session updated', data: { session: updated } });
});

// Delete session
export const deleteProgramSession = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await prisma.programSession.delete({ where: { id: parseInt(id, 10) } });
  res.status(HTTP_STATUS.OK).json({ success: true, message: 'Session deleted' });
});

// Set current session for a program
export const setCurrentProgramSession = asyncHandler(async (req, res) => {
  const { id } = req.params; // session id
  const existing = await prisma.programSession.findUnique({ where: { id: parseInt(id, 10) } });
  if (!existing) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: 'Session not found' });
  }

  // Unset all other sessions globally, then set this one as current
  await prisma.programSession.updateMany({ data: { isCurrent: false } });
  
  // Also update all sessions with the same session string to be current
  await prisma.programSession.updateMany({
    where: { session: existing.session },
    data: { isCurrent: true }
  });

  const updated = await prisma.programSession.findUnique({ where: { id: existing.id } });

  res.status(HTTP_STATUS.OK).json({ success: true, message: 'Current session set', data: { session: updated } });
});

// ==========================
// Programs Endpoints (New Structure)
// ==========================

// Get all programs (treating ProgramFee as Program for now)
export const getPrograms = asyncHandler(async (req, res) => {
  const programFees = await prisma.programFee.findMany({
    orderBy: { program: 'asc' }
  });

  // Get sessions for each program
  const programsWithSessions = await Promise.all(
    programFees.map(async (pf) => {
      const programSessions = await prisma.programSession.findMany({
        where: { program: pf.program },
        orderBy: { session: 'asc' }
      });
      return {
        id: pf.id,
        name: pf.program,
        description: null,
        feeAmount: pf.feeAmount,
        sessionIds: programSessions.map(ps => ps.id),
        sessions: programSessions,
        createdAt: pf.createdAt,
        updatedAt: pf.updatedAt
      };
    })
  );

  res.status(HTTP_STATUS.OK).json({
    success: true,
    programs: programsWithSessions,
    count: programsWithSessions.length
  });
});

// Get a specific program
export const getProgram = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const programFee = await prisma.programFee.findUnique({
    where: { id: parseInt(id, 10) }
  });

  if (!programFee) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Program not found'
    });
  }

  const programSessions = await prisma.programSession.findMany({
    where: { program: programFee.program }
  });

  res.status(HTTP_STATUS.OK).json({
    success: true,
    program: {
      id: programFee.id,
      name: programFee.program,
      description: null,
      feeAmount: programFee.feeAmount,
      sessionIds: programSessions.map(ps => ps.id),
      sessions: programSessions,
      createdAt: programFee.createdAt,
      updatedAt: programFee.updatedAt
    }
  });
});

// Get sessions for a specific program
export const getProgramSessionsById = asyncHandler(async (req, res) => {
  const { programId } = req.params;
  const programFee = await prisma.programFee.findUnique({
    where: { id: parseInt(programId, 10) }
  });

  if (!programFee) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Program not found'
    });
  }

  const sessions = await prisma.programSession.findMany({
    where: { program: programFee.program },
    orderBy: [{ startYear: 'desc' }, { session: 'desc' }]
  });

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { sessions }
  });
});

// Create program
export const createProgram = asyncHandler(async (req, res) => {
  const { name, description, sessionIds } = req.body;

  // Check if program already exists
  const existing = await prisma.programFee.findUnique({
    where: { program: name }
  });

  if (existing) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: `Program "${name}" already exists.`
    });
  }

  // Create program (using ProgramFee table for now)
  const programFee = await prisma.programFee.create({
    data: {
      program: name,
      feeAmount: 0 // Default fee, will be set when fees are created
    }
  });

  // Link sessions to the program if sessionIds are provided
  if (sessionIds && Array.isArray(sessionIds) && sessionIds.length > 0) {
    // Get the session details from "Unassigned" sessions
    const sessionsToLink = await prisma.programSession.findMany({
      where: { 
        id: { in: sessionIds.map(id => parseInt(id, 10)) },
        program: 'Unassigned'
      }
    });

    // Create ProgramSession entries for this program
    for (const session of sessionsToLink) {
      // Check if this program+session combination already exists
      const existingProgramSession = await prisma.programSession.findUnique({
        where: {
          program_session: {
            program: name,
            session: session.session
          }
        }
      });

      if (!existingProgramSession) {
        // Check if this session is marked as current anywhere (to preserve current status)
        const currentSessionCheck = await prisma.programSession.findFirst({
          where: {
            session: session.session,
            isCurrent: true
          }
        });
        
        await prisma.programSession.create({
          data: {
            program: name,
            session: session.session,
            isCurrent: currentSessionCheck ? true : session.isCurrent, // Preserve current status if session is current
            startYear: session.startYear,
            endYear: session.endYear
          }
        });
      }
    }
  }

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Program created successfully',
    program: {
      id: programFee.id,
      name: programFee.program,
      description: description || null,
      feeAmount: programFee.feeAmount,
      createdAt: programFee.createdAt,
      updatedAt: programFee.updatedAt
    }
  });
});

// Update program
export const updateProgram = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, sessionIds } = req.body;

  const existingProgramFee = await prisma.programFee.findUnique({
    where: { id: parseInt(id, 10) }
  });

  if (!existingProgramFee) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Program not found'
    });
  }

  const programName = existingProgramFee.program;

  // Handle session linking if sessionIds are provided
  if (sessionIds && Array.isArray(sessionIds)) {
    // Get all existing sessions for this program
    const existingSessions = await prisma.programSession.findMany({
      where: { program: programName }
    });

    // Get sessions to link (from Unassigned)
    const sessionIdsToLink = sessionIds.map(id => parseInt(id, 10));
    const sessionsToLink = await prisma.programSession.findMany({
      where: { 
        id: { in: sessionIdsToLink },
        program: 'Unassigned'
      }
    });

    const sessionStringsToLink = sessionsToLink.map(s => s.session);

    // Remove sessions that are no longer linked
    const sessionsToUnlink = existingSessions.filter(
      es => !sessionStringsToLink.includes(es.session)
    );
    for (const sessionToUnlink of sessionsToUnlink) {
      await prisma.programSession.delete({
        where: { id: sessionToUnlink.id }
      });
    }

    // Add new sessions
    for (const session of sessionsToLink) {
      const existingLink = existingSessions.find(es => es.session === session.session);
      
      if (!existingLink) {
        const existingProgramSession = await prisma.programSession.findUnique({
          where: {
            program_session: {
              program: programName,
              session: session.session
            }
          }
        });

        if (!existingProgramSession) {
          // Check if this session is marked as current anywhere (to preserve current status)
          const currentSessionCheck = await prisma.programSession.findFirst({
            where: {
              session: session.session,
              isCurrent: true
            }
          });
          
          await prisma.programSession.create({
            data: {
              program: programName,
              session: session.session,
              isCurrent: currentSessionCheck ? true : session.isCurrent, // Preserve current status if session is current
              startYear: session.startYear,
              endYear: session.endYear
            }
          });
        }
      }
    }
  }

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Program updated successfully',
    program: {
      id: existingProgramFee.id,
      name: existingProgramFee.program,
      description: description || null
    }
  });
});

// Delete program
export const deleteProgram = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const programFee = await prisma.programFee.findUnique({
    where: { id: parseInt(id, 10) }
  });

  if (!programFee) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Program not found'
    });
  }

  // Delete all ProgramSession entries for this program
  await prisma.programSession.deleteMany({
    where: { program: programFee.program }
  });

  // Delete the program
  await prisma.programFee.delete({
    where: { id: parseInt(id, 10) }
  });

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Program deleted successfully'
  });
});

// ==========================
// Fees Endpoints (New Structure)
// ==========================

// Get all fees
export const getFees = asyncHandler(async (req, res) => {
  // Get all program fees
  const programFees = await prisma.programFee.findMany({
    orderBy: { program: 'asc' }
  });

  // First, get all current sessions to determine which session strings are active globally
  const allCurrentSessions = await prisma.programSession.findMany({
    where: { isCurrent: true }
  });
  const currentSessionStrings = new Set(allCurrentSessions.map(cs => cs.session));

  // Convert to fee structure with program and session
  const fees = await Promise.all(
    programFees.map(async (pf) => {
      // Get sessions linked to this program
      const programSessions = await prisma.programSession.findMany({
        where: { program: pf.program },
        orderBy: { session: 'asc' }
      });

      // Skip programs with no linked sessions
      if (programSessions.length === 0) {
        return [];
      }
      
      return programSessions.map(ps => {
        // A fee is active if the session string is marked as current anywhere in the system
        // This means if any ProgramSession with this session string has isCurrent=true, 
        // then this fee is active
        const isSessionCurrent = currentSessionStrings.has(ps.session);
        
        return {
          id: `${pf.id}-${ps.id}`,
          programId: pf.id,
          programName: pf.program,
          sessionId: ps.id,
          sessionName: ps.session,
          sessionData: ps, // Include full session data
          feeAmount: pf.feeAmount,
          isActive: isSessionCurrent, // Fee is active if the session is current
          createdAt: pf.createdAt,
          updatedAt: pf.updatedAt
        };
      });
    })
  );

  const flattenedFees = fees.flat().filter(fee => fee.sessionId !== null); // Only return fees with linked sessions

  res.status(HTTP_STATUS.OK).json({
    success: true,
    fees: flattenedFees,
    count: flattenedFees.length
  });
});

// Create fee (linked to program and session)
export const createFee = asyncHandler(async (req, res) => {
  const { programId, sessionId, feeAmount } = req.body;

  const programFee = await prisma.programFee.findUnique({
    where: { id: parseInt(programId, 10) }
  });

  if (!programFee) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Program not found'
    });
  }

  const session = await prisma.programSession.findUnique({
    where: { id: parseInt(sessionId, 10) }
  });

  if (!session) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Session not found'
    });
  }

  // Check if this session is already linked to this program
  let programSession = await prisma.programSession.findUnique({
    where: {
      program_session: {
        program: programFee.program,
        session: session.session
      }
    }
  });

  // If not linked, create the link automatically
  if (!programSession) {
    programSession = await prisma.programSession.create({
      data: {
        program: programFee.program,
        session: session.session,
        isCurrent: session.isCurrent,
        startYear: session.startYear,
        endYear: session.endYear
      }
    });
  }

  // Update the program fee amount
  const updatedProgramFee = await prisma.programFee.update({
    where: { id: parseInt(programId, 10) },
    data: {
      feeAmount: parseFloat(feeAmount)
    }
  });

  // Check if this session is current (check if any session with this session string is current)
  const currentSessionCheck = await prisma.programSession.findFirst({
    where: {
      session: programSession.session,
      isCurrent: true
    }
  });
  const isSessionCurrent = !!currentSessionCheck || programSession.isCurrent;

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Fee created successfully',
    fee: {
      id: `${programId}-${programSession.id}`,
      programId: updatedProgramFee.id,
      programName: updatedProgramFee.program,
      sessionId: programSession.id,
      sessionName: programSession.session,
      sessionData: programSession,
      feeAmount: updatedProgramFee.feeAmount,
      isActive: isSessionCurrent, // Fee is active if the session is current
      createdAt: updatedProgramFee.createdAt,
      updatedAt: updatedProgramFee.updatedAt
    }
  });
});

// Update fee
export const updateFee = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { feeAmount } = req.body;

  // Parse the ID (format: programId-sessionId)
  const [programId, sessionId] = id.split('-');

  const programFee = await prisma.programFee.findUnique({
    where: { id: parseInt(programId, 10) }
  });

  if (!programFee) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Fee not found'
    });
  }

  // Get the session
  const programSession = await prisma.programSession.findUnique({
    where: { id: parseInt(sessionId, 10) }
  });

  if (!programSession) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Session not found'
    });
  }

  const updatedProgramFee = await prisma.programFee.update({
    where: { id: parseInt(programId, 10) },
    data: {
      feeAmount: parseFloat(feeAmount)
    }
  });

  // Check if this session is current (check if any session with this session string is current)
  const currentSessionCheck = await prisma.programSession.findFirst({
    where: {
      session: programSession.session,
      isCurrent: true
    }
  });
  const isSessionCurrent = !!currentSessionCheck || programSession.isCurrent;

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Fee updated successfully',
    fee: {
      id: id,
      programId: updatedProgramFee.id,
      programName: updatedProgramFee.program,
      sessionId: programSession.id,
      sessionName: programSession.session,
      sessionData: programSession,
      feeAmount: updatedProgramFee.feeAmount,
      isActive: isSessionCurrent, // Fee is active if the session is current
      updatedAt: updatedProgramFee.updatedAt
    }
  });
});

// Delete fee
export const deleteFee = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Parse the ID (format: programId-sessionId)
  const [programId] = id.split('-');

  const programFee = await prisma.programFee.findUnique({
    where: { id: parseInt(programId, 10) }
  });

  if (!programFee) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Fee not found'
    });
  }

  // For now, we'll just set fee amount to 0 instead of deleting
  // Once ProgramSessionFee is available, we can properly delete
  await prisma.programFee.update({
    where: { id: parseInt(programId, 10) },
    data: {
      feeAmount: 0
    }
  });

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Fee deleted successfully'
  });
});

