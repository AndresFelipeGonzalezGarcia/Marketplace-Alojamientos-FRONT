import fotoInicio from '../../img/inicio.jpg'
import fotoAdministrador from '../../img/portada-administrador.jpg'
import fotoAnfitrion from '../../img/portada-anfitrion.jpg'
import fotoHuesped from '../../img/portada-huesped.jpg'
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

interface Portada {
  src: string
  alt: string
  // Qué parte de la foto se conserva al recortarla a lo ancho.
  encuadre: string
}

const PORTADAS: Record<RolUsuario | 'INVITADO', Portada> = {
  INVITADO: {
    src: fotoInicio,
    alt: 'Cabaña de madera con techo alto junto a una piscina',
    encuadre: '30% center',
  },
  HUESPED: {
    src: fotoHuesped,
    alt: 'Piscina de un hotel entre palmeras al atardecer',
    encuadre: 'center 60%',
  },
  ANFITRION: {
    src: fotoAnfitrion,
    alt: 'Terraza con mesa y sillas frente a cabañas de techo de paja en el desierto',
    encuadre: 'center 55%',
  },
  ADMINISTRADOR: {
    src: fotoAdministrador,
    alt: 'Campamento de cabañas de paja junto a un lago',
    encuadre: 'center 55%',
  },
}

function HomePage() {
  const usuario = useSesion()?.usuario ?? null
  const clave = usuario?.rol ?? 'INVITADO'
  const accesos = ACCESOS[clave]
  const primerDisponible = accesos.find((destino) => destino.disponible)
  const portada = PORTADAS[clave]

  return (
    <main className="inicio">
      {/* La foto es el contenido principal: ocupa todo el ancho. */}
      <section className="inicio__portada">
        <img
          className="inicio__foto"
          src={portada.src}
          alt={portada.alt}
          style={{ objectPosition: portada.encuadre }}
          fetchPriority="high"
        />
        <div className="inicio__portada-texto">
          <h1 className="inicio__titulo">
            {usuario
              ? `Hola, ${usuario.nombre}`
              : 'Marketplace de Alojamientos'}
          </h1>
          <p className="inicio__introduccion">{INTRODUCCION[clave]}</p>
        </div>
      </section>

      <div className="inicio__contenido">
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
      </div>
    </main>
  )
}

export default HomePage
