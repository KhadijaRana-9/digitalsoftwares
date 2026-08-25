import { Link } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'
import { Button } from '../../components/ui/index.js'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-4 text-center">
      <span className="text-gradient text-7xl font-black">404</span>
      <h1 className="mt-4 text-xl font-bold text-ink">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-ink-soft">
        The page you're looking for doesn't exist or may have moved.
      </p>
      <div className="mt-6 flex gap-3">
        <Link to="/">
          <Button icon={Home}>Back to home</Button>
        </Link>
        <Button variant="outline" icon={ArrowLeft} onClick={() => window.history.back()}>
          Go back
        </Button>
      </div>
    </div>
  )
}
