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
import { crearReserva, obtenerReserva, type Reserva } from '../../api/reservas'
import { renderizarApp } from '../../test/renderizarApp'
import { iniciarSesionDePrueba } from '../../test/sesion'
import { sumarDias } from './fechasCalendario'

vi.mock('../../api/alojamientos', async (importarOriginal) => ({
  ...(await importarOriginal<typeof import('../../api/alojamientos')>()),
  obtenerAlojamiento: vi.fn(),
  obtenerCalendario: vi.fn(),
}))
vi.mock('../../api/cotizaciones', () => ({ cotizarEstadia: vi.fn() }))
vi.mock('../../api/reservas', async (importarOriginal) => ({
  ...(await importarOriginal<typeof import('../../api/reservas')>()),
  crearReserva: vi.fn(),
  obtenerReserva: vi.fn(),
}))

const detalle = vi.mocked(obtenerAlojamiento)
const calendario = vi.mocked(obtenerCalendario)
const cotizar = vi.mocked(cotizarEstadia)
const reservar = vi.mocked(crearReserva)
const verReserva = vi.mocked(obtenerReserva)

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

function reservaCreada(cambios: Partial<Reserva> = {}): Reserva {
  return {
    id: 'r-nueva',
    alojamientoId: ID,
    alojamientoTitulo: ALOJAMIENTO.titulo,
    alojamientoCiudad: ALOJAMIENTO.ciudad,
    imagenPortada: null,
    fechaLlegada: '2030-04-10',
    fechaSalida: '2030-04-14',
    numeroHuespedes: 2,
    estado: 'PENDIENTE_PAGO',
    cotizacion: COTIZACION,
    creadaEn: '2030-03-05T15:00:00Z',
    ...cambios,
  }
}

const libres = async (_id: string, desde: string, hasta: string): Promise<ResultadoApi<DiaCalendario[]>> => {
  const dias: DiaCalendario[] = []
  for (let fecha = desde; fecha <= hasta; fecha = sumarDias(fecha, 1)) {
    dias.push({ fecha, disponible: true })
  }
  return { estado: 'ok', datos: dias }
}

async function errorDelServidor(codigo: string, status: number) {
  const respuesta = new Response(JSON.stringify({ codigo, mensaje: 'Mensaje del servidor.' }), { status })
  return { estado: 'error' as const, error: await interpretarRespuestaError(respuesta) }
}

const panel = () => within(screen.getByRole('complementary', { name: 'Precio y reserva' }))
const dialogo = () => screen.getByRole('dialog')
const claves = () => reservar.mock.calls.map(([, clave]) => clave)

// Abre el detalle con la cotización lista y pulsa «Reservar».
async function abrirConfirmacion(ruta = CON_FECHAS, boton = 'Reservar') {
  const app = renderizarApp(ruta)
  await screen.findByRole('heading', { level: 1, name: ALOJAMIENTO.titulo })
  await panel().findByLabelText('Desglose del precio')
  await app.usuario.click(panel().getByRole('button', { name: boton }))
  return app
}

