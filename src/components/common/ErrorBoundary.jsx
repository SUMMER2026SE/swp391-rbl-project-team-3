import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error('Error caught by Global ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#ffebeb',
          color: '#842029',
          padding: '40px',
          fontFamily: 'monospace',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          boxSizing: 'border-box'
        }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '20px', borderBottom: '2px solid #f5c2c7', paddingBottom: '10px' }}>
            🚨 Application Crashed
          </h1>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>Error Message:</h2>
          <pre style={{ backgroundColor: '#f8d7da', padding: '15px', borderRadius: '8px', overflowX: 'auto', width: '100%', border: '1px solid #f5c2c7', marginBottom: '20px', whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
            {this.state.error && this.state.error.toString()}
          </pre>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>Component Stack:</h2>
          <pre style={{ backgroundColor: '#f8d7da', padding: '15px', borderRadius: '8px', overflowX: 'auto', width: '100%', border: '1px solid #f5c2c7', whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </pre>
          <button 
            onClick={() => window.location.reload()}
            style={{ marginTop: '30px', padding: '10px 20px', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}
          >
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
