import { screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  obtenerAlojamiento,
  obtenerCalendario,
  type AlojamientoDetalle,
  type DiaCalendario,
} from '../../api/alojamientos'
import type { ResultadoApi } from '../../api/cliente'
import { cotizarEstadia, type Cotizacion } from '../../api/cotizaciones'
import { errorDeConexion, interpretarRespuestaError } from '../../api/errores'
import { renderizarApp } from '../../test/renderizarApp'
import { iniciarSesionDePrueba } from '../../test/sesion'
import { sumarDias } from './fechasCalendario'

vi.mock('../../api/alojamientos', async (importarOriginal) => ({
  ...(await importarOriginal<typeof import('../../api/alojamientos')>()),
  obtenerAlojamiento: vi.fn(),
  obtenerCalendario: vi.fn(),
}))
vi.mock('../../api/cotizaciones', () => ({ cotizarEstadia: vi.fn() }))

const detalle = vi.mocked(obtenerAlojamiento)
const calendario = vi.mocked(obtenerCalendario)
const cotizar = vi.mocked(cotizarEstadia)

const ID = 'c1d2e3f4-0000-4000-8000-000000000210'
const AHORA = new Date('2030-03-05T15:00:00Z')
const CON_FECHAS = `/alojamientos/${ID}?llegada=2030-04-10&salida=2030-04-14&huespedes=2`

const ALOJAMIENTO: AlojamientoDetalle = {
  id: ID,
  titulo: 'Cabaña en la Sierra',
  descripcion: 'Entre cafetales.',
  ciudad: 'Minca',
  ubicacionTextual: 'Vereda Pozo Azul',
  tipo: 'CABANA',
  capacidad: 4,
  precioNoche: 260000,
  tarifaLimpieza: 30000,
  modoReserva: 'INMEDIATA',
  anfitrionNombre: 'Sofía',
  imagenes: [],
}

// Importes que no salen de multiplicar lo de la publicación: si la pantalla
// calculara algo por su cuenta, no coincidirían.
const COTIZACION: Cotizacion = {
  noches: 4,
  precioNoche: 255000,
  subtotal: 1020000,
  tarifaLimpieza: 31000,
  tarifaServicio: 86700,
  porcentajeTarifaServicio: 8.5,
  total: 1137701,
  moneda: 'COP',
}

function conOcupados(...ocupados: string[]) {
  return async (_id: string, desde: string, hasta: string): Promise<ResultadoApi<DiaCalendario[]>> => {
    const dias: DiaCalendario[] = []
    for (let fecha = desde; fecha <= hasta; fecha = sumarDias(fecha, 1)) {
      dias.push({ fecha, disponible: !ocupados.includes(fecha) })
    }
    return { estado: 'ok', datos: dias }
  }
}

async function errorDelServidor(codigo: string, status: number): Promise<ResultadoApi<Cotizacion>> {
  const respuesta = new Response(JSON.stringify({ codigo, mensaje: 'Mensaje del servidor.' }), { status })
  return { estado: 'error', error: await interpretarRespuestaError(respuesta) }
}

const panel = () => within(screen.getByRole('complementary', { name: 'Precio y reserva' }))
const huespedes = () => within(panel().getByRole('group', { name: 'Huéspedes' }))

