import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/** Prevents blank white crash screens — shows the real error instead. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('SG16 UI crash:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            minHeight: '100dvh',
            background: '#010103',
            color: '#fff',
            padding: 24,
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <h1 style={{ color: '#FF2E2E', fontSize: 20, marginBottom: 12 }}>SG16 UI error</h1>
          <p style={{ color: '#94a3b8', marginBottom: 16 }}>
            The app crashed instead of going white. Details:
          </p>
          <pre
            style={{
              background: '#12080e',
              border: '1px solid #4a1a28',
              borderRadius: 12,
              padding: 16,
              overflow: 'auto',
              color: '#FF8A8A',
              fontSize: 13,
            }}
          >
            {this.state.error.message}
            {'\n\n'}
            {this.state.error.stack}
          </pre>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              marginTop: 16,
              background: '#FF2E2E',
              color: '#fff',
              border: 0,
              borderRadius: 10,
              padding: '10px 16px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
