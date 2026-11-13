import { useState } from 'react'
import { Link, Navigate, Outlet, useLocation } from 'react-router'
import MensajePantalla from '../components/publicacion/MensajePantalla'
import { ETIQUETA_ROL, type EstadoRedireccionLogin } from './roles'
import { obtenerMotivoUltimoCierre, type RolUsuario } from './sesion'
import { useSesion } from './useSesion'

interface RutaProtegidaProps {
  rolesPermitidos: RolUsuario[]
}

function RutaProtegida({ rolesPermitidos }: RutaProtegidaProps) {
  const sesion = useSesion()
  const location = useLocation()
  // Distingue "llegó sin sesión" de "la sesión terminó estando aquí".
  const [entroConSesion] = useState(() => sesion !== null)

  if (!sesion) {
    const motivo = obtenerMotivoUltimoCierre()

    // Quien cierra sesión a propósito va al inicio, no al login.
    if (entroConSesion && motivo === 'manual') {
      return <Navigate to="/" replace />
    }

    const estado: EstadoRedireccionLogin = {
      desde: `${location.pathname}${location.search}${location.hash}`,
      ...(motivo === 'expirada' ? { motivo } : {}),
    }
    return <Navigate to="/login" replace state={estado} />
  }

  if (!rolesPermitidos.includes(sesion.usuario.rol)) {
    const requeridos = rolesPermitidos.map((rol) => ETIQUETA_ROL[rol])
    return (
      <main className="publicacion-pagina">
        <MensajePantalla
          titulo="Acceso denegado"
          mensaje={`Esta página es solo para cuentas de tipo ${requeridos.join(' o ')}. Entraste como ${ETIQUETA_ROL[sesion.usuario.rol]}.`}
        >
          <Link className="boton-enlace" to="/">
            Volver al inicio
          </Link>
        </MensajePantalla>
      </main>
    )
  }

  return <Outlet />
}

export default RutaProtegida
