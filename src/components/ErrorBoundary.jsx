import { Component } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

// Without this, any unhandled render-time exception anywhere in the tree
// unmounts the whole app to a blank screen with zero explanation — this is
// the last line of defense, not a substitute for handling errors closer to
// where they happen (query error states, permission checks, etc).
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Unhandled render error:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-cream px-6">
          <div className="flex max-w-sm flex-col items-center rounded-2xl border border-red-100 bg-red-50/60 px-8 py-14 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <h1 className="mt-4 text-base font-bold text-ink">Something went wrong</h1>
            <p className="mt-1.5 text-sm text-ink-soft">
              This page hit an unexpected error. Reloading usually fixes it — if it keeps
              happening, the team has been able to see this error in the console.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-5 inline-flex items-center gap-2 rounded-full border border-line bg-white px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-orange-300 hover:text-orange-600"
            >
              <RotateCcw className="h-4 w-4" /> Reload page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
