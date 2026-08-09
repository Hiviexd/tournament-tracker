import { Component, type ErrorInfo, type ReactNode } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

type AppErrorBoundaryProps = {
    children: ReactNode;
};

type AppErrorBoundaryState = {
    hasError: boolean;
    errorMessage: string | null;
    errorStack: string | null;
    componentStack: string | null;
};

class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
    public constructor(props: AppErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            errorMessage: null,
            errorStack: null,
            componentStack: null,
        };
    }

    public static getDerivedStateFromError(error: Error): Partial<AppErrorBoundaryState> {
        return {
            hasError: true,
            errorMessage: error.message || "Unknown rendering error",
            errorStack: error.stack || null,
        };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        console.error("Unhandled rendering error:", error, errorInfo);
        this.setState({
            componentStack: errorInfo.componentStack || null,
        });
    }

    private handleReload = (): void => {
        window.location.reload();
    };

    public render(): ReactNode {
        const showDebugDetails = import.meta.env.DEV && (this.state.errorStack || this.state.componentStack);

        if (this.state.hasError) {
            return (
                <main className="app-error-boundary">
                    <section className="app-error-boundary-panel">
                        <FontAwesomeIcon icon="exclamation-circle" size="3x" className="app-error-boundary-icon" />
                        <h1>Something went wrong</h1>
                        <p>An unexpected rendering error occurred. You can reload the website and try again.</p>
                        {this.state.errorMessage && (
                            <pre className="app-error-boundary-message">{this.state.errorMessage}</pre>
                        )}
                        <p>If the error persists, please contact Hivie.</p>
                        <div className="app-error-boundary-actions">
                            <button type="button" onClick={this.handleReload}>
                                Reload
                            </button>
                        </div>
                        {showDebugDetails && (
                            <details className="app-error-boundary-debug">
                                <summary>Stack trace (development only)</summary>
                                {this.state.errorStack && <pre>{this.state.errorStack}</pre>}
                                {this.state.componentStack && <pre>{this.state.componentStack}</pre>}
                            </details>
                        )}
                    </section>
                </main>
            );
        }

        return this.props.children;
    }
}

export default AppErrorBoundary;
