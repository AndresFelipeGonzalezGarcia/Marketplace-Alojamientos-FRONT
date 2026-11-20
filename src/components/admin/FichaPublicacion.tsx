import type { PoliticaCancelacion, Servicio } from '../../api/catalogos'
import type { Publicacion } from '../../api/publicaciones'
import type { EstadoCatalogo } from '../publicacion/useCatalogos'
import FotoRevision from './FotoRevision'
import SeccionFicha from './SeccionFicha'
import {
  etiquetaModoReserva,
  etiquetaTipo,
  formatearPrecio,
  textoCapacidad,
} from './formatoRevision'

interface FichaPublicacionProps {
  publicacion: Publicacion
  servicios: EstadoCatalogo<Servicio>
  politicas: EstadoCatalogo<PoliticaCancelacion>
}

function describirPolitica(politica: PoliticaCancelacion) {
  const { horasAntesLlegada: horas, porcentajeDevolucion: porcentaje } =
    politica
  if (horas === undefined || porcentaje === undefined) return null
  return `Devuelve el ${porcentaje} % si se cancela hasta ${horas} horas antes de la llegada.`
}

// Ficha de la publicación
function FichaPublicacion({
  publicacion,
  servicios,
  politicas,
}: FichaPublicacionProps) {
  const {
    titulo,
    descripcion,
    ciudad,
    ubicacionTextual,
    tipo,
    capacidad,
    precioNoche,
    tarifaLimpieza,
    modoReserva,
    reglas,
    serviciosIds,
    serviciosAdicionales,
    imagenes,
    politicaCancelacionId,
  } = publicacion

  const politica =
    politicas.fase === 'lista'
      ? politicas.items.find((item) => item.id === politicaCancelacionId)
      : undefined

  return (
    <div className="ficha">
      <SeccionFicha id="ficha-fotos" titulo={`Fotos (${imagenes.length})`}>
        {imagenes.length === 0 ? (
          <p className="ficha-sin-dato">El anfitrión no agregó fotos.</p>
        ) : (
          <ul className="ficha-fotos">
            {imagenes.map((url, indice) => (
              <li
                key={`${indice}-${url}`}
                className={indice === 0 ? 'ficha-fotos__item ficha-fotos__item--portada' : 'ficha-fotos__item'}
              >
                <FotoRevision
                  key={url}
                  url={url}
                  alt={`Foto ${indice + 1} de ${titulo}`}
                  textoSinFoto={`No se pudo cargar la foto ${indice + 1}.`}
                  className="ficha-fotos__foto"
                />
                {indice === 0 && <span className="ficha-fotos__portada">Portada</span>}
              </li>
            ))}
          </ul>
        )}
      </SeccionFicha>

      <SeccionFicha id="ficha-descripcion" titulo="Descripción">
        {descripcion.trim() ? (
          <p className="ficha-texto">{descripcion}</p>
        ) : (
          <p className="ficha-sin-dato">Sin descripción.</p>
        )}
      </SeccionFicha>

      <SeccionFicha id="ficha-datos" titulo="Alojamiento y precio">
        <dl className="ficha-datos">
          <div>
            <dt>Tipo</dt>
            <dd>{etiquetaTipo(tipo)}</dd>
          </div>
          <div>
            <dt>Capacidad</dt>
            <dd>{textoCapacidad(capacidad)}</dd>
          </div>
          <div>
            <dt>Precio por noche</dt>
            <dd>{formatearPrecio(precioNoche)}</dd>
          </div>
          <div>
            <dt>Tarifa de limpieza</dt>
            <dd>{formatearPrecio(tarifaLimpieza ?? 0)}</dd>
          </div>
          <div>
            <dt>Modo de reserva</dt>
            <dd>{etiquetaModoReserva(modoReserva)}</dd>
          </div>
        </dl>
      </SeccionFicha>

      <SeccionFicha id="ficha-ubicacion" titulo="Ubicación">
        <dl className="ficha-datos">
          <div>
            <dt>Ciudad</dt>
            <dd>{ciudad}</dd>
          </div>
          <div className="ficha-datos__ancho">
            <dt>Dirección o referencia</dt>
            <dd>{ubicacionTextual}</dd>
          </div>
        </dl>
      </SeccionFicha>

      <SeccionFicha id="ficha-servicios" titulo="Servicios">
        {serviciosIds.length === 0 ? (
          <p className="ficha-sin-dato">No marcó servicios.</p>
        ) : servicios.fase === 'cargando' ? (
          <p className="publicacion-cargando">Cargando servicios…</p>
        ) : servicios.fase === 'error' ? (
          <p className="ficha-sin-dato">
            Marcó {serviciosIds.length}{' '}
            {serviciosIds.length === 1 ? 'servicio' : 'servicios'}, pero no
            pudimos cargar sus nombres.
          </p>
        ) : (
          <ul className="chips">
            {serviciosIds.map((id) => (
              <li key={id} className="chip chip--activo">
                {servicios.items.find((item) => item.id === id)?.nombre ??
                  'Servicio desconocido'}
              </li>
            ))}
          </ul>
        )}
      </SeccionFicha>

      <SeccionFicha id="ficha-adicionales" titulo="Servicios adicionales">
        {serviciosAdicionales.length === 0 ? (
          <p className="ficha-sin-dato">No ofrece servicios adicionales con costo.</p>
        ) : (
          <ul className="ficha-adicionales">
            {serviciosAdicionales.map((servicio, indice) => (
              <li key={`${indice}-${servicio.nombre}`}>
                <span>{servicio.nombre}</span>
                <span className="ficha-adicionales__costo">
                  {formatearPrecio(servicio.costo)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </SeccionFicha>

      <SeccionFicha id="ficha-reglas" titulo="Reglas de la casa">
        {reglas?.trim() ? (
          <p className="ficha-texto">{reglas}</p>
        ) : (
          <p className="ficha-sin-dato">No indicó reglas.</p>
        )}
      </SeccionFicha>

      <SeccionFicha id="ficha-politica" titulo="Política de cancelación">
        {politicas.fase === 'cargando' ? (
          <p className="publicacion-cargando">Cargando política…</p>
        ) : politica ? (
          <>
            <p className="ficha-politica__nombre">{politica.nombre}</p>
            {describirPolitica(politica) && (
              <p className="ficha-texto">{describirPolitica(politica)}</p>
            )}
          </>
        ) : politicas.fase === 'error' ? (
          <p className="ficha-sin-dato">No pudimos cargar el nombre de la política elegida.</p>
        ) : (
          <p className="ficha-sin-dato">La política elegida ya no está en el catálogo.</p>
        )}
      </SeccionFicha>
    </div>
  )
}

export default FichaPublicacion
