import { Component, ErrorInfo, ReactNode } from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import errorLogging from '../services/errorLogging';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  resetKey?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

function isChunkLoadError(error: Error): boolean {
  return (
    error.name === 'ChunkLoadError' ||
    error.message.includes('Loading chunk') ||
    error.message.includes('dynamically imported module') ||
    error.message.includes('Failed to fetch dynamically imported module')
  );
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.resetKey !== prevProps.resetKey && this.state.hasError) {
      this.setState({ hasError: false, error: null, errorInfo: null });
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });

    // Log error to logging service
    errorLogging.logError(error, {
      componentStack: errorInfo.componentStack,
      page: window.location.pathname,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.state.error && isChunkLoadError(this.state.error)) {
        return (
          <div className="min-h-[50vh] flex items-center justify-center px-4">
            <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
                  <ArrowPathIcon className="w-9 h-9 text-blue-600 dark:text-blue-400" />
                </div>

                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  A new version is available
                </h1>

                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  The app has been updated since you last loaded it. Please reload to get the latest version.
                </p>

                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Reload Page
                </button>
              </div>
            </div>
          </div>
        );
      }

      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <ExclamationTriangleIcon className="w-10 h-10 text-red-600" />
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Oops! Something went wrong
              </h1>

              <p className="text-gray-600 mb-6">
                We're sorry for the inconvenience. The application encountered an unexpected error.
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="w-full bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
                  <p className="text-sm font-semibold text-red-800 mb-2">Error Details:</p>
                  <p className="text-xs text-red-700 font-mono break-all">
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <details className="mt-2">
                      <summary className="text-xs text-red-600 cursor-pointer">
                        Stack Trace
                      </summary>
                      <pre className="text-xs text-red-600 mt-2 overflow-auto max-h-40">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={this.handleReset}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Reload Page
                </button>
                <button
                  onClick={() => window.history.back()}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
