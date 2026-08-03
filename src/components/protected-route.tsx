import React from "react"
import { Navigate, useLocation } from "react-router-dom"

interface ProtectedRouteProps {
  visitCondition: boolean
  route: string
  children: React.ReactNode
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  visitCondition,
  route,
  children,
}) => {
  const location = useLocation()

  if (!visitCondition) {
    // Preserve the query string (e.g. ?sso=1 from a portal-originated arrival)
    // so the login page still sees it after the redirect.
    return (
      <Navigate
        to={{ pathname: route, search: location.search }}
        state={{ from: location }}
        replace
      />
    )
  }

  return children
}

export default ProtectedRoute
