import { cleanup, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ResultadoApi } from '../../api/cliente'
import { errorDeConexion, interpretarRespuestaError } from '../../api/errores'
import {
  obtenerReserva,
  pagarReserva,
  type Reserva,
  type ResultadoPago,
} from '../../api/reservas'
import { renderizarApp } from '../../test/renderizarApp'
import { iniciarSesionDePrueba } from '../../test/sesion'
import { olvidarRegistrosEnMemoria } from './registroPago'

vi.mock('../../api/reservas', async (importarOriginal) => ({
  ...(await importarOriginal<typeof import('../../api/reservas')>()),
  obtenerReserva: vi.fn(),
  pagarReserva: vi.fn(),
}))

const ver = vi.mocked(obtenerReserva)
const pagar = vi.mocked(pagarReserva)

const ID = 'e1f2a3b4-0000-4000-8000-000000000600'
const RUTA = `/reservas/${ID}/pago`
const CLAVE = '00000000-0000-4000-8000-000000000001'

function reserva(cambios: Partial<Reserva> = {}): Reserva {
  return {
    id: ID,
    alojamientoId: 'a-1',
    alojamientoTitulo: 'Cabaña en Minca',
    alojamientoCiudad: 'Minca',
    imagenPortada: null,
    fechaLlegada: '2026-12-10',
    fechaSalida: '2026-12-13',
    numeroHuespedes: 2,
    estado: 'PENDIENTE_PAGO',
    cotizacion: {
      noches: 3,
      precioNoche: 250000,
      subtotal: 750000,
      tarifaLimpieza: 40000,
      tarifaServicio: 63750,
      porcentajeTarifaServicio: 8.5,
      total: 853750,
      moneda: 'COP',
    },
    ...cambios,
  }
}

function resultado(cambios: Partial<ResultadoPago>): ResultadoApi<ResultadoPago> {
  return {
    estado: 'ok',
    datos: {
      pagoId: 'p-1',
      reservaId: ID,
      estadoPago: 'APROBADO',
      estadoReserva: 'CONFIRMADA',
      total: 853750,
      moneda: 'COP',
      ...cambios,
    },
  }
}

async function error(codigo: string, status: number) {
  return {
    estado: 'error' as const,
    error: await interpretarRespuestaError(
      new Response(JSON.stringify({ codigo, mensaje: 'x', correlationId: 'corr-7' }), { status }),
    ),
  }
}

// Pago aprobado
async function aprobado() {
  ver.mockResolvedValue({ estado: 'ok', datos: reserva({ estado: 'CONFIRMADA' }) })
  return resultado({})
}

const botonPagar = () => screen.getByRole('button', { name: /^Pagar/ })
// Sin cobro repetido
const botonesDeCobro = () => screen.queryAllByRole('button', { name: /pagar|reintentar/i })

async function abrir(ruta = RUTA) {
  const app = renderizarApp(ruta)
  await screen.findByRole('heading', { level: 2, name: 'Cabaña en Minca' })
  return app
}

beforeEach(() => {
  iniciarSesionDePrueba('HUESPED')
  // Modo demo
  vi.stubEnv('VITE_SESION_DEMO', 'false')
  ver.mockReset()
  pagar.mockReset()
  olvidarRegistrosEnMemoria()
  ver.mockResolvedValue({ estado: 'ok', datos: reserva() })
  let n = 0
  vi.spyOn(crypto, 'randomUUID').mockImplementation(
    () => `00000000-0000-4000-8000-00000000000${++n}` as `${string}-${string}-${string}-${string}-${string}`,
  )
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
})

