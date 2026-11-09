import BloqueCatalogo from './BloqueCatalogo'
import CampoFormulario from './CampoFormulario'
import CasillasServicios from './CasillasServicios'
import OpcionModoReserva from './OpcionModoReserva'
import ServiciosAdicionales from './ServiciosAdicionales'
import { useCatalogos } from './useCatalogos'
import type { ErroresFormulario, ValoresPublicacion } from './validacion'

interface SeccionCondicionesProps {
  valores: ValoresPublicacion
  errores: ErroresFormulario
  onCambiar: <C extends keyof ValoresPublicacion>(
    campo: C,
    valor: ValoresPublicacion[C],
  ) => void
}

function SeccionCondiciones({
  valores,
  errores,
  onCambiar,
}: SeccionCondicionesProps) {
  const { politicas, servicios, reintentar } = useCatalogos()

  return (
    <section
      className="publicacion-tarjeta"
      aria-labelledby="publicacion-seccion-2"
    >
      <h2 id="publicacion-seccion-2" className="publicacion-tarjeta__titulo">
        2. Condiciones comerciales
      </h2>
      <div className="publicacion-campos">
        <div className="publicacion-fila publicacion-fila--2">
          <CampoFormulario
            id="publicacion-precioNoche"
            etiqueta="Precio por noche (COP)"
            control="numero"
            valor={valores.precioNoche}
            error={errores.precioNoche}
            onCambio={(valor) => onCambiar('precioNoche', valor)}
          />
          <CampoFormulario
            id="publicacion-tarifaLimpieza"
            etiqueta="Tarifa de limpieza (COP, opcional)"
            control="numero"
            valor={valores.tarifaLimpieza}
            error={errores.tarifaLimpieza}
            onCambio={(valor) => onCambiar('tarifaLimpieza', valor)}
          />
        </div>

        <BloqueCatalogo
          etiqueta="Política de cancelación"
          estado={politicas}
          textoVacio="No hay políticas de cancelación disponibles."
          errorCampo={errores.politicaCancelacionId}
          onReintentar={reintentar}
        >
          {(items) => (
            <CampoFormulario
              id="publicacion-politicaCancelacionId"
              etiqueta="Política de cancelación"
              control="lista"
              opciones={items.map(({ id, nombre }) => ({
                valor: id,
                etiqueta: nombre,
              }))}
              valor={valores.politicaCancelacionId}
              error={errores.politicaCancelacionId}
              onCambio={(valor) => onCambiar('politicaCancelacionId', valor)}
            />
          )}
        </BloqueCatalogo>

        <fieldset className="grupo-opciones">
          <legend className="campo__etiqueta">Modo de reserva</legend>
          <div className="publicacion-fila publicacion-fila--2">
            <OpcionModoReserva
              id="publicacion-modoReserva"
              modo="INMEDIATA"
              titulo="Reserva inmediata"
              descripcion="Se confirma al aprobarse el pago"
              seleccionada={valores.modoReserva === 'INMEDIATA'}
              onSeleccionar={(modo) => onCambiar('modoReserva', modo)}
            />
            <OpcionModoReserva
              modo="CON_APROBACION"
              titulo="Con aprobación"
              descripcion="Tú apruebas o rechazas cada reserva"
              seleccionada={valores.modoReserva === 'CON_APROBACION'}
              onSeleccionar={(modo) => onCambiar('modoReserva', modo)}
            />
          </div>
          {errores.modoReserva && (
            <p className="campo__error">{errores.modoReserva}</p>
          )}
        </fieldset>

        <BloqueCatalogo
          etiqueta="Servicios incluidos (opcional)"
          estado={servicios}
          textoVacio="No hay servicios disponibles."
          errorCampo={errores.serviciosIds}
          onReintentar={reintentar}
        >
          {(items) => (
            <CasillasServicios
              servicios={items}
              seleccionados={valores.serviciosIds}
              error={errores.serviciosIds}
              onCambiar={(ids) => onCambiar('serviciosIds', ids)}
            />
          )}
        </BloqueCatalogo>

        <CampoFormulario
          id="publicacion-reglas"
          etiqueta="Reglas de la casa (opcional)"
          control="area"
          valor={valores.reglas}
          error={errores.reglas}
          onCambio={(valor) => onCambiar('reglas', valor)}
        />

        <ServiciosAdicionales
          filas={valores.serviciosAdicionales}
          errores={errores}
          onCambiar={(filas) => onCambiar('serviciosAdicionales', filas)}
        />
      </div>
    </section>
  )
}

export default SeccionCondiciones
