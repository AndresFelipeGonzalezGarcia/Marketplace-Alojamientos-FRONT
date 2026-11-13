import { ETIQUETA_ROL } from '../auth/roles'
import type { RolUsuario } from '../auth/sesion'
import { useSesion } from '../auth/useSesion'
import TarjetaAcceso from '../components/inicio/TarjetaAcceso'
import {
  CREAR_CUENTA,
  INICIAR_SESION,
  MIS_PUBLICACIONES,
  NUEVA_PUBLICACION,
  PUBLICACIONES_PENDIENTES,
  type Destino,
} from '../components/navegacion/destinos'
import '../components/inicio/inicio.css'

const ACCESOS: Record<RolUsuario | 'INVITADO', Destino[]> = {
  INVITADO: [CREAR_CUENTA, INICIAR_SESION],
  ANFITRION: [NUEVA_PUBLICACION, MIS_PUBLICACIONES],
  ADMINISTRADOR: [PUBLICACIONES_PENDIENTES],
  HUESPED: [],
}

const INTRODUCCION: Record<RolUsuario | 'INVITADO', string> = {
  INVITADO:
    'El alojamiento que deseas, a un clic de distancia. Crea tu cuenta para reservar o publicar.',
  ANFITRION: 'Desde aquí gestionas tus alojamientos y su disponibilidad.',
  ADMINISTRADOR: 'Desde aquí revisas lo que se publica en el marketplace.',
  HUESPED: 'Qué bueno tenerte aquí.',
}

function HomePage() {
  const usuario = useSesion()?.usuario ?? null
  const clave = usuario?.rol ?? 'INVITADO'
  const accesos = ACCESOS[clave]
  const primerDisponible = accesos.find((destino) => destino.disponible)

  return (
    <main className="inicio">
      <section className="inicio__portada">
        {usuario && (
          <p className="inicio__rol">Cuenta de {ETIQUETA_ROL[usuario.rol]}</p>
        )}
        <h1 className="inicio__titulo">
          {usuario ? `Hola, ${usuario.nombre}` : 'Marketplace de Alojamientos'}
        </h1>
        <p className="inicio__introduccion">{INTRODUCCION[clave]}</p>
      </section>

      {accesos.length > 0 ? (
        <ul className="inicio__accesos" aria-label="Accesos rápidos">
          {accesos.map((destino) => (
            <TarjetaAcceso
              key={destino.ruta}
              destino={destino}
              destacada={destino === primerDisponible}
            />
          ))}
        </ul>
      ) : (
        <section className="inicio__vacio">
          <h2 className="tarjeta-acceso__titulo">
            Muy pronto podrás buscar alojamientos
          </h2>
          <p className="tarjeta-acceso__texto">
            Estamos preparando la búsqueda y las reservas. Cuando estén listas
            las verás aquí.
          </p>
        </section>
      )}

      {usuario?.rol === 'ANFITRION' && (
        <p className="inicio__nota">
          Para editar una publicación o gestionar sus fechas disponibles,
          ábrela desde Mis publicaciones.
        </p>
      )}
    </main>
  )
}

export default HomePage
