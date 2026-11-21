import { act, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  buscarAlojamientos,
  listarServiciosPublicos,
  obtenerAlojamiento,
  obtenerCalendario,
  type AlojamientoDetalle,
} from '../../api/alojamientos'
import type { ResultadoApi } from '../../api/cliente'
import { errorDeConexion, interpretarRespuestaError } from '../../api/errores'
import { renderizarApp } from '../../test/renderizarApp'

vi.mock('../../api/alojamientos', async (importarOriginal) => ({
  ...(await importarOriginal<typeof import('../../api/alojamientos')>()),
  buscarAlojamientos: vi.fn(),
  listarServiciosPublicos: vi.fn(),
  obtenerAlojamiento: vi.fn(),
  obtenerCalendario: vi.fn(),
}))

const obtener = vi.mocked(obtenerAlojamiento)
const buscar = vi.mocked(buscarAlojamientos)
const servicios = vi.mocked(listarServiciosPublicos)

const ID = 'c1d2e3f4-0000-4000-8000-000000000209'

const ALOJAMIENTO: AlojamientoDetalle = {
  id: ID,
  titulo: 'Casa de playa con piscina',
  descripcion: 'Casa frente al mar para grupos grandes.',
  ciudad: 'Cartagena',
  ubicacionTextual: 'Avenida San Martín # 5-120, Bocagrande',
  tipo: 'CASA',
  capacidad: 10,
  precioNoche: 890000,
  tarifaLimpieza: 120000,
  reglas: 'No fumar.\nNo se permiten fiestas.',
  modoReserva: 'CON_APROBACION',
  anfitrionNombre: 'Carlos Mejía',
  servicios: [
    { id: 's1', nombre: 'Piscina' },
    { id: 's2', nombre: 'Wifi' },
  ],
  serviciosAdicionales: [{ nombre: 'Chef privado por día', costo: 250000 }],
  politicaCancelacion: {
    id: 'p1',
    nombre: 'Moderada',
    horasAntesLlegada: 120,
    porcentajeDevolucion: 50,
  },
  imagenes: ['http://fotos.prueba/1.jpg', 'http://fotos.prueba/2.jpg', 'http://fotos.prueba/3.jpg'],
}

const ok = (datos = ALOJAMIENTO): ResultadoApi<AlojamientoDetalle> => ({ estado: 'ok', datos })

async function noEncontrado(): Promise<ResultadoApi<AlojamientoDetalle>> {
  const respuesta = new Response(
    JSON.stringify({ codigo: 'ALOJAMIENTO_NO_ENCONTRADO', mensaje: 'No existe.' }),
    { status: 404 },
  )
  return { estado: 'error', error: await interpretarRespuestaError(respuesta) }
}

const titulo = () => screen.findByRole('heading', { level: 1, name: ALOJAMIENTO.titulo })
const galeria = () => within(screen.getByRole('region', { name: 'Fotos del alojamiento' }))

beforeEach(() => {
  obtener.mockReset()
  buscar.mockReset()
  servicios.mockReset()
  servicios.mockResolvedValue({ estado: 'ok', datos: [] })
  // Calendario
  vi.mocked(obtenerCalendario).mockResolvedValue({ estado: 'ok', datos: [] })
})

