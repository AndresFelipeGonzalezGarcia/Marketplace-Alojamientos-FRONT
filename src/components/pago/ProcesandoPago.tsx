import { useEffect, useRef, useState } from 'react'

// Procesando pago
function ProcesandoPago() {
  const [segundos, setSegundos] = useState(0)
  const titulo = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    titulo.current?.focus()
    const inicio = Date.now()
    const intervalo = setInterval(() => {
      setSegundos(Math.floor((Date.now() - inicio) / 1000))
    }, 1000)
    return () => clearInterval(intervalo)
  }, [])

  const demorado = segundos >= 5

  return (
    <section className="procesando-pago" aria-labelledby="procesando-pago-titulo" aria-busy="true">
      <span className="procesando-pago__indicador" aria-hidden="true" />
      <div role="status">
        <h2 className="procesando-pago__titulo" id="procesando-pago-titulo" ref={titulo} tabIndex={-1}>
          Estamos procesando tu pago
        </h2>
        <p className="procesando-pago__texto">
          <strong>No cierres ni recargues esta ventana.</strong> Puede tardar hasta 12 segundos
          mientras el procesador de pagos responde.
        </p>
      </div>
      <p className="procesando-pago__progreso" aria-hidden="true">
        {demorado
          ? `Seguimos esperando la respuesta del procesador · ${segundos} s`
          : `Enviando el cobro · ${segundos} s`}
      </p>
    </section>
  )
}

export default ProcesandoPago
