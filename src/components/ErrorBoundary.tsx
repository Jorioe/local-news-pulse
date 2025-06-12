import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: undefined,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 text-red-700 p-4">
          <h1 className="text-2xl font-bold mb-4">Er is iets misgegaan.</h1>
          <p className="mb-4">Onze excuses, er heeft zich een onverwachte fout voorgedaan.</p>
          <details className="bg-white p-4 rounded-lg shadow-md w-full max-w-2xl text-left">
            <summary className="font-medium cursor-pointer">Technische details</summary>
            <pre className="mt-2 text-sm text-gray-600 whitespace-pre-wrap">
              {this.state.error?.toString()}
              <br />
              {this.state.error?.stack}
            </pre>
          </details>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Pagina vernieuwen
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 