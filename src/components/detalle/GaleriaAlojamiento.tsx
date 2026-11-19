import { useState, type KeyboardEvent } from 'react'

interface GaleriaAlojamientoProps {
  titulo: string
  // La primera es la portada.
  imagenes: string[]
}

function Flecha({ direccion }: { direccion: 'anterior' | 'siguiente' }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path
        d={direccion === 'anterior' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// La foto manda: una foto grande que se recorre con las flechas (en pantalla
// o del teclado) y una tira de miniaturas para saltar a cualquiera. Empieza
// siempre en la portada.
function GaleriaAlojamiento({ titulo, imagenes }: GaleriaAlojamientoProps) {
  const [actual, setActual] = useState(0)
  const [fallidas, setFallidas] = useState<ReadonlySet<number>>(new Set())
  const total = imagenes.length

  function marcarFallida(indice: number) {
    setFallidas((anteriores) => new Set(anteriores).add(indice))
  }

  if (total === 0) {
    return (
      <div className="galeria galeria--vacia">
        <p className="galeria__sin-foto">
          Este alojamiento todavía no tiene fotos.
        </p>
      </div>
    )
  }

  const ir = (indice: number) => setActual((indice + total) % total)
  const descripcion = (indice: number) =>
    indice === 0
      ? `${titulo}, portada`
      : `${titulo}, foto ${indice + 1} de ${total}`

  function alPulsarTecla(evento: KeyboardEvent) {
    if (total < 2) return
    if (evento.key === 'ArrowLeft') {
      evento.preventDefault()
      ir(actual - 1)
    } else if (evento.key === 'ArrowRight') {
      evento.preventDefault()
      ir(actual + 1)
    }
  }

  return (
    <section
      className="galeria"
      aria-roledescription="galería"
      aria-label="Fotos del alojamiento"
      onKeyDown={alPulsarTecla}
    >
      <div className="galeria__escenario">
        {fallidas.has(actual) ? (
          <p className="galeria__sin-foto" role="img" aria-label={descripcion(actual)}>
            No pudimos cargar esta foto.
          </p>
        ) : (
          <img
            key={imagenes[actual]}
            className="galeria__foto"
            src={imagenes[actual]}
            alt={descripcion(actual)}
            decoding="async"
            onError={() => marcarFallida(actual)}
          />
        )}
        {actual === 0 && <span className="galeria__insignia">Portada</span>}
        {total > 1 && (
          <>
            <button
              className="galeria__flecha galeria__flecha--anterior"
              type="button"
              aria-label="Foto anterior"
              onClick={() => ir(actual - 1)}
            >
              <Flecha direccion="anterior" />
            </button>
            <button
              className="galeria__flecha galeria__flecha--siguiente"
              type="button"
              aria-label="Foto siguiente"
              onClick={() => ir(actual + 1)}
            >
              <Flecha direccion="siguiente" />
            </button>
            <p className="galeria__contador" aria-live="polite">
              Foto {actual + 1} de {total}
            </p>
          </>
        )}
      </div>

      {total > 1 && (
        <ul className="galeria__miniaturas" aria-label="Elegir foto">
          {imagenes.map((imagen, indice) => (
            <li key={`${indice}-${imagen}`}>
              <button
                className="galeria__miniatura"
                type="button"
                aria-label={`Ver ${indice === 0 ? 'la portada' : `la foto ${indice + 1}`}`}
                aria-current={indice === actual ? 'true' : undefined}
                onClick={() => ir(indice)}
              >
                {fallidas.has(indice) ? (
                  <span className="galeria__miniatura-vacia" />
                ) : (
                  <img
                    src={imagen}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    onError={() => marcarFallida(indice)}
                  />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default GaleriaAlojamiento