describe('Detalle del alojamiento', () => {
  describe('cargado', () => {
    it('muestra un esqueleto mientras llega y pide el alojamiento sin sesión', async () => {
      let responder: (r: ResultadoApi<AlojamientoDetalle>) => void = () => {}
      obtener.mockReturnValue(new Promise((resolver) => (responder = resolver)))
      renderizarApp(`/alojamientos/${ID}`)

      expect(screen.getByRole('status')).toHaveTextContent('Cargando el alojamiento')
      expect(obtener).toHaveBeenCalledWith(ID)

      await act(async () => responder(ok()))
      expect(await titulo()).toBeInTheDocument()
      expect(screen.queryByText('Cargando el alojamiento…')).not.toBeInTheDocument()
    })

    it('muestra toda la información del alojamiento', async () => {
      obtener.mockResolvedValue(ok())
      renderizarApp(`/alojamientos/${ID}`)
      await titulo()

      expect(screen.getByText('Casa en Cartagena')).toBeInTheDocument()
      expect(screen.getByText('Avenida San Martín # 5-120, Bocagrande')).toBeInTheDocument()
      expect(screen.getByText('Hasta 10 huéspedes')).toBeInTheDocument()
      expect(screen.getByText('Carlos Mejía')).toBeInTheDocument()
      expect(screen.getByText(ALOJAMIENTO.descripcion)).toBeInTheDocument()

      const incluidos = within(screen.getByRole('region', { name: 'Servicios incluidos' }))
      expect(incluidos.getAllByRole('listitem').map((li) => li.textContent)).toEqual([
        'Piscina',
        'Wifi',
      ])
      const adicionales = screen.getByRole('region', { name: 'Servicios adicionales' })
      expect(adicionales).toHaveTextContent('Chef privado por día')
      expect(adicionales).toHaveTextContent(/250\.000/)

      const reglas = within(screen.getByRole('region', { name: 'Reglas de la casa' }))
      expect(reglas.getAllByRole('listitem').map((li) => li.textContent)).toEqual([
        'No fumar.',
        'No se permiten fiestas.',
      ])
      const politica = screen.getByRole('region', { name: 'Política de cancelación' })
      expect(politica).toHaveTextContent('Moderada')
      expect(politica).toHaveTextContent(
        'Si cancelas con al menos 5 días de anticipación a la llegada, te devolvemos el 50 % de lo pagado.',
      )

      const panel = screen.getByRole('complementary', { name: 'Precio y reserva' })
      expect(panel).toHaveTextContent(/890\.000\s*\/ noche/)
      expect(panel).toHaveTextContent(/Limpieza: .*120\.000 por estadía/)
      expect(within(panel).getByRole('region', { name: 'Cotización' })).toBeInTheDocument()
      expect(screen.getByRole('region', { name: 'Disponibilidad' })).toBeInTheDocument()
    })

    it('la galería empieza en la portada y se recorre con botones, teclado y miniaturas', async () => {
      obtener.mockResolvedValue(ok())
      const { usuario } = renderizarApp(`/alojamientos/${ID}`)
      await titulo()

      const foto = () => galeria().getAllByRole('img')[0]
      expect(foto()).toHaveAttribute('src', 'http://fotos.prueba/1.jpg')
      expect(foto()).toHaveAccessibleName(`${ALOJAMIENTO.titulo}, portada`)
      expect(galeria().getByText('Portada')).toBeInTheDocument()

      await usuario.click(galeria().getByRole('button', { name: 'Foto siguiente' }))
      expect(foto()).toHaveAttribute('src', 'http://fotos.prueba/2.jpg')
      expect(galeria().getByText('Foto 2 de 3')).toBeInTheDocument()
      expect(galeria().queryByText('Portada')).not.toBeInTheDocument()

      await usuario.keyboard('{ArrowRight}')
      expect(foto()).toHaveAttribute('src', 'http://fotos.prueba/3.jpg')
      // Vuelta a la primera foto
      await usuario.click(galeria().getByRole('button', { name: 'Foto siguiente' }))
      expect(foto()).toHaveAttribute('src', 'http://fotos.prueba/1.jpg')
      await usuario.keyboard('{ArrowLeft}')
      expect(foto()).toHaveAttribute('src', 'http://fotos.prueba/3.jpg')

      const miniatura = galeria().getByRole('button', { name: 'Ver la foto 2' })
      await usuario.click(miniatura)
      expect(foto()).toHaveAttribute('src', 'http://fotos.prueba/2.jpg')
      expect(miniatura).toHaveAttribute('aria-current', 'true')
    })

    it('sin servicios adicionales ni fotos no deja huecos vacíos', async () => {
      obtener.mockResolvedValue(ok({ ...ALOJAMIENTO, serviciosAdicionales: [], imagenes: [] }))
      renderizarApp(`/alojamientos/${ID}`)
      await titulo()

      expect(screen.queryByRole('region', { name: 'Servicios adicionales' })).not.toBeInTheDocument()
      expect(screen.getByText('Este alojamiento todavía no tiene fotos.')).toBeInTheDocument()
    })
  })

  describe('errores', () => {
    it('ALOJAMIENTO_NO_ENCONTRADO explica que no está disponible y lleva a la búsqueda', async () => {
      obtener.mockResolvedValue(await noEncontrado())
      renderizarApp({
        pathname: `/alojamientos/${ID}`,
        state: { desde: '?ciudad=Cartagena&huespedes=4' },
      })

      expect(
        await screen.findByRole('heading', { name: 'Este alojamiento no está disponible' }),
      ).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Volver a la búsqueda' })).toHaveAttribute(
        'href',
        '/alojamientos?ciudad=Cartagena&huespedes=4',
      )
    })

    it('si la consulta se rechaza muestra el error de conexión y permite reintentar', async () => {
      obtener.mockRejectedValueOnce(new TypeError('Failed to fetch'))
      obtener.mockResolvedValueOnce(ok())
      const { usuario } = renderizarApp(`/alojamientos/${ID}`)

      const alerta = await screen.findByRole('alert')
      expect(alerta).toHaveTextContent('No pudimos cargar el alojamiento')
      expect(alerta).toHaveTextContent('No pudimos conectar con el servidor')
      await usuario.click(within(alerta).getByRole('button', { name: 'Reintentar' }))

      expect(await titulo()).toBeInTheDocument()
      expect(obtener).toHaveBeenCalledTimes(2)
    })

    it('un error de conexión ofrece reintentar', async () => {
      obtener.mockResolvedValueOnce({ estado: 'error', error: errorDeConexion() })
      obtener.mockResolvedValueOnce(ok())
      const { usuario } = renderizarApp(`/alojamientos/${ID}`)

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'No pudimos cargar el alojamiento',
      )
      await usuario.click(screen.getByRole('button', { name: 'Reintentar' }))

      expect(await titulo()).toBeInTheDocument()
      expect(obtener).toHaveBeenCalledTimes(2)
    })
  })

  describe('navegación de vuelta', () => {
    it('desde la búsqueda, «Volver a los resultados» regresa con los mismos filtros', async () => {
      const busqueda = '?ciudad=Cartagena&tipo=CASA&pagina=2'
      buscar.mockResolvedValue({
        estado: 'ok',
        datos: {
          contenido: [
            {
              id: ID,
              titulo: ALOJAMIENTO.titulo,
              ciudad: 'Cartagena',
              tipo: 'CASA',
              capacidad: 10,
              precioNoche: 890000,
              imagenPortada: null,
              modoReserva: 'CON_APROBACION',
            },
          ],
          pagina: 1,
          tamano: 12,
          total: 13,
          totalPaginas: 2,
        },
      })
      obtener.mockResolvedValue(ok())
      const { router, usuario } = renderizarApp(`/alojamientos${busqueda}`)

      await usuario.click(await screen.findByRole('link', { name: ALOJAMIENTO.titulo }))
      await titulo()
      expect(router.state.location.pathname).toBe(`/alojamientos/${ID}`)

      await usuario.click(screen.getByRole('link', { name: 'Volver a los resultados' }))
      await screen.findByRole('list', { name: 'Alojamientos encontrados' })
      expect(router.state.location.pathname).toBe('/alojamientos')
      expect(router.state.location.search).toBe(busqueda)
      expect(buscar.mock.lastCall?.[0]).toMatchObject({ ciudad: 'Cartagena', tipo: 'CASA', pagina: 1 })
    })

    it('si se entra directo, vuelve a la búsqueda sin filtros', async () => {
      obtener.mockResolvedValue(ok())
      renderizarApp(`/alojamientos/${ID}`)
      await titulo()

      expect(screen.getByRole('link', { name: 'Volver a los resultados' })).toHaveAttribute(
        'href',
        '/alojamientos',
      )
    })

    it('no acepta otra ruta en el estado de navegación', async () => {
      obtener.mockResolvedValue(ok())
      renderizarApp({ pathname: `/alojamientos/${ID}`, state: { desde: '//otro.sitio/admin' } })
      await titulo()

      expect(screen.getByRole('link', { name: 'Volver a los resultados' })).toHaveAttribute(
        'href',
        '/alojamientos',
      )
    })
  })
})
