// Mitad visual de las pantallas de acceso: la foto y el eslogan.
// La marca ya está en el encabezado; aquí solo habla el alojamiento.
function PanelMarca() {
  return (
    <aside className="panel-marca">
      <p className="panel-marca__eslogan">
        El alojamiento que deseas,{' '}
        <span className="panel-marca__destacado">a un clic de distancia.</span>
      </p>
    </aside>
  )
}

export default PanelMarca
