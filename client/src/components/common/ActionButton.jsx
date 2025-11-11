/**
 * REUSABLE ACTION BUTTON COMPONENT
 * ==================================
 * Standardized button component for common actions
 */

const ActionButton = ({ 
  label, 
  onClick, 
  variant = 'primary', 
  icon, 
  disabled = false,
  style = {},
  title 
}) => {
  const variants = {
    primary: {
      backgroundColor: '#337ab7',
      color: '#fff',
      border: '1px solid #2e6da4',
      hoverBg: '#286090'
    },
    success: {
      backgroundColor: '#5cb85c',
      color: '#fff',
      border: '1px solid #4cae4c',
      hoverBg: '#449d44'
    },
    danger: {
      backgroundColor: '#d9534f',
      color: '#fff',
      border: '1px solid #d43f3a',
      hoverBg: '#c9302c'
    },
    info: {
      backgroundColor: '#5bc0de',
      color: '#fff',
      border: '1px solid #46b8da',
      hoverBg: '#46b8da'
    },
    warning: {
      backgroundColor: '#f0ad4e',
      color: '#fff',
      border: '1px solid #eea236',
      hoverBg: '#ec971f'
    }
  };

  const buttonStyle = variants[variant] || variants.primary;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        backgroundColor: disabled ? '#ccc' : buttonStyle.backgroundColor,
        color: buttonStyle.color,
        border: buttonStyle.border,
        padding: '4px 8px',
        borderRadius: '3px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: '12px',
        fontWeight: 'normal',
        whiteSpace: 'nowrap',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        ...style
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = buttonStyle.hoverBg;
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = buttonStyle.backgroundColor;
        }
      }}
    >
      {icon && <i className={icon}></i>}
      {label}
    </button>
  );
};

export default ActionButton;

