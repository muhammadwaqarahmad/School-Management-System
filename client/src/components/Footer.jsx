/**
 * FOOTER COMPONENT
 * ================
 * Bottom footer matching Bahria University style
 * Displays copyright and powered by information
 * Adjusts position based on sidebar visibility
 */

import { useSidebar } from '../context/SidebarContext';
import { schoolName, copyrightYear, poweredBy } from '../utils/config';

const Footer = () => {
  const { sidebarVisible } = useSidebar();
  const currentYear = copyrightYear || new Date().getFullYear();

  return (
    <footer 
      id="footer" 
      className="noselect"
      style={{
        position: 'fixed',
        right: 0,
        bottom: 0,
        left: sidebarVisible ? '250px' : '0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        minHeight: '25px',
        margin: 0,
        padding: '0 15px',
        borderWidth: '1px 0 0 0',
        borderStyle: 'solid none none none',
        borderColor: '#eee',
        cursor: 'default',
        fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
        fontSize: '13px',
        lineHeight: '1.6',
        color: '#333',
        backgroundColor: '#fff',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        WebkitTouchCallout: 'none',
        boxSizing: 'border-box',
        transition: 'left 0.3s ease-in-out',
        zIndex: 1020
      }}
    >
      <span style={{ fontWeight: 'normal' }}>
        {currentYear} © <a 
          href="/" 
          style={{
            color: '#337ab7',
            textDecoration: 'none',
            fontWeight: 'normal'
          }}
          onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
          onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
        >
          {schoolName}
        </a>{' '}&{' '}Powered by{' '}
        <a 
          href={poweredBy.url} 
          target="_blank" 
          rel="noopener noreferrer"
          style={{
            color: '#337ab7',
            textDecoration: 'none',
            fontWeight: 'normal'
          }}
          onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
          onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
        >
          {poweredBy.name}
        </a>
      </span>
    </footer>
  );
};

export default Footer;

