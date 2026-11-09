import { Outlet } from 'react-router'
import type { Rol } from '../api/registro'
import MensajePantalla from '../components/publicacion/MensajePantalla'
import { obtenerRolSesion } from './sesion'

interface RutaProtegidaProps {
  rolesPermitidos: Rol[]
}

function RutaProtegida({ rolesPermitidos }: RutaProtegidaProps) {
  const rol = obtenerRolSesion()

  // Mientras no exista login (rol null) no se bloquea el acceso.
  if (rol && !rolesPermitidos.includes(rol)) {
    return (
      <main className="publicacion-pagina">
        <MensajePantalla
          titulo="Acceso denegado"
          mensaje="Tu cuenta no tiene permiso para ver esta página."
        />
      </main>
    )
  }

  return <Outlet />
}

export default RutaProtegida
