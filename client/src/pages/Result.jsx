import { Link } from 'react-router-dom';

const Result = () => {
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
          <li style={{ color: '#ccc' }}>/</li>
          <li>
            <Link to="/students/result" style={{ color: '#337ab7', textDecoration: 'none' }}>
              Result
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
          <i className="fas fa-graduation-cap" style={{ color: '#337ab7' }}></i>
          Result
        </h1>
        <p style={{ margin: '5px 0 0 0', color: '#777', fontSize: '13px' }}>
          Student results and academic performance
        </p>
      </div>

      {/* Developer Contact Card */}
      <div style={{
        padding: '20px',
        marginBottom: '20px',
        backgroundColor: '#f8f9fa',
        border: '2px solid #337ab7',
        borderRadius: '6px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '15px'
        }}>
          <div style={{ flex: '1', minWidth: '250px' }}>
            <h3 style={{
              margin: '0 0 8px 0',
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#337ab7',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <i className="fas fa-code" style={{ fontSize: '18px' }}></i>
              Developer Contact
            </h3>
            <p style={{
              margin: 0,
              fontSize: '14px',
              color: '#555',
              lineHeight: '1.5'
            }}>
              For system updates or feature changes, please contact your developer.
            </p>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            {/* WhatsApp Link */}
            <a
              href="https://wa.me/923457611722"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                backgroundColor: '#25D366',
                color: '#fff',
                textDecoration: 'none',
                borderRadius: '5px',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.3s ease',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#128C7E';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#25D366';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
              }}
            >
              <i className="fab fa-whatsapp" style={{ fontSize: '20px' }}></i>
              <span>WhatsApp</span>
            </a>

            {/* Phone/Call Link */}
            <a
              href="tel:+923457611722"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                backgroundColor: '#337ab7',
                color: '#fff',
                textDecoration: 'none',
                borderRadius: '5px',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.3s ease',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#286090';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#337ab7';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
              }}
            >
              <i className="fas fa-phone" style={{ fontSize: '18px' }}></i>
              <span>Call</span>
            </a>

            {/* LinkedIn Link */}
            <a
              href="https://www.linkedin.com/in/yuxor"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                backgroundColor: '#0077b5',
                color: '#fff',
                textDecoration: 'none',
                borderRadius: '5px',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.3s ease',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#005885';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#0077b5';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
              }}
            >
              <i className="fab fa-linkedin" style={{ fontSize: '18px' }}></i>
              <span>LinkedIn</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Result;

