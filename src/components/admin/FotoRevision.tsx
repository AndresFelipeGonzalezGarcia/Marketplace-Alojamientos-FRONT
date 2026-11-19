import { useState } from 'react'

interface FotoRevisionProps {
  url?: string | null
  alt: string
  // Texto del recuadro cuando no hay foto o no carga.
  textoSinFoto: string
  className?: string
}

// Foto de una publicación en revisión. Si falta o no carga se dice, para
// que el administrador lo tenga en cuenta al decidir. Quien la usa le da
// `key={url}` para que un fallo no se arrastre a otra dirección.
function FotoRevision({ url, alt, textoSinFoto, className = '' }: FotoRevisionProps) {
  const [fallo, setFallo] = useState(false)
  const limpia = url?.trim() ?? ''

  return (
    <div className={`foto-revision ${className}`.trim()}>
      {limpia && !fallo ? (
        <img
          className="foto-revision__imagen"
          src={limpia}
          alt={alt}
          loading="lazy"
          onError={() => setFallo(true)}
        />
      ) : (
        <span className="foto-revision__vacia">{textoSinFoto}</span>
      )}
    </div>
  )
}

export default FotoRevision
