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
    return <Navigate to={route} state={{ from: location }} replace />
  }

  return children
}

export default ProtectedRoute
