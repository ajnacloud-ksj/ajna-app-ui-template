import { Link } from "react-router-dom"
import { ArrowLeft } from "lucide-react"

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
      <div className="max-w-sm space-y-4">
        <p className="text-7xl font-bold tabular-nums text-primary/20">404</p>
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-foreground">Page Not Found</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            The page you're looking for doesn't exist. It may have been moved,
            removed, or you may not have the required permissions.
          </p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <ArrowLeft className="h-4 w-4" />
          Return to Dashboard
        </Link>
      </div>
    </div>
  )
}
