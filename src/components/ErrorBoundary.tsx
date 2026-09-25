import { Component, type ErrorInfo, type ReactNode } from "react";
import { ErrorNote } from "./ui";

type Props = { children: ReactNode };
type State = { error: Error | null };

/** Stops a crash in one page from blanking the whole app. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[CS dashboard] Page crashed:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <ErrorNote
          message={`Something on this page broke: ${this.state.error.message}. The backend may be on a different version than this dashboard.`}
          onRetry={() => this.setState({ error: null })}
        />
      );
    }
    return this.props.children;
  }
}
