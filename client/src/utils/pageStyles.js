/**
 * COMMON PAGE STYLES
 * ==================
 * Reusable style objects for consistent page layout
 */

export const pageContainerStyle = {
  fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
  fontSize: '13px',
  lineHeight: '1.6',
  color: '#333',
  backgroundColor: '#fff',
  padding: '15px',
  boxSizing: 'border-box'
};

export const tableStyle = {
  width: '100%',
  border: '1px solid #ddd',
  borderCollapse: 'collapse',
  backgroundColor: '#fff',
  marginBottom: '20px'
};

export const tableHeaderStyle = {
  padding: '8px',
  border: '1px solid #ddd',
  fontWeight: 'bold',
  textAlign: 'left',
  whiteSpace: 'nowrap',
  backgroundColor: '#f5f5f5'
};

export const tableCellStyle = {
  padding: '8px',
  border: '1px solid #ddd',
  whiteSpace: 'nowrap'
};

export const cardStyle = {
  padding: '15px',
  backgroundColor: '#fff',
  border: '1px solid #ddd',
  borderRadius: '4px',
  marginBottom: '20px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
};

export const alertStyle = {
  padding: '8px 15px',
  marginBottom: '20px',
  borderRadius: '4px'
};

export const alertVariants = {
  info: {
    ...alertStyle,
    backgroundColor: '#d9edf7',
    border: '1px solid #bce8f1',
    color: '#31708f'
  },
  warning: {
    ...alertStyle,
    backgroundColor: '#fcf8e3',
    border: '1px solid #faebcc',
    color: '#8a6d3b'
  },
  success: {
    ...alertStyle,
    backgroundColor: '#dff0d8',
    border: '1px solid #d6e9c6',
    color: '#3c763d'
  },
  danger: {
    ...alertStyle,
    backgroundColor: '#f2dede',
    border: '1px solid #ebccd1',
    color: '#a94442'
  }
};

