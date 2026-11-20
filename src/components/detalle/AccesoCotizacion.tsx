import { Link, useLocation } from 'react-router'
import { ETIQUETA_ROL, type EstadoRedireccionLogin } from '../../auth/roles'
import type { RolUsuario } from '../../auth/sesion'

interface AccesoCotizacionProps {
  // Usuario
  rol: RolUsuario | null
}

// Acceso a la cotización
function AccesoCotizacion({ rol }: AccesoCotizacionProps) {
  const location = useLocation()

  if (rol) {
    return (
      <div className="acceso-cotizacion" role="note">
        <p className="acceso-cotizacion__titulo">Necesitas una cuenta de huésped</p>
        <p className="acceso-cotizacion__texto">
          Entraste como {ETIQUETA_ROL[rol]}. Para cotizar y reservar alojamientos
          inicia sesión con una cuenta de huésped.
        </p>
      </div>
    )
  }

  const estado: EstadoRedireccionLogin = {
    desde: `${location.pathname}${location.search}`,
  }

  return (
    <div className="acceso-cotizacion">
      <p className="acceso-cotizacion__texto">
        Inicia sesión como huésped para ver el total con todas las tarifas y
        reservar. Volverás a esta misma página.
      </p>
      <Link className="boton-enlace" to="/login" state={estado}>
        Iniciar sesión para cotizar
      </Link>
      <p className="acceso-cotizacion__texto">
        ¿Aún no tienes cuenta? <Link to="/registro">Regístrate</Link>
      </p>
    </div>
  )
}

export default AccesoCotizacion
