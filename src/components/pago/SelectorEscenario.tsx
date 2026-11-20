import type { EscenarioPago } from '../../api/reservas'

interface SelectorEscenarioProps {
  valor: EscenarioPago
  onCambiar: (escenario: EscenarioPago) => void
}

const OPCIONES: { valor: EscenarioPago; etiqueta: string; ayuda: string }[] = [
  { valor: 'APROBAR', etiqueta: 'Aprobar', ayuda: 'El cobro se aprueba y la reserva queda confirmada (200).' },
  { valor: 'RECHAZAR', etiqueta: 'Rechazar', ayuda: 'El cobro falla, la reserva pasa a pago fallido y las fechas se liberan (402).' },
  { valor: 'DEMORAR', etiqueta: 'Demorar', ayuda: 'El procesador no responde en 10 s: resultado incierto (202).' },
  { valor: 'CAER', etiqueta: 'Caer', ayuda: 'El circuit breaker se abre: servicio no disponible (503).' },
]

// Selector de escenario
function SelectorEscenario({ valor, onCambiar }: SelectorEscenarioProps) {
  return (
    <fieldset className="selector-escenario">
      <legend className="selector-escenario__titulo">
        Escenario de prueba <span className="etiqueta-proximamente">Solo demostración</span>
      </legend>
      <div className="selector-escenario__opciones">
        {OPCIONES.map((opcion) => (
          <label key={opcion.valor} className="selector-escenario__opcion">
            <input
              type="radio"
              name="escenario-pago"
              value={opcion.valor}
              checked={valor === opcion.valor}
              onChange={() => onCambiar(opcion.valor)}
            />
            <span>
              <span className="selector-escenario__etiqueta">{opcion.etiqueta}</span>
              <span className="selector-escenario__ayuda">{opcion.ayuda}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export default SelectorEscenario
