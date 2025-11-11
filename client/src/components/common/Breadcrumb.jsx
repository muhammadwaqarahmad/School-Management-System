/**
 * REUSABLE BREADCRUMB COMPONENT
 * =============================
 * Standardized breadcrumb navigation
 */

import { Link } from 'react-router-dom';

const Breadcrumb = ({ items }) => {
  return (
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
        {items.map((item, index) => (
          <li key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {index > 0 && <span style={{ color: '#ccc' }}>/</span>}
            {item.path ? (
              <Link to={item.path} style={{ color: '#337ab7', textDecoration: 'none' }}>
                {item.icon && <i className={item.icon} style={{ marginRight: '5px' }}></i>}
                {item.label}
              </Link>
            ) : (
              <span style={{ color: '#337ab7' }}>
                {item.icon && <i className={item.icon} style={{ marginRight: '5px' }}></i>}
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
};

export default Breadcrumb;

