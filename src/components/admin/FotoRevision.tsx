import { useState } from 'react'

interface FotoRevisionProps {
  url?: string | null
  alt: string
  // Texto sin foto
  textoSinFoto: string
  className?: string
}

// Foto de revisión
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
