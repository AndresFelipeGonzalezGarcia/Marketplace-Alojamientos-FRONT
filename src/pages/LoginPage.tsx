import { Link, useLocation } from 'react-router'
import { leerEstadoRedireccion } from '../auth/roles'
import MensajePantalla from '../components/publicacion/MensajePantalla'

// Marcador de posición: la pantalla real de inicio de sesión llega en su
// propia historia. Ya recibe `desde` y `motivo` de RutaProtegida.
function LoginPage() {
  const location = useLocation()
  const { desde, motivo } = leerEstadoRedireccion(location.state)

  return (
    <main className="publicacion-pagina">
      {motivo === 'expirada' && (
        <p className="aviso-sesion" role="alert">
          Tu sesión expiró. Inicia sesión de nuevo para continuar.
        </p>
      )}
      <MensajePantalla
        titulo="Iniciar sesión"
        mensaje={
          desde
            ? 'Necesitas iniciar sesión para ver esa página. La pantalla de inicio de sesión estará disponible muy pronto.'
            : 'La pantalla de inicio de sesión estará disponible muy pronto.'
        }
      >
        <p>
          <span className="etiqueta-proximamente">Próximamente</span>
        </p>
        <div className="acciones-mensaje">
          <Link className="boton-enlace" to="/registro">
            Crear cuenta
          </Link>
          <Link className="boton-enlace boton-enlace--secundario" to="/">
            Volver al inicio
          </Link>
        </div>
      </MensajePantalla>
    </main>
  )
}

export default LoginPage
