/**
 * REUSABLE PAGE HEADER COMPONENT
 * ==============================
 * Standardized page header with title and description
 */

const PageHeader = ({ title, description, icon, actionButtons }) => {
  return (
    <div style={{ 
      marginBottom: '20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      flexWrap: 'wrap',
      gap: '15px'
    }}>
      <div style={{ flex: 1 }}>
        <h1 style={{ 
          fontSize: '24px',
          fontWeight: 500,
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          {icon && <i className={icon} style={{ color: '#337ab7' }}></i>}
          {title}
        </h1>
        {description && (
          <p style={{ margin: '5px 0 0 0', color: '#777', fontSize: '13px' }}>
            {description}
          </p>
        )}
      </div>
      {actionButtons && (
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {actionButtons}
        </div>
      )}
    </div>
  );
};

export default PageHeader;

