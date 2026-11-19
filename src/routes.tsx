import type { RouteObject } from 'react-router'
import RutaProtegida from './auth/RutaProtegida'
import AdminBandejaPage from './pages/AdminBandejaPage'
import AdminRevisionPage from './pages/AdminRevisionPage'
import AlojamientoDetallePage from './pages/AlojamientoDetallePage'
import AlojamientosPage from './pages/AlojamientosPage'
import LayoutApp from './components/navegacion/LayoutApp'
import DisponibilidadPage from './pages/DisponibilidadPage'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import NotFoundPage from './pages/NotFoundPage'
import ProximamentePage from './pages/ProximamentePage'
import PublicacionFormularioPage from './pages/PublicacionFormularioPage'
import RecuperarContrasenaPage from './pages/RecuperarContrasenaPage'
import RegistroPage from './pages/RegistroPage'
import RestablecerContrasenaPage from './pages/RestablecerContrasenaPage'

export const routes: RouteObject[] = [
  {
    element: <LayoutApp />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/registro', element: <RegistroPage /> },
      // Públicas: sin sesión y para cualquier rol.
      { path: '/alojamientos', element: <AlojamientosPage /> },
      { path: '/alojamientos/:id', element: <AlojamientoDetallePage /> },
      // Marcador de posición hasta la historia de inicio de sesión.
      { path: '/login', element: <LoginPage /> },
      { path: '/recuperar-contrasena', element: <RecuperarContrasenaPage /> },
      {
        path: '/restablecer-contrasena',
        element: <RestablecerContrasenaPage />,
      },
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
          { path: '/admin', element: <AdminBandejaPage /> },
          {
            path: '/admin/publicaciones/:id',
            element: <AdminRevisionPage />,
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]