async function abrir(ruta: Parameters<typeof renderizarApp>[0] = CON_FECHAS) {
  const app = renderizarApp(ruta)
  await screen.findByRole('heading', { level: 1, name: ALOJAMIENTO.titulo })
  return app
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(AHORA)
  detalle.mockReset()
  calendario.mockReset()
  cotizar.mockReset()
  detalle.mockResolvedValue({ estado: 'ok', datos: ALOJAMIENTO })
  calendario.mockImplementation(conOcupados())
  cotizar.mockResolvedValue({ estado: 'ok', datos: COTIZACION })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('Cotización', () => {
  describe('desglose', () => {
    it('pide la cotización con las fechas y huéspedes y muestra el desglose tal como llega', async () => {
      iniciarSesionDePrueba('HUESPED')
      await abrir()

      const lista = await panel().findByLabelText('Desglose del precio')
      expect(cotizar).toHaveBeenCalledWith({
        alojamientoId: ID,
        fechaLlegada: '2030-04-10',
        fechaSalida: '2030-04-14',
        numeroHuespedes: 2,
      })

      const filas = within(lista)
        .getAllByRole('term')
        .map((dt) => [dt.textContent, dt.nextElementSibling?.textContent?.replace(/\s/g, ' ')])
      expect(filas).toEqual([
        ['Precio por noche', '$ 255.000'],
        ['Noches', '4'],
        ['Subtotal', '$ 1.020.000'],
        ['Tarifa de limpieza', '$ 31.000'],
        ['Tarifa de servicio (8,5 %)', '$ 86.700'],
        ['Total', '$ 1.137.701'],
      ])
      expect(panel().getByRole('button', { name: 'Reservar' })).toBeDisabled()
    })

    it('mientras calcula lo anuncia, y al cambiar los huéspedes vuelve a cotizar', async () => {
      iniciarSesionDePrueba('HUESPED')
      let responder: (r: ResultadoApi<Cotizacion>) => void = () => {}
      cotizar.mockReturnValueOnce(new Promise((resolver) => (responder = resolver)))
      const { router, usuario } = await abrir()

      expect(await screen.findByText('Calculando el total…')).toBeInTheDocument()
      responder({ estado: 'ok', datos: COTIZACION })
      await screen.findByLabelText('Desglose del precio')

      await usuario.click(huespedes().getByRole('button', { name: 'Agregar un huésped' }))
      expect(new URLSearchParams(router.state.location.search).get('huespedes')).toBe('3')
      await vi.waitFor(() =>
        expect(cotizar).toHaveBeenLastCalledWith(expect.objectContaining({ numeroHuespedes: 3 })),
      )
      expect(huespedes().getByText('3 huéspedes')).toBeInTheDocument()
    })

    it('el selector no pasa de la capacidad ni baja de uno', async () => {
      iniciarSesionDePrueba('HUESPED')
      const { usuario } = await abrir(`/alojamientos/${ID}?llegada=2030-04-10&salida=2030-04-14&huespedes=4`)

      expect(huespedes().getByRole('button', { name: 'Agregar un huésped' })).toBeDisabled()
      for (let i = 0; i < 3; i++) {
        await usuario.click(huespedes().getByRole('button', { name: 'Quitar un huésped' }))
      }
      expect(huespedes().getByText('1 huésped')).toBeInTheDocument()
      expect(huespedes().getByRole('button', { name: 'Quitar un huésped' })).toBeDisabled()
    })

    it('sin fechas no pide nada e invita a elegirlas', async () => {
      iniciarSesionDePrueba('HUESPED')
      await abrir(`/alojamientos/${ID}`)

      expect(panel().getByText('Elige tus fechas en el calendario de disponibilidad.')).toBeInTheDocument()
      expect(cotizar).not.toHaveBeenCalled()
      expect(panel().getByRole('button', { name: 'Reservar' })).toBeDisabled()
    })

    it('al elegir fechas en el calendario cotiza con un huésped si no se indicó otro', async () => {
      iniciarSesionDePrueba('HUESPED')
      const { usuario } = await abrir(`/alojamientos/${ID}`)
      await vi.waitFor(() => expect(screen.queryByText('Cargando disponibilidad…')).not.toBeInTheDocument())

      await usuario.click(document.querySelector('[data-fecha="2030-04-20"]') as HTMLElement)
      await usuario.click(document.querySelector('[data-fecha="2030-04-22"]') as HTMLElement)

      await vi.waitFor(() =>
        expect(cotizar).toHaveBeenCalledWith({
          alojamientoId: ID,
          fechaLlegada: '2030-04-20',
          fechaSalida: '2030-04-22',
          numeroHuespedes: 1,
        }),
      )
    })
  })

  describe('errores', () => {
    it('409 PERIODO_NO_DISPONIBLE invita a elegir otras fechas y recarga el calendario', async () => {
      iniciarSesionDePrueba('HUESPED')
      cotizar.mockResolvedValue(await errorDelServidor('PERIODO_NO_DISPONIBLE', 409))
      const { router } = await abrir()
      await vi.waitFor(() => expect(calendario).toHaveBeenCalledTimes(1))
      // Lo que el calendario ve al recargar: la noche del 12 ya está ocupada.
      calendario.mockImplementation(conOcupados('2030-04-12'))

      const aviso = await panel().findByRole('alert')
      expect(aviso).toHaveTextContent('Estas fechas ya no están libres')
      expect(within(aviso).getByRole('button', { name: 'Elegir otras fechas' })).toBeInTheDocument()
      expect(panel().queryByLabelText('Desglose del precio')).not.toBeInTheDocument()

      // El calendario vuelve a pedir la disponibilidad y quita las fechas ocupadas.
      await vi.waitFor(() => expect(calendario).toHaveBeenCalledTimes(2))
      await vi.waitFor(() => expect(new URLSearchParams(router.state.location.search).get('llegada')).toBeNull())
      // El aviso sigue a la vista aunque ya no haya fechas elegidas.
      expect(panel().getByRole('alert')).toHaveTextContent('Estas fechas ya no están libres')
    })

    it('422 CAPACIDAD_EXCEDIDA se muestra junto al selector de huéspedes', async () => {
      iniciarSesionDePrueba('HUESPED')
      cotizar.mockResolvedValue(await errorDelServidor('CAPACIDAD_EXCEDIDA', 422))
      await abrir(`/alojamientos/${ID}?llegada=2030-04-10&salida=2030-04-14&huespedes=6`)

      const grupo = panel().getByRole('group', { name: 'Huéspedes' })
      await vi.waitFor(() =>
        expect(grupo).toHaveAccessibleDescription(/admite hasta 4 huéspedes/),
      )
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Este alojamiento admite hasta 4 huéspedes. Quita huéspedes para cotizar.',
      )
      expect(panel().queryByLabelText('Desglose del precio')).not.toBeInTheDocument()
    })

    it('400 FECHAS_INVALIDAS se muestra junto a las fechas', async () => {
      iniciarSesionDePrueba('HUESPED')
      cotizar.mockResolvedValue(await errorDelServidor('FECHAS_INVALIDAS', 400))
      await abrir()

      const alerta = await panel().findByRole('alert')
      expect(alerta).toHaveTextContent('La fecha final no puede ser anterior a la inicial.')
      // Va dentro del bloque de fechas, no en el del selector ni en el desglose.
      expect(alerta.closest('.cotizacion__fechas')).not.toBeNull()
      expect(panel().getByRole('group', { name: 'Huéspedes' })).not.toHaveAccessibleDescription(/fecha/)
    })

    it('un error de conexión ofrece reintentar', async () => {
      iniciarSesionDePrueba('HUESPED')
      cotizar.mockResolvedValueOnce({ estado: 'error', error: errorDeConexion() })
      const { usuario } = await abrir()

      const alerta = await panel().findByRole('alert')
      expect(alerta).toHaveTextContent('No pudimos calcular el total')
      await usuario.click(within(alerta).getByRole('button', { name: 'Reintentar' }))

      expect(await panel().findByLabelText('Desglose del precio')).toBeInTheDocument()
      expect(cotizar).toHaveBeenCalledTimes(2)
    })
  })

  describe('sin sesión de huésped', () => {
    it('sin sesión muestra el precio por noche e invita a iniciar sesión volviendo aquí', async () => {
      const { router, usuario } = await abrir()

      expect(panel().getByText('$ 260.000', { normalizer: (t) => t.replace(/\s/g, ' ') })).toBeInTheDocument()
      expect(panel().getByText(/4 noches/)).toBeInTheDocument()
      expect(cotizar).not.toHaveBeenCalled()
      expect(panel().queryByRole('group', { name: 'Huéspedes' })).not.toBeInTheDocument()

      await usuario.click(panel().getByRole('link', { name: 'Iniciar sesión para cotizar' }))
      expect(router.state.location.pathname).toBe('/login')
      expect(router.state.location.state).toEqual({ desde: CON_FECHAS })
    })

    it('al volver del login con sesión de huésped cotiza las mismas fechas', async () => {
      const { router, usuario } = await abrir()
      await usuario.click(panel().getByRole('link', { name: 'Iniciar sesión para cotizar' }))
      await screen.findByRole('heading', { name: 'Iniciar sesión' })

      iniciarSesionDePrueba('HUESPED')
      await vi.waitFor(() => expect(router.state.location.pathname).toBe(`/alojamientos/${ID}`))
      expect(router.state.location.search).toBe('?llegada=2030-04-10&salida=2030-04-14&huespedes=2')
      await vi.waitFor(() => expect(cotizar).toHaveBeenCalledTimes(1))
    })

    it.each([
      ['ANFITRION', 'Anfitrión'],
      ['ADMINISTRADOR', 'Administrador'],
    ] as const)('como %s explica que necesita una cuenta de huésped', async (rol, etiqueta) => {
      iniciarSesionDePrueba(rol)
      await abrir()

      const nota = panel().getByRole('note')
      expect(nota).toHaveTextContent('Necesitas una cuenta de huésped')
      expect(nota).toHaveTextContent(`Entraste como ${etiqueta}`)
      expect(cotizar).not.toHaveBeenCalled()
      expect(panel().queryByRole('link', { name: 'Iniciar sesión para cotizar' })).not.toBeInTheDocument()
    })
  })
})
