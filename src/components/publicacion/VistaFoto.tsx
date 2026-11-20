import { useState } from 'react'

interface VistaFotoProps {
  url: string
  numero: number
  portada: boolean
}

// URL de imagen
function pareceUrlDeImagen(url: string) {
  return /^https?:\/\/\S+$/i.test(url) || /^\/(?!\/)\S+$/.test(url)
}

// Vista previa de foto
function VistaFoto({ url, numero, portada }: VistaFotoProps) {
  const [fallo, setFallo] = useState(false)
  const limpia = url.trim()
  const mostrar = pareceUrlDeImagen(limpia) && !fallo

  return (
    <div className="imagen-fila__recuadro">
      {mostrar ? (
        <img
          className="imagen-fila__foto"
          src={limpia}
          alt={`Vista previa de la foto ${numero}`}
          onError={() => setFallo(true)}
        />
      ) : (
        <span>
          {limpia
            ? 'No pudimos cargar esta foto. Revisa la dirección.'
            : 'Pega la dirección de la foto para verla aquí.'}
        </span>
      )}
      {portada && <span className="imagen-fila__portada">Portada</span>}
    </div>
  )
}

export default VistaFoto
