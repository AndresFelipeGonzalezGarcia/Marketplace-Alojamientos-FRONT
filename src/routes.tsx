import type { RouteObject } from 'react-router'
import RutaProtegida from './auth/RutaProtegida'
import LayoutApp from './components/navegacion/LayoutApp'
import DisponibilidadPage from './pages/DisponibilidadPage'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import NotFoundPage from './pages/NotFoundPage'
import ProximamentePage from './pages/ProximamentePage'
import PublicacionFormularioPage from './pages/PublicacionFormularioPage'
import RegistroPage from './pages/RegistroPage'

export const routes: RouteObject[] = [
  {
    element: <LayoutApp />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/registro', element: <RegistroPage /> },
      // Marcador de posición hasta la historia de inicio de sesión.
      { path: '/login', element: <LoginPage /> },
      {
        element: <RutaProtegida rolesPermitidos={['ANFITRION']} />,
        children: [
          {
            // Marcador de posición hasta la historia del listado.
            path: '/publicaciones',
            element: (
              <ProximamentePage
                titulo="Mis publicaciones"
                mensaje="Aquí verás tus alojamientos para editarlos y gestionar su disponibilidad."
              />
            ),
          },
          {
            path: '/publicaciones/nueva',
            element: <PublicacionFormularioPage />,
          },
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
      {
        element: <RutaProtegida rolesPermitidos={['ADMINISTRADOR']} />,
        children: [
          {
            // Marcador de posición hasta la historia de moderación.
            path: '/admin',
            element: (
              <ProximamentePage
                titulo="Publicaciones pendientes"
                mensaje="Aquí revisarás y aprobarás las publicaciones enviadas por los anfitriones."
              />
            ),
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]
