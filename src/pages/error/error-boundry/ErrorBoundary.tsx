import { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Error caught by ErrorBoundary:', error, errorInfo.componentStack);
  }

  handleReload = () => window.location.reload();

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <main className="min-h-screen bg-white flex items-center justify-center px-5">
          <div className="max-w-sm w-full text-center">
            {/* Pulsing warning icon */}
            <div className="flex justify-center mb-8">
              <div className="relative w-24 h-24">
                <span className="absolute inset-0 rounded-full bg-red-100 animate-ping opacity-40" />
                <span className="relative flex items-center justify-center w-24 h-24 rounded-full bg-red-50">
                  <svg
                    viewBox="0 0 48 48"
                    width="44"
                    height="44"
                    fill="none"
                    aria-hidden="true"
                  >
                    <circle cx="24" cy="24" r="20" stroke="#ef4444" strokeWidth="2.5" />
                    <path d="M24 14v13" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
                    <circle cx="24" cy="33" r="2.2" fill="#ef4444" />
                  </svg>
                </span>
              </div>
            </div>

            <h1 className="text-xl font-bold text-gray-900 mb-2 font-dmSans">
              Something went wrong
            </h1>
            <p className="text-sm text-gray-500 mb-5 leading-relaxed font-inter">
              An unexpected error occurred. Try reloading the page — if the problem persists, go back home.
            </p>

            {/* Error message pill */}
            {this.state.error?.message && (
              <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 mb-6 font-mono break-all text-left">
                {this.state.error.message}
              </p>
            )}

            <div className="flex flex-col ss:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReload}
                className="flex-1 px-6 py-2.5 rounded-xl bg-green1 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Reload Page
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex-1 px-6 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                Go to Home
              </button>
            </div>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
