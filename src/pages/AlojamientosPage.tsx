import BusquedaAlojamientos from '../components/busqueda/BusquedaAlojamientos'

// Búsqueda pública: funciona con o sin sesión.
function AlojamientosPage() {
  return (
    <main className="busqueda-pagina">
      <BusquedaAlojamientos />
    </main>
  )
}

export default AlojamientosPage
