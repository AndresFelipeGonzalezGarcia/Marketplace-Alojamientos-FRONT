const ELEMENTOS = [
  ['disponible', 'Disponible'],
  ['ocupado', 'No disponible'],
  ['noche', 'Noches de tu estadía'],
  ['salida', 'Día de salida (no se cuenta)'],
] as const

function LeyendaCalendario() {
  return (
    <ul className="leyenda-calendario" aria-label="Leyenda del calendario">
      {ELEMENTOS.map(([clase, texto]) => (
        <li key={clase}>
          <span
            className={`leyenda-calendario__muestra leyenda-calendario__muestra--${clase}`}
            aria-hidden="true"
          />
          {texto}
        </li>
      ))}
    </ul>
  )
}

export default LeyendaCalendario