let siguienteClave = 0

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(AHORA)
  iniciarSesionDePrueba('HUESPED')
  for (const simulado of [detalle, calendario, cotizar, reservar, verReserva]) simulado.mockReset()
  detalle.mockResolvedValue({ estado: 'ok', datos: ALOJAMIENTO })
  calendario.mockImplementation(libres)
  cotizar.mockResolvedValue({ estado: 'ok', datos: COTIZACION })
  reservar.mockResolvedValue({ estado: 'ok', datos: reservaCreada() })
  verReserva.mockResolvedValue({ estado: 'ok', datos: reservaCreada() })
  siguienteClave = 0
  vi.spyOn(crypto, 'randomUUID').mockImplementation(
    () => `00000000-0000-4000-8000-00000000000${++siguienteClave}` as `${string}-${string}-${string}-${string}-${string}`,
  )
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('Reservar', () => {
  describe('confirmación', () => {
    it('antes de enviar muestra alojamiento, fechas, noches, huéspedes y total', async () => {
      await abrirConfirmacion()

      const resumen = within(dialogo())
      expect(dialogo()).toHaveAccessibleName('Confirma tu reserva')
      const filas = resumen
        .getAllByRole('term')
        .map((dt) => [dt.textContent, dt.nextElementSibling?.textContent?.replace(/\s/g, ' ')])
      expect(filas).toEqual([
        ['Alojamiento', 'Cabaña en la Sierra'],
        ['Fechas', expect.stringMatching(/^Del .*10.* al .*14/)],
        ['Noches', '4 noches'],
        ['Huéspedes', '2 huéspedes'],
        ['Total', '$ 1.137.701'],
      ])
      // Abrir la confirmación no reserva nada.
      expect(reservar).not.toHaveBeenCalled()
    })

    it('«Volver» la cierra sin enviar nada', async () => {
      const { usuario } = await abrirConfirmacion()
      await usuario.click(within(dialogo()).getByRole('button', { name: 'Volver' }))

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(reservar).not.toHaveBeenCalled()
    })

    it('sin cotización lista no deja reservar', async () => {
      cotizar.mockReturnValue(new Promise(() => {}))
      renderizarApp(CON_FECHAS)
      await screen.findByRole('heading', { level: 1, name: ALOJAMIENTO.titulo })

      expect(panel().getByRole('button', { name: 'Reservar' })).toBeDisabled()
    })
  })

  describe('reserva correcta', () => {
    it('INMEDIATA: queda pendiente de pago y la pantalla de la reserva lleva al pago', async () => {
      const { usuario, router } = await abrirConfirmacion()
      await usuario.click(within(dialogo()).getByRole('button', { name: 'Confirmar y reservar' }))

      expect(reservar).toHaveBeenCalledWith(
        { alojamientoId: ID, fechaLlegada: '2030-04-10', fechaSalida: '2030-04-14', numeroHuespedes: 2 },
        '00000000-0000-4000-8000-000000000001',
      )
      expect(await screen.findByRole('heading', { name: '¡Tu reserva está creada!' })).toHaveFocus()
      expect(router.state.location.pathname).toBe('/reservas/r-nueva')
      expect(verReserva).toHaveBeenCalledWith('r-nueva')
      expect(screen.getByText('Pendiente de pago')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Pagar ahora' })).toHaveAttribute('href', '/reservas/r-nueva/pago')
    })

    it('CON_APROBACION: queda esperando al anfitrión y se explica que debe aceptarla antes de pagar', async () => {
      detalle.mockResolvedValue({ estado: 'ok', datos: { ...ALOJAMIENTO, modoReserva: 'CON_APROBACION' } })
      reservar.mockResolvedValue({ estado: 'ok', datos: reservaCreada({ estado: 'PENDIENTE_APROBACION' }) })
      verReserva.mockResolvedValue({ estado: 'ok', datos: reservaCreada({ estado: 'PENDIENTE_APROBACION' }) })
      const { usuario } = await abrirConfirmacion(CON_FECHAS, 'Solicitar reserva')

      expect(dialogo()).toHaveAccessibleName('Confirma tu solicitud')
      expect(dialogo()).toHaveTextContent('El anfitrión debe aceptar tu solicitud antes de que puedas pagar.')
      await usuario.click(within(dialogo()).getByRole('button', { name: 'Enviar solicitud' }))

      expect(await screen.findByRole('heading', { name: 'Solicitud enviada al anfitrión' })).toHaveFocus()
      expect(screen.getByText('Esperando al anfitrión')).toBeInTheDocument()
      expect(screen.getByText(/debe aceptar tu solicitud antes de que puedas pagar/)).toBeInTheDocument()
      expect(screen.queryByRole('link', { name: 'Pagar ahora' })).not.toBeInTheDocument()
    })

    it('un 200 (la reserva ya existía con esa clave) se trata como éxito', async () => {
      const { crearReserva: real } = await vi.importActual<typeof import('../../api/reservas')>('../../api/reservas')
      const fetchSimulado = vi.fn<typeof fetch>().mockResolvedValue(
        new Response(JSON.stringify(reservaCreada({ id: 'r-existente' })), { status: 200 }),
      )
      vi.stubGlobal('fetch', fetchSimulado)
      vi.stubEnv('VITE_API_URL', 'http://api.prueba')
      reservar.mockImplementation(real)
      try {
        const { usuario, router } = await abrirConfirmacion()
        await usuario.click(within(dialogo()).getByRole('button', { name: 'Confirmar y reservar' }))

        await vi.waitFor(() => expect(router.state.location.pathname).toBe('/reservas/r-existente'))
        expect(fetchSimulado.mock.calls[0][1]?.headers).toMatchObject({
          'Idempotency-Key': '00000000-0000-4000-8000-000000000001',
        })
        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      } finally {
        vi.unstubAllGlobals()
        vi.unstubAllEnvs()
      }
    })

    it('deshabilita el botón mientras envía y un doble clic no manda dos reservas', async () => {
      let responder: (r: Awaited<ReturnType<typeof crearReserva>>) => void = () => {}
      reservar.mockReturnValueOnce(new Promise((resolver) => (responder = resolver)))
      const { usuario } = await abrirConfirmacion()

      const confirmar = within(dialogo()).getByRole('button', { name: 'Confirmar y reservar' })
      await usuario.dblClick(confirmar)

      expect(confirmar).toBeDisabled()
      expect(confirmar).toHaveTextContent('Reservando…')
      expect(within(dialogo()).getByRole('button', { name: 'Volver' })).toBeDisabled()
      expect(reservar).toHaveBeenCalledTimes(1)

      responder({ estado: 'ok', datos: reservaCreada() })
      expect(await screen.findByRole('heading', { name: '¡Tu reserva está creada!' })).toBeInTheDocument()
    })
  })

  describe('clave de idempotencia', () => {
    it('se mantiene en todos los reintentos de la misma reserva, aunque se cierre y se vuelva a abrir', async () => {
      reservar
        .mockResolvedValueOnce({ estado: 'error', error: errorDeConexion() })
        .mockResolvedValueOnce({ estado: 'error', error: errorDeConexion() })
      const { usuario } = await abrirConfirmacion()

      await usuario.click(within(dialogo()).getByRole('button', { name: 'Confirmar y reservar' }))
      expect(await within(dialogo()).findByRole('alert')).toHaveTextContent('No pudimos conectar con el servidor')

      // Se cierra y se vuelve a abrir: sigue siendo la misma reserva.
      await usuario.click(within(dialogo()).getByRole('button', { name: 'Volver' }))
      await usuario.click(panel().getByRole('button', { name: 'Reservar' }))
      await usuario.click(within(dialogo()).getByRole('button', { name: 'Confirmar y reservar' }))
      await within(dialogo()).findByRole('alert')

      await usuario.click(within(dialogo()).getByRole('button', { name: 'Reintentar' }))
      await screen.findByRole('heading', { name: '¡Tu reserva está creada!' })

      expect(claves()).toEqual([
        '00000000-0000-4000-8000-000000000001',
        '00000000-0000-4000-8000-000000000001',
        '00000000-0000-4000-8000-000000000001',
      ])
      expect(crypto.randomUUID).toHaveBeenCalledTimes(1)
    })

    it('cambia al cambiar las fechas', async () => {
      reservar.mockResolvedValueOnce({ estado: 'error', error: errorDeConexion() })
      const { usuario, router } = await abrirConfirmacion()
      await usuario.click(within(dialogo()).getByRole('button', { name: 'Confirmar y reservar' }))
      await within(dialogo()).findByRole('alert')
      await usuario.click(within(dialogo()).getByRole('button', { name: 'Volver' }))

      await router.navigate(`/alojamientos/${ID}?llegada=2030-04-20&salida=2030-04-23&huespedes=2`, { replace: true })
      await vi.waitFor(() =>
        expect(cotizar).toHaveBeenLastCalledWith(expect.objectContaining({ fechaLlegada: '2030-04-20' })),
      )
      await usuario.click(await panel().findByRole('button', { name: 'Reservar' }))
      await usuario.click(within(dialogo()).getByRole('button', { name: 'Confirmar y reservar' }))

      await vi.waitFor(() => expect(reservar).toHaveBeenCalledTimes(2))
      expect(reservar.mock.calls[1][0]).toMatchObject({ fechaLlegada: '2030-04-20', fechaSalida: '2030-04-23' })
      expect(claves()).toEqual([
        '00000000-0000-4000-8000-000000000001',
        '00000000-0000-4000-8000-000000000002',
      ])
    })

    it('cambia al cambiar los huéspedes', async () => {
      reservar.mockResolvedValueOnce({ estado: 'error', error: errorDeConexion() })
      const { usuario } = await abrirConfirmacion()
      await usuario.click(within(dialogo()).getByRole('button', { name: 'Confirmar y reservar' }))
      await within(dialogo()).findByRole('alert')
      await usuario.click(within(dialogo()).getByRole('button', { name: 'Volver' }))

      await usuario.click(panel().getByRole('button', { name: 'Agregar un huésped' }))
      await vi.waitFor(() =>
        expect(panel().getByRole('button', { name: 'Reservar' })).toBeEnabled(),
      )
      await usuario.click(panel().getByRole('button', { name: 'Reservar' }))
      await usuario.click(within(dialogo()).getByRole('button', { name: 'Confirmar y reservar' }))

      await vi.waitFor(() => expect(reservar).toHaveBeenCalledTimes(2))
      expect(reservar.mock.calls[1][0]).toMatchObject({ numeroHuespedes: 3 })
      expect(new Set(claves()).size).toBe(2)
    })
  })

  describe('errores', () => {
    it('409 PERIODO_NO_DISPONIBLE: explica que hay que elegir otras fechas y devuelve al calendario', async () => {
      reservar.mockResolvedValue(await errorDelServidor('PERIODO_NO_DISPONIBLE', 409))
      const { usuario } = await abrirConfirmacion()
      const cargasCalendario = calendario.mock.calls.length
      await usuario.click(within(dialogo()).getByRole('button', { name: 'Confirmar y reservar' }))

      await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
      const aviso = panel().getByRole('alert')
      expect(aviso).toHaveTextContent('Estas fechas ya no están libres')
      expect(aviso).toHaveTextContent('Elige otras fechas en el calendario.')
      expect(panel().getByRole('button', { name: 'Reservar' })).toBeDisabled()
      // El calendario vuelve a cargar lo ocupado y recibe el foco.
      await vi.waitFor(() => expect(calendario.mock.calls.length).toBeGreaterThan(cargasCalendario))
      expect(screen.getByRole('heading', { level: 2, name: 'Disponibilidad' })).toHaveFocus()
    })

    it('409 IDEMPOTENCIA_CONFLICTO: lo explica y el reintento va con una clave nueva', async () => {
      reservar.mockResolvedValueOnce(await errorDelServidor('IDEMPOTENCIA_CONFLICTO', 409))
      const { usuario } = await abrirConfirmacion()
      await usuario.click(within(dialogo()).getByRole('button', { name: 'Confirmar y reservar' }))

      expect(await within(dialogo()).findByRole('alert')).toHaveTextContent(
        'Esta solicitud de reserva no coincide con la que ya se había enviado.',
      )
      await usuario.click(within(dialogo()).getByRole('button', { name: 'Reintentar' }))
      await screen.findByRole('heading', { name: '¡Tu reserva está creada!' })
      expect(claves()).toEqual([
        '00000000-0000-4000-8000-000000000001',
        '00000000-0000-4000-8000-000000000002',
      ])
    })

    it('422 CAPACIDAD_EXCEDIDA: indica la capacidad y no ofrece repetir el envío', async () => {
      reservar.mockResolvedValue(await errorDelServidor('CAPACIDAD_EXCEDIDA', 422))
      const { usuario } = await abrirConfirmacion()
      await usuario.click(within(dialogo()).getByRole('button', { name: 'Confirmar y reservar' }))

      const alerta = await within(dialogo()).findByRole('alert')
      expect(alerta).toHaveTextContent('No se puede crear esta reserva')
      expect(alerta).toHaveTextContent('Este alojamiento admite hasta 4 huéspedes.')
      expect(within(dialogo()).queryByRole('button', { name: /Reintentar|Confirmar/ })).not.toBeInTheDocument()

      await usuario.click(within(dialogo()).getByRole('button', { name: 'Volver y cambiar' }))
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(reservar).toHaveBeenCalledTimes(1)
    })

    it('400 IDEMPOTENCIA_REQUERIDA: lo explica y permite reintentar con la misma clave', async () => {
      reservar.mockResolvedValueOnce(await errorDelServidor('IDEMPOTENCIA_REQUERIDA', 400))
      const { usuario } = await abrirConfirmacion()
      await usuario.click(within(dialogo()).getByRole('button', { name: 'Confirmar y reservar' }))

      expect(await within(dialogo()).findByRole('alert')).toHaveTextContent(
        'No pudimos enviar la reserva de forma segura.',
      )
      await usuario.click(within(dialogo()).getByRole('button', { name: 'Reintentar' }))
      await screen.findByRole('heading', { name: '¡Tu reserva está creada!' })
      expect(new Set(claves()).size).toBe(1)
    })
  })
})
