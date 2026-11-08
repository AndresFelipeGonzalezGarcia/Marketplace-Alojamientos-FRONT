import type { RouteObject } from 'react-router'
import HomePage from './pages/HomePage'
import NotFoundPage from './pages/NotFoundPage'
import RegistroPage from './pages/RegistroPage'

export const routes: RouteObject[] = [
  { path: '/', element: <HomePage /> },
  { path: '/registro', element: <RegistroPage /> },
  { path: '*', element: <NotFoundPage /> },
]
