// Silueta de una tarjeta mientras llegan los resultados. Es decorativa:
// el estado de carga se anuncia aparte con texto.
function EsqueletoTarjeta() {
  return (
    <li
      className="tarjeta-alojamiento tarjeta-alojamiento--esqueleto"
      aria-hidden="true"
    >
      <div className="tarjeta-alojamiento__foto esqueleto" />
      <div className="tarjeta-alojamiento__cuerpo">
        <span className="esqueleto esqueleto--linea esqueleto--corta" />
        <span className="esqueleto esqueleto--linea esqueleto--titulo" />
        <span className="esqueleto esqueleto--linea esqueleto--media" />
        <span className="esqueleto esqueleto--linea esqueleto--corta" />
      </div>
    </li>
  )
}

export default EsqueletoTarjeta
