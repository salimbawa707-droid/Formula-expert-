import { Component, ErrorInfo, ReactNode } from 'react';
import { RotateCcw, ShieldAlert } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught R&D Lab Error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#070b18] text-slate-100 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-full max-w-md bg-slate-900 border border-red-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-red-500" />

            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto mb-4">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <h2 className="text-lg font-black text-white">Laboratory Runtime Exception</h2>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              The formulation workspace encountered an unexpected calculation or rendering failure. Your local IndexedDB formula data remains safe and preserved.
            </p>

            <div className="mt-4 p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-left">
              <div className="text-[10px] font-bold text-red-400 uppercase tracking-wider font-mono">
                Error Stack
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-1 break-words">
                {this.state.error?.message || 'Unknown runtime anomaly'}
              </p>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/10"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reload Workspace
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
