import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

// NOTE: `@types/react` is not installed in this project, so `React` resolves to `any` and tsc
// cannot see the inherited `props` / `setState` members of a class component. Aliasing the base
// class to `any` is deliberate and keeps this boundary compiling. Adding @types/react would
// enable real type checking across the whole frontend (worth doing, but a separate change).
const ReactComponent = React.Component as any;

interface BoundaryProps {
  children?: any;
  label?: string;
}

/**
 * Catches render-time exceptions so one bad report cannot blank the entire page.
 *
 * Audit data is unvalidated LLM output, so "a component throws" has to degrade into a contained
 * error card rather than an empty screen — which is exactly how the earlier hooks bug presented.
 */
export default class ErrorBoundary extends ReactComponent {
  state: any = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: any) {
    console.error('Render error contained by ErrorBoundary:', error, info?.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="glass-card rounded-2xl p-8 text-center shadow-lg border border-red-500/30">
        <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-3" />
        <h3 className="font-bold text-white text-sm">
          {this.props.label ? `${this.props.label} could not be displayed` : 'Something went wrong rendering this view'}
        </h3>
        <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
          The rest of the app still works. This is usually caused by a malformed report — re-running
          the scan normally resolves it.
        </p>
        <p className="text-[10px] font-mono text-slate-500 mt-3 break-all">{this.state.error.message}</p>
        <button
          type="button"
          onClick={this.reset}
          className="mt-4 bg-white/10 hover:bg-white/15 text-slate-200 font-bold text-xs px-4 py-2.5 rounded-xl border border-white/10 inline-flex items-center gap-2 transition cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Try again</span>
        </button>
      </div>
    );
  }
}
