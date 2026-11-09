interface Requisito {
  texto: string
  cumplido: boolean
}

interface PanelRevisionProps {
  requisitos: Requisito[]
  guardando: boolean
  guardado: boolean
}

function PanelRevision({ requisitos, guardando, guardado }: PanelRevisionProps) {
  return (
    <aside className="publicacion-tarjeta panel-revision">
      <h2 className="publicacion-tarjeta__titulo">
        Antes de enviar a revisión
      </h2>
      <ul className="panel-revision__lista">
        {requisitos.map(({ texto, cumplido }) => (
          <li key={texto} className="panel-revision__requisito">
            {cumplido ? (
              <span className="insignia insignia--ok">OK</span>
            ) : (
              <span className="insignia insignia--alerta">
                <span aria-hidden="true">!</span>
                <span className="solo-lector">Falta</span>
              </span>
            )}
            {texto}
          </li>
        ))}
        <li className="panel-revision__requisito panel-revision__requisito--inactivo">
          <span className="insignia insignia--vacia" aria-hidden="true" />
          Condiciones comerciales
        </li>
      </ul>
      <p className="panel-revision__nota">
        Al enviarla pasa a PENDIENTE_REVISION y un administrador la revisa.
      </p>
      <div className="panel-revision__acciones">
        <button className="boton-principal" type="button" disabled>
          Enviar a revisión
        </button>
        <button className="boton-secundario" type="submit" disabled={guardando}>
          {guardando ? 'Guardando…' : 'Guardar borrador'}
        </button>
      </div>
      {guardado && (
        <p className="panel-revision__exito" role="status">
          Borrador guardado
        </p>
      )}
    </aside>
  )
}

export default PanelRevision
