import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4 text-center text-slate-800 dark:text-slate-200">
          <div className="max-w-lg bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl">
            <h1 className="text-2xl font-bold text-red-500 mb-4">عذراً، حدث خطأ غير متوقع.</h1>
            <p className="mb-4">يرجى تحديث الصفحة أو المحاولة مرة أخرى لاحقاً.</p>
            <pre className="text-left text-xs bg-slate-100 dark:bg-slate-900 p-4 rounded overflow-auto max-h-40">
              {this.state.error?.message}
            </pre>
            <button
              className="mt-6 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              onClick={() => window.location.reload()}
            >
              تحديث الصفحة
            </button>
          </div>
        </div>
      );
    }

    return this.props.children as ReactNode;
  }
}
export default ErrorBoundary;
