import type { RouteObject } from 'react-router'
import RutaProtegida from './auth/RutaProtegida'
import AdminBandejaPage from './pages/AdminBandejaPage'
import AdminRevisionPage from './pages/AdminRevisionPage'
import AlojamientoDetallePage from './pages/AlojamientoDetallePage'
import AlojamientosPage from './pages/AlojamientosPage'
import LayoutApp from './components/navegacion/LayoutApp'
import DetalleReservaPage from './pages/DetalleReservaPage'
import DisponibilidadPage from './pages/DisponibilidadPage'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import MisPublicacionesPage from './pages/MisPublicacionesPage'
import MisReservasPage from './pages/MisReservasPage'
import NotFoundPage from './pages/NotFoundPage'
import PagoReservaPage from './pages/PagoReservaPage'
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
      // Rutas públicas
      { path: '/alojamientos', element: <AlojamientosPage /> },
      { path: '/alojamientos/:id', element: <AlojamientoDetallePage /> },
      // Próximamente
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
            path: '/publicaciones',
            element: <MisPublicacionesPage />,
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
        element: <RutaProtegida rolesPermitidos={['HUESPED']} />,
        children: [
          { path: '/reservas', element: <MisReservasPage /> },
          { path: '/reservas/:id', element: <DetalleReservaPage /> },
          { path: '/reservas/:id/pago', element: <PagoReservaPage /> },
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
