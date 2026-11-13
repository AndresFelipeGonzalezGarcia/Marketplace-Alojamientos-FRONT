interface Requisito {
  texto: string
  cumplido: boolean
}

export interface EstadoEnvio {
  // Solo una publicación en BORRADOR (o una nueva) se envía a revisión.
  disponible: boolean
  enviando: boolean
  // Si existe, explica por qué todavía no se puede enviar.
  impedimento?: string
}

interface PanelRevisionProps {
  requisitos: Requisito[]
  guardando: boolean
  guardado: boolean
  errorGeneral: string
  envio: EstadoEnvio
  onEnviar: () => void
}

const ID_IMPEDIMENTO = 'panel-revision-impedimento'

function PanelRevision({
  requisitos,
  guardando,
  guardado,
  errorGeneral,
  envio,
  onEnviar,
}: PanelRevisionProps) {
  const ocupado = guardando || envio.enviando

  return (
    <aside className="publicacion-tarjeta panel-revision">
      <h2 className="publicacion-tarjeta__titulo">
        {envio.disponible ? 'Antes de enviar a revisión' : 'Guardar cambios'}
      </h2>
      {envio.disponible && (
        <>
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
          </ul>
          <p className="panel-revision__nota">
            Al enviarla pasa a «En revisión» y un administrador la revisa.
            Mientras tanto no se puede editar.
          </p>
        </>
      )}
      <div className="panel-revision__acciones">
        {envio.disponible && (
          <button
            className="boton-principal"
            type="button"
            disabled={ocupado || Boolean(envio.impedimento)}
            aria-describedby={envio.impedimento ? ID_IMPEDIMENTO : undefined}
            onClick={onEnviar}
          >
            {envio.enviando ? 'Enviando…' : 'Enviar a revisión'}
          </button>
        )}
        <button className="boton-secundario" type="submit" disabled={ocupado}>
          {guardando ? 'Guardando…' : 'Guardar borrador'}
        </button>
      </div>
      {envio.disponible && envio.impedimento && (
        <p id={ID_IMPEDIMENTO} className="panel-revision__impedimento">
          {envio.impedimento}
        </p>
      )}
      {guardado && (
        <p className="panel-revision__exito" role="status">
          Borrador guardado
        </p>
      )}
      {errorGeneral && (
        <p className="publicacion-alerta" role="alert">
          {errorGeneral}
        </p>
      )}
    </aside>
  )
}

export default PanelRevision
