import './publicacion.css'

function EncabezadoAnfitrion() {
  return (
    <header className="publicacion-encabezado">
      <div className="publicacion-encabezado__marca">
        <span className="publicacion-encabezado__logo" aria-hidden="true">
          LR
        </span>
        <span className="publicacion-encabezado__nombre">Inversiones LR</span>
      </div>
      <ul className="publicacion-encabezado__menu">
        <li className="publicacion-encabezado__activo">Mis publicaciones</li>
        <li>Calendario</li>
        <li>Reservas recibidas</li>
      </ul>
    </header>
  )
}

export default EncabezadoAnfitrion
