import FormularioRegistro from '../components/registro/FormularioRegistro'

function RegistroPage() {
  return (
    <main className="registro-pagina">
      <div className="registro-pagina__contenido">
        <FormularioRegistro />
      </div>
      <aside className="registro-portada">
        <p className="registro-portada__eslogan">
          El alojamiento que deseas,{' '}
          <span className="registro-portada__destacado">
            a un clic de distancia.
          </span>
        </p>
      </aside>
    </main>
  )
}

export default RegistroPage
