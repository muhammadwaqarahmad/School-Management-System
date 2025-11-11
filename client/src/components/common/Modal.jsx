/**
 * REUSABLE MODAL COMPONENT
 * ========================
 * Standardized modal wrapper for consistent styling
 */

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  width = '90%', 
  maxWidth = '500px',
  showCloseButton = true 
}) => {
  if (!isOpen) return null;

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
        width: width,
        maxWidth: maxWidth,
        margin: '20px'
      }}>
        {/* Modal Header */}
        {title && (
          <div style={{
            padding: '15px',
            borderBottom: '1px solid #e5e5e5',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 500 }}>
              {title}
            </h4>
            {showCloseButton && (
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
            )}
          </div>
        )}
        
        {/* Modal Body */}
        {children}
      </div>
    </div>
  );
};

export default Modal;

