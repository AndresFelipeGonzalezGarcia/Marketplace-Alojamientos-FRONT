import { Link } from 'react-router'
import Icono from '../acceso/Icono'
import { RECUPERAR_CONTRASENA } from '../navegacion/destinos'

interface EnlaceInvalidoProps {
  mensaje: string
}

// Enlace inválido
function EnlaceInvalido({ mensaje }: EnlaceInvalidoProps) {
  return (
    <section className="acceso__tarjeta">
      <h1 className="acceso__titulo">Este enlace ya no sirve</h1>
      <p className="acceso__alerta" role="alert">
        <Icono nombre="alerta" className="acceso__alerta-icono" />
        <span>{mensaje}</span>
      </p>
      <div className="acceso__acciones acceso__acciones--separadas">
        <Link className="boton-acceso" to={RECUPERAR_CONTRASENA.ruta}>
          Pedir un enlace nuevo
        </Link>
        <Link className="boton-acceso-secundario" to="/login">
          Volver a iniciar sesión
        </Link>
      </div>
    </section>
  )
}

export default EnlaceInvalido
