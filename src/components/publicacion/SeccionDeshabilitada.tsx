function SeccionDeshabilitada() {
  return (
    <section
      className="publicacion-tarjeta"
      aria-labelledby="publicacion-seccion-2"
    >
      <h2 id="publicacion-seccion-2" className="publicacion-tarjeta__titulo">
        2. Condiciones comerciales
      </h2>
      <fieldset className="publicacion-deshabilitada" disabled>
        <div className="publicacion-fila publicacion-fila--2">
          <div className="campo">
            <label className="campo__etiqueta" htmlFor="publicacion-politica">
              Política de cancelación
            </label>
            <input
              id="publicacion-politica"
              className="campo__control"
              type="text"
              defaultValue="Flexible · 100 % hasta 48 h antes"
            />
          </div>
          <div className="campo">
            <label className="campo__etiqueta" htmlFor="publicacion-limpieza">
              Tarifa de limpieza (COP)
            </label>
            <input
              id="publicacion-limpieza"
              className="campo__control"
              type="text"
            />
          </div>
        </div>

        <div className="campo">
          <span className="campo__etiqueta">Modo de aceptación</span>
          <div className="publicacion-fila publicacion-fila--2">
            <label className="opcion-deshabilitada">
              <input type="radio" name="modo-aceptacion" />
              <span>
                <span className="opcion-deshabilitada__titulo">
                  Reserva inmediata
                </span>
                <span className="opcion-deshabilitada__descripcion">
                  Se confirma al aprobarse el pago
                </span>
              </span>
            </label>
            <label className="opcion-deshabilitada">
              <input type="radio" name="modo-aceptacion" />
              <span>
                <span className="opcion-deshabilitada__titulo">
                  Con aprobación
                </span>
                <span className="opcion-deshabilitada__descripcion">
                  Tú apruebas o rechazas cada reserva
                </span>
              </span>
            </label>
          </div>
        </div>

        <div className="campo">
          <span className="campo__etiqueta">Servicios adicionales con costo</span>
          <div className="servicios-costo">
            <div className="servicios-costo__fila">
              <span>Desayuno por noche</span>
              <span>[VALOR] COP</span>
            </div>
            <div className="servicios-costo__fila">
              <span>Traslado desde el aeropuerto</span>
              <span>[VALOR] COP</span>
            </div>
          </div>
        </div>
      </fieldset>
    </section>
  )
}

export default SeccionDeshabilitada
