import { useState } from 'react'
import { ETIQUETA_ROL } from '../../auth/roles'
import { guardarSesion, type RolUsuario } from '../../auth/sesion'
import { crearSesionDemo } from '../../auth/sesionDemo'

const ROLES_DEMO: { rol: RolUsuario; descripcion: string }[] = [
  { rol: 'ANFITRION', descripcion: 'Publicaciones y disponibilidad' },
  { rol: 'HUESPED', descripcion: 'Inicio del huésped' },
  { rol: 'ADMINISTRADOR', descripcion: 'Moderación' },
]

// Solo se monta con modoDemoActivo(). Crea la sesión en el navegador,
// sin llamar al backend.
function AccesoDemo() {
  const [abierto, setAbierto] = useState(false)

  return (
    <section className="acceso-demo" aria-labelledby="acceso-demo-titulo">
      <p id="acceso-demo-titulo" className="acceso-demo__titulo">
        Desarrollo sin backend
      </p>
      <button
        type="button"
        className="boton-acceso-secundario"
        aria-expanded={abierto}
        aria-controls="acceso-demo-opciones"
        onClick={() => setAbierto((actual) => !actual)}
      >
        Entrar con una sesión de prueba
      </button>
      {abierto && (
        <ul id="acceso-demo-opciones" className="acceso-demo__opciones">
          {ROLES_DEMO.map(({ rol, descripcion }) => (
            <li key={rol}>
              <button
                type="button"
                className="acceso-demo__opcion"
                onClick={() => guardarSesion(crearSesionDemo(rol))}
              >
                <span className="acceso-demo__rol">
                  Entrar como {ETIQUETA_ROL[rol].toLowerCase()} de prueba
                </span>
                <span className="acceso-demo__descripcion">{descripcion}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default AccesoDemo
