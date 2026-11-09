import type { RouteObject } from 'react-router'
import RutaProtegida from './auth/RutaProtegida'
import PublicacionFormularioPage from './pages/PublicacionFormularioPage'
import DisponibilidadPage from './pages/DisponibilidadPage'
import HomePage from './pages/HomePage'
import NotFoundPage from './pages/NotFoundPage'
import RegistroPage from './pages/RegistroPage'

export const routes: RouteObject[] = [
  { path: '/', element: <HomePage /> },
  { path: '/registro', element: <RegistroPage /> },
  {
    element: <RutaProtegida rolesPermitidos={['ANFITRION']} />,
    children: [
      { path: '/publicaciones/nueva', element: <PublicacionFormularioPage /> },
      {
        path: '/publicaciones/:id/disponibilidad',
        element: <DisponibilidadPage />,
      },
      {
        path: '/publicaciones/:id/editar',
        element: <PublicacionFormularioPage />,
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]
