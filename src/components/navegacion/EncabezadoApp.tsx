import { Link, useLocation, useNavigate } from 'react-router'
import { ETIQUETA_ROL } from '../../auth/roles'
import { limpiarSesion } from '../../auth/sesion'
import { useSesion } from '../../auth/useSesion'
import {
  CREAR_CUENTA,
  estaActivo,
  INICIAR_SESION,
  INICIO,
  seccionesDelRol,
} from './destinos'
import EnlaceNavegacion from './EnlaceNavegacion'
import './navegacion.css'

function EncabezadoApp() {
  const sesion = useSesion()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const usuario = sesion?.usuario ?? null
  const secciones = [INICIO, ...seccionesDelRol(usuario?.rol ?? null)]

  function cerrarSesion() {
    limpiarSesion()
    void navigate('/', { replace: true })
  }

  return (
    <header className="encabezado-app">
      <Link className="encabezado-app__marca" to="/">
        <span className="encabezado-app__logo" aria-hidden="true">
          LR
        </span>
        <span className="encabezado-app__nombre">Inversiones LR</span>
        <span className="solo-lector">, ir al inicio</span>
      </Link>

      <nav className="encabezado-app__menu" aria-label="Principal">
        <ul className="encabezado-app__lista">
          {secciones.map((destino) => (
            <li key={destino.ruta}>
              <EnlaceNavegacion
                destino={destino}
                activo={estaActivo(destino, pathname)}
              />
            </li>
          ))}
        </ul>
      </nav>

      <div className="encabezado-app__cuenta">
        {usuario ? (
          <>
            <p className="encabezado-app__usuario">
              <span className="encabezado-app__usuario-nombre">
                {usuario.nombre}
              </span>
              <span className="encabezado-app__usuario-rol">
                {ETIQUETA_ROL[usuario.rol]}
              </span>
            </p>
            <button
              type="button"
              className="encabezado-app__salir"
              onClick={cerrarSesion}
            >
              Cerrar sesión
            </button>
          </>
        ) : (
          <>
            <EnlaceNavegacion
              destino={CREAR_CUENTA}
              activo={estaActivo(CREAR_CUENTA, pathname)}
              variante="cuenta"
            />
            <EnlaceNavegacion
              destino={INICIAR_SESION}
              activo={estaActivo(INICIAR_SESION, pathname)}
              variante="cuenta"
            />
          </>
        )}
      </div>
    </header>
  )
}

export default EncabezadoApp