describe('pago de la reserva', () => {
  it('resume la reserva con su total y paga sin escenario ni datos de tarjeta', async () => {
    pagar.mockResolvedValue(resultado({}))
    const { usuario } = await abrir()

    expect(screen.getByRole('heading', { level: 1, name: 'Pagar la reserva' })).toBeInTheDocument()
    expect(screen.getByText('3 noches')).toBeInTheDocument()
    expect(screen.getByText('2 huéspedes')).toBeInTheDocument()
    expect(within(screen.getByLabelText('Desglose del precio')).getByText(/853\.750/)).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    // Sin selector de escenarios
    expect(screen.queryByRole('group', { name: /Escenario de prueba/ })).not.toBeInTheDocument()

    expect(botonPagar()).toHaveTextContent('Pagar $ 853.750')
    await usuario.click(botonPagar())
    expect(pagar).toHaveBeenCalledWith(ID, CLAVE, undefined)
  })

  it('mientras procesa explica la espera, pide no cerrar la ventana y no deja pagar dos veces', async () => {
    let responder: (r: ResultadoApi<ResultadoPago>) => void = () => {}
    pagar.mockReturnValueOnce(new Promise((resolver) => (responder = resolver)))
    const { usuario } = await abrir()

    await usuario.dblClick(botonPagar())
    expect(pagar).toHaveBeenCalledTimes(1)

    const estado = screen.getByRole('status')
    expect(estado).toHaveTextContent('Estamos procesando tu pago')
    expect(estado).toHaveTextContent('No cierres ni recargues esta ventana.')
    expect(estado).toHaveTextContent('Puede tardar hasta 12 segundos')
    expect(screen.getByRole('heading', { name: 'Estamos procesando tu pago' })).toHaveFocus()
    expect(botonesDeCobro()).toHaveLength(0)

    // Cierre de pestaña
    const salir = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(salir)
    expect(salir.defaultPrevented).toBe(true)

    responder(await aprobado())
    await screen.findByRole('heading', { name: /Pago aprobado/ })
  })

  describe('desenlaces', () => {
    it('200: el cobro se aprobó, la reserva queda confirmada y se muestra en su detalle', async () => {
      pagar.mockResolvedValue(resultado({}))
      const { usuario, router } = await abrir()
      ver.mockResolvedValue({ estado: 'ok', datos: reserva({ estado: 'CONFIRMADA' }) })

      await usuario.click(botonPagar())

      expect(
        await screen.findByRole('heading', { name: '¡Pago aprobado! Tu reserva está confirmada' }),
      ).toHaveFocus()
      expect(router.state.location.pathname).toBe(`/reservas/${ID}`)
      expect(screen.getByText('Confirmada')).toBeInTheDocument()
      expect(screen.queryByRole('link', { name: 'Pagar ahora' })).not.toBeInTheDocument()
    })

    it('402: dice que el pago falló, que las fechas ya no están retenidas e invita a buscar de nuevo', async () => {
      pagar.mockResolvedValue(await error('PAGO_RECHAZADO', 402))
      const { usuario } = await abrir()
      await usuario.click(botonPagar())

      const alerta = await screen.findByRole('alert')
      expect(within(alerta).getByRole('heading', { name: 'El pago no se aprobó' })).toHaveFocus()
      expect(alerta).toHaveTextContent('«Pago fallido»')
      expect(alerta).toHaveTextContent('Estas fechas ya no están apartadas para ti')
      expect(within(alerta).getByRole('link', { name: 'Buscar de nuevo estas fechas' })).toHaveAttribute(
        'href',
        '/alojamientos/a-1?llegada=2026-12-10&salida=2026-12-13&huespedes=2',
      )
      expect(within(alerta).getByRole('link', { name: 'Ver otros alojamientos' })).toHaveAttribute(
        'href',
        '/alojamientos',
      )
      expect(screen.getByText('Pago fallido', { selector: '.insignia-reserva' })).toBeInTheDocument()
      expect(botonesDeCobro()).toHaveLength(0)
    })

    it('202: pide esperar y consultar la reserva, y nunca ofrece reintentar el cobro', async () => {
      pagar.mockResolvedValue(resultado({ estadoPago: 'PAGO_INCIERTO', estadoReserva: 'EN_REVISION' }))
      const { usuario } = await abrir()
      await usuario.click(botonPagar())

      const aviso = await screen.findByRole('status')
      expect(within(aviso).getByRole('heading', { name: 'Estamos confirmando tu pago' })).toHaveFocus()
      expect(aviso).toHaveTextContent('No vuelvas a pagar.')
      expect(aviso).toHaveTextContent('Consulta tu reserva más tarde')
      expect(within(aviso).getByRole('link', { name: 'Ver mi reserva' })).toHaveAttribute('href', `/reservas/${ID}`)
      expect(botonesDeCobro()).toHaveLength(0)

      // Pago incierto
      cleanup()
      await abrir()
      expect(screen.getByRole('heading', { name: 'Estamos confirmando tu pago' })).toBeInTheDocument()
      expect(botonesDeCobro()).toHaveLength(0)
      expect(pagar).toHaveBeenCalledTimes(1)
    })

    it('503: el servicio de pagos no responde y se puede reintentar con la misma clave', async () => {
      pagar
        .mockResolvedValueOnce(await error('SERVICIO_PAGOS_NO_DISPONIBLE', 503))
        .mockImplementationOnce(aprobado)
      const { usuario } = await abrir()
      await usuario.click(botonPagar())

      const alerta = await screen.findByRole('alert')
      expect(within(alerta).getByRole('heading', { name: 'El servicio de pagos no está disponible' })).toHaveFocus()
      expect(alerta).toHaveTextContent('no se hizo ningún cobro')
      expect(alerta).toHaveTextContent('Espera unos minutos y vuelve a intentarlo.')
      expect(alerta).toHaveTextContent('corr-7')

      await usuario.click(within(alerta).getByRole('button', { name: 'Reintentar el pago' }))
      await screen.findByRole('heading', { name: /Pago aprobado/ })
      expect(pagar.mock.calls.map(([, clave]) => clave)).toEqual([CLAVE, CLAVE])
    })

    it('un error de conexión permite reintentar con la misma clave', async () => {
      pagar.mockResolvedValueOnce({ estado: 'error', error: errorDeConexion() }).mockImplementationOnce(aprobado)
      const { usuario } = await abrir()
      await usuario.click(botonPagar())

      const alerta = await screen.findByRole('alert')
      expect(alerta).toHaveTextContent('si el cobro ya se hizo, no se repetirá')
      await usuario.click(within(alerta).getByRole('button', { name: 'Reintentar el pago' }))
      await screen.findByRole('heading', { name: /Pago aprobado/ })
      expect(new Set(pagar.mock.calls.map(([, clave]) => clave))).toEqual(new Set([CLAVE]))
    })
  })

  describe('clave de idempotencia', () => {
    it('se genera una vez por reserva y sobrevive a volver a la pantalla', async () => {
      pagar.mockResolvedValue(await error('SERVICIO_PAGOS_NO_DISPONIBLE', 503))
      const primera = await abrir()
      await primera.usuario.click(botonPagar())
      await screen.findByRole('alert')

      cleanup()
      const segunda = await abrir()
      await segunda.usuario.click(botonPagar())
      await screen.findByRole('alert')

      expect(pagar.mock.calls.map(([, clave]) => clave)).toEqual([CLAVE, CLAVE])
      expect(crypto.randomUUID).toHaveBeenCalledTimes(1)
    })
  })

  describe('reservas que no están pendientes de pago', () => {
    it('409 ESTADO_RESERVA_INVALIDO: lo explica y lleva a ver la reserva', async () => {
      pagar.mockResolvedValue(await error('ESTADO_RESERVA_INVALIDO', 409))
      const { usuario } = await abrir()
      await usuario.click(botonPagar())

      const alerta = await screen.findByRole('alert')
      expect(
        within(alerta).getByRole('heading', { name: 'Esta reserva ya no está pendiente de pago' }),
      ).toHaveFocus()
      expect(alerta).toHaveTextContent('Solo se pueden pagar las reservas pendientes de pago.')
      expect(within(alerta).getByRole('link', { name: 'Ver el estado de la reserva' })).toHaveAttribute(
        'href',
        `/reservas/${ID}`,
      )
      expect(botonesDeCobro()).toHaveLength(0)
    })

    it.each(['CONFIRMADA', 'PENDIENTE_APROBACION', 'PAGO_FALLIDO'] as const)(
      'en %s lo explica sin ofrecer pagar',
      async (estado) => {
        ver.mockResolvedValue({ estado: 'ok', datos: reserva({ estado }) })
        await abrir()

        expect(screen.getByRole('heading', { name: 'Esta reserva no está pendiente de pago' })).toBeInTheDocument()
        expect(botonesDeCobro()).toHaveLength(0)
        expect(pagar).not.toHaveBeenCalled()
      },
    )

    it('una reserva que no existe lleva a mis reservas', async () => {
      ver.mockResolvedValue(await error('RESERVA_NO_ENCONTRADA', 404))
      renderizarApp(RUTA)

      expect(await screen.findByRole('heading', { name: 'No encontramos esta reserva' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Ver mis reservas' })).toHaveAttribute('href', '/reservas')
    })
  })

  describe('modo demostración', () => {
    it('con VITE_SESION_DEMO muestra los cuatro escenarios y envía el elegido', async () => {
      vi.stubEnv('VITE_SESION_DEMO', 'true')
      pagar.mockResolvedValue(await error('PAGO_RECHAZADO', 402))
      const { usuario } = await abrir()

      const grupo = within(screen.getByRole('group', { name: /Escenario de prueba/ }))
      expect(grupo.getAllByRole('radio').map((r) => (r as HTMLInputElement).value)).toEqual([
        'APROBAR',
        'RECHAZAR',
        'DEMORAR',
        'CAER',
      ])
      expect(grupo.getByRole('radio', { name: /^Aprobar/ })).toBeChecked()

      await usuario.click(grupo.getByRole('radio', { name: /^Rechazar/ }))
      await usuario.click(botonPagar())
      expect(pagar).toHaveBeenCalledWith(ID, CLAVE, 'RECHAZAR')
    })
  })

  it('se llega desde el detalle de la reserva', async () => {
    const { usuario, router } = renderizarApp(`/reservas/${ID}`)
    await usuario.click(await screen.findByRole('link', { name: 'Pagar ahora' }))
    expect(router.state.location.pathname).toBe(RUTA)
    expect(await screen.findByRole('heading', { level: 1, name: 'Pagar la reserva' })).toBeInTheDocument()
  })
})
