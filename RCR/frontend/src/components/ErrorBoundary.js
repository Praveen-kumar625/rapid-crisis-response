import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(_error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        console.group('🚨 FATAL_RUNTIME_CRASH');
        console.error('Error:', error);
        console.error('Component Stack:', errorInfo.componentStack);
        console.groupEnd();
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: '40px',
                    backgroundColor: '#020617',
                    color: '#f8fafc',
                    minHeight: '100vh',
                    fontFamily: 'monospace',
                    lineHeight: '1.6'
                }}>
                    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                        <h1 style={{ color: '#ef4444', fontSize: '24px', marginBottom: '20px' }}>
                            ⚠ SYSTEM_HALT: UNHANDLED_EXCEPTION
                        </h1>
                        <p style={{ color: '#94a3b8', marginBottom: '30px' }}>
                            The application crashed during the render cycle. Review the trace below:
                        </p>
                        
                        <div style={{ backgroundColor: '#0f172a', padding: '20px', border: '1px solid #1e293b', marginBottom: '20px', overflowX: 'auto' }}>
                            <strong style={{ color: '#06b6d4' }}>ERROR_STRING:</strong>
                            <pre style={{ margin: '10px 0', color: '#ef4444' }}>{this.state.error?.toString()}</pre>
                        </div>

                        <div style={{ backgroundColor: '#0f172a', padding: '20px', border: '1px solid #1e293b', overflowX: 'auto' }}>
                            <strong style={{ color: '#06b6d4' }}>COMPONENT_STACK:</strong>
                            <pre style={{ margin: '10px 0', fontSize: '11px', color: '#64748b' }}>
                                {this.state.errorInfo?.componentStack}
                            </pre>
                        </div>

                        <button 
                            onClick={() => window.location.reload()}
                            style={{
                                marginTop: '30px',
                                padding: '12px 24px',
                                backgroundColor: '#06b6d4',
                                color: '#020617',
                                border: 'none',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                            }}
                        >
                            RE-INITIALIZE_UPLINK
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
