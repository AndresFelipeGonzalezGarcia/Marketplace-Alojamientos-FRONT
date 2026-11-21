import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { mensajeConReferencia, type ErrorApi } from '../api/errores'
import { listarPublicaciones, type PublicacionResumen } from '../api/publicaciones'
import '../components/admin/admin.css'
import '../components/formulario/formulario.css'
import FilaPublicacion from '../components/publicacion/FilaPublicacion'
import MensajePantalla from '../components/publicacion/MensajePantalla'

type Carga =
  | { fase: 'cargando' }
  | { fase: 'lista'; publicaciones: PublicacionResumen[] }
  | { fase: 'error'; error: ErrorApi }

// Mis publicaciones
function MisPublicacionesPage() {
  const [carga, setCarga] = useState<Carga>({ fase: 'cargando' })
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let vigente = true
    listarPublicaciones().then((respuesta) => {
      if (!vigente) return
      setCarga(
        respuesta.estado === 'ok'
          ? { fase: 'lista', publicaciones: respuesta.datos }
          : { fase: 'error', error: respuesta.error },
      )
    })
    return () => {
      vigente = false
    }
  }, [intento])

  function recargar() {
    setCarga({ fase: 'cargando' })
    setIntento((actual) => actual + 1)
  }

  let contenido
  if (carga.fase === 'cargando') {
    contenido = (
      <p className="publicacion-cargando" role="status">
        Cargando tus publicaciones…
      </p>
    )
  } else if (carga.fase === 'error') {
    contenido = (
      <MensajePantalla
        titulo="No pudimos cargar tus publicaciones"
        mensaje={mensajeConReferencia(carga.error)}
      >
        <button className="boton-secundario" type="button" onClick={recargar}>
          Reintentar
        </button>
      </MensajePantalla>
    )
  } else if (carga.publicaciones.length === 0) {
    contenido = (
      <MensajePantalla
        titulo="Aún no tienes publicaciones"
        mensaje="Crea tu primera publicación con los datos, fotos y condiciones de tu alojamiento."
      >
        <Link className="boton-enlace" to="/publicaciones/nueva">
          Crear mi primera publicación
        </Link>
      </MensajePantalla>
    )
  } else {
    contenido = (
      <ul className="bandeja-lista" aria-label="Tus publicaciones">
        {carga.publicaciones.map((publicacion) => (
          <FilaPublicacion key={publicacion.id} publicacion={publicacion} />
        ))}
      </ul>
    )
  }

  return (
    <main className="publicacion-pagina">
      <div className="publicacion-cabecera bandeja-cabecera">
        <div>
          <h1 className="publicacion-cabecera__titulo">Mis publicaciones</h1>
          <p className="bandeja-cabecera__texto">
            Edita tus alojamientos y gestiona su disponibilidad.
          </p>
        </div>
        {carga.fase === 'lista' && carga.publicaciones.length > 0 && (
          <p className="bandeja-cabecera__conteo">
            {carga.publicaciones.length}{' '}
            {carga.publicaciones.length === 1 ? 'publicación' : 'publicaciones'}
          </p>
        )}
      </div>
      {contenido}
    </main>
  )
}

export default MisPublicacionesPage
