interface MarcadorPendienteProps {
  titulo: string
  mensaje: string
}

// Hueco reservado para una historia siguiente: dice qué irá ahí.
function MarcadorPendiente({ titulo, mensaje }: MarcadorPendienteProps) {
  return (
    <div className="marcador-pendiente">
      <span className="etiqueta-proximamente">Próximamente</span>
      <p className="marcador-pendiente__titulo">{titulo}</p>
      <p className="marcador-pendiente__texto">{mensaje}</p>
    </div>
  )
}

export default MarcadorPendiente
