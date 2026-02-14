import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
    }

    private handleRetry = () => {
        this.setState({ hasError: false, error: null });
        // Opcional: tentar recuperar sem reload total se possível, mas reload é mais seguro para limpar estado corrompido global
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-[400px] flex flex-col items-center justify-center p-6 text-center bg-slate-900/50 rounded-lg border border-slate-800 m-4">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                        <svg
                            className="w-8 h-8 text-red-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-slate-100 mb-2">
                        Algo deu errado
                    </h2>
                    <p className="text-slate-400 mb-6 max-w-sm">
                        Ocorreu um erro inesperado ao carregar esta seção.
                    </p>
                    <button
                        onClick={this.handleRetry}
                        className="px-6 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors"
                    >
                        Tentar novamente
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
