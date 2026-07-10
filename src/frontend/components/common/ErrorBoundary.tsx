// @ts-nocheck
import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-4" dir="rtl">
          <div className="max-w-md w-full bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl text-center border border-slate-200 dark:border-slate-700">
            <h2 className="text-2xl font-bold text-red-500 mb-4">عذراً، حدث خطأ غير متوقع</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              نأسف لذلك. يرجى تحديث الصفحة أو المحاولة لاحقاً.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              تحديث الصفحة
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
