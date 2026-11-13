import { Navigate, useLocation } from 'react-router'
import { leerEstadoRedireccion } from '../auth/roles'
import { modoDemoActivo } from '../auth/sesionDemo'
import { useSesion } from '../auth/useSesion'
import Icono from '../components/acceso/Icono'
import PantallaAcceso from '../components/acceso/PantallaAcceso'
import AccesoDemo from '../components/login/AccesoDemo'
import FormularioLogin from '../components/login/FormularioLogin'
import { inicioDelRol } from '../components/navegacion/destinos'

// `desde` llega del estado de navegación, que también puede escribirse a
// mano: solo se aceptan rutas internas (no "//otro-sitio") y nunca /login.
function destinoSeguro(desde: string | undefined): string | undefined {
  if (!desde || desde.startsWith('//') || desde.startsWith('/\\')) {
    return undefined
  }
  const ruta = desde.split(/[?#]/)[0]
  return ruta === '/login' ? undefined : desde
}

function LoginPage() {
  const sesion = useSesion()
  const location = useLocation()
  const { desde, motivo } = leerEstadoRedireccion(location.state)
  const destino = destinoSeguro(desde)

  // Al iniciar sesión (o si ya había una) se sale del login.
  if (sesion) {
    return (
      <Navigate to={destino ?? inicioDelRol(sesion.usuario.rol)} replace />
    )
  }

  return (
    <PantallaAcceso>
      <section className="acceso__tarjeta">
        <h1 className="acceso__titulo">Iniciar sesión</h1>
        <p className="acceso__subtitulo">
          {destino
            ? 'Inicia sesión para continuar donde ibas.'
            : 'Entra para gestionar tus alojamientos y reservas.'}
        </p>

        {motivo === 'expirada' && (
          <p className="acceso__aviso" role="status">
            <Icono nombre="reloj" className="acceso__aviso-icono" />
            <span>
              <strong>Tu sesión expiró.</strong> Inicia sesión de nuevo para
              continuar.
            </span>
          </p>
        )}

        <FormularioLogin />
        {modoDemoActivo() && <AccesoDemo />}
      </section>
    </PantallaAcceso>
  )
}

export default LoginPage
