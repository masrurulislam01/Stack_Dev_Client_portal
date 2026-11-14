import {AlertTriangle, Home, RefreshCw} from 'lucide-react';
import {Component, type ErrorInfo, type ReactNode} from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    errorMessage: '',
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || 'An unexpected error occurred.',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Stack Dev Portal ErrorBoundary caught an error:', error, info);
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen bg-background text-body flex items-center justify-center px-4 py-12">
        <div
          role="alert"
          className="w-full max-w-md bg-surface rounded-3xl border border-border shadow-lg p-6 sm:p-8 text-center space-y-5"
        >
          <div className="w-12 h-12 rounded-xl bg-danger-soft text-danger-text flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" aria-hidden="true" />
          </div>

          <div className="space-y-2">
            <h1 className="font-heading text-xl font-bold tracking-tight text-foreground">
              Something went wrong
            </h1>
            <p className="text-sm text-muted leading-relaxed">
              The portal encountered an unexpected error. Reload the page to restore your session.
            </p>
            {this.state.errorMessage && (
              <p className="mt-2 px-3 py-2 rounded-xl bg-surface-muted border border-border text-xs font-mono text-body break-words">
                {this.state.errorMessage}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl bg-gradient-brand text-white text-sm font-semibold shadow-xs hover:brightness-110 hover:shadow-brand transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              <span>Reload Page</span>
            </button>
            <button
              type="button"
              onClick={() => {
                window.location.href = '/';
              }}
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl border border-border-strong bg-surface text-foreground hover:bg-surface-muted text-sm font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Home className="w-4 h-4" aria-hidden="true" />
              <span>Go to Home</span>
            </button>
          </div>
        </div>
      </div>
    );
  }
}
