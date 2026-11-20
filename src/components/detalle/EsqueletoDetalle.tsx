// Esqueleto del detalle
function EsqueletoDetalle() {
  return (
    <div className="detalle-esqueleto">
      <p className="solo-lector" role="status">
        Cargando el alojamiento…
      </p>
      <div aria-hidden="true">
        <div className="galeria__escenario esqueleto" />
        <div className="detalle__cuerpo">
          <div className="detalle-esqueleto__lineas">
            <span className="esqueleto esqueleto--linea esqueleto--corta" />
            <span className="esqueleto esqueleto--linea detalle-esqueleto__titulo" />
            <span className="esqueleto esqueleto--linea esqueleto--media" />
            <span className="esqueleto esqueleto--linea" />
            <span className="esqueleto esqueleto--linea" />
            <span className="esqueleto esqueleto--linea esqueleto--media" />
          </div>
          <div className="panel-reserva detalle-esqueleto__panel">
            <span className="esqueleto esqueleto--linea esqueleto--media" />
            <span className="esqueleto esqueleto--linea esqueleto--corta" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default EsqueletoDetalle
