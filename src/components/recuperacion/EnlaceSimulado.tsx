interface EnlaceSimuladoProps {
  enlace: string
}

// Validar enlace
function enlaceSeguro(enlace: string): string | null {
  try {
    const url = new URL(enlace, window.location.origin)
    return url.protocol === 'http:' || url.protocol === 'https:'
      ? url.href
      : null
  } catch {
    return null
  }
}

// Enlace simulado
function EnlaceSimulado({ enlace }: EnlaceSimuladoProps) {
  const href = enlaceSeguro(enlace)
  if (!href) return null

  return (
    <section className="acceso-dev" aria-labelledby="acceso-dev-titulo">
      <p id="acceso-dev-titulo" className="acceso-dev__titulo">
        Solo en desarrollo: correo simulado
      </p>
      <p className="acceso-dev__texto">
        El servidor de desarrollo no envía correos. Este es el enlace que habría
        llegado; en producción no aparece.
      </p>
      <a className="acceso__enlace acceso-dev__enlace" href={href}>
        Abrir enlace para restablecer la contraseña
      </a>
    </section>
  )
}

export default EnlaceSimulado
