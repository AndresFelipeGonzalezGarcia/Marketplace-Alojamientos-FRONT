import { screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { interpretarRespuestaError } from '../../api/errores'
import { obtenerReserva, type Reserva } from '../../api/reservas'
import { renderizarApp } from '../../test/renderizarApp'
import { iniciarSesionDePrueba } from '../../test/sesion'

vi.mock('../../api/reservas', async (importarOriginal) => ({
  ...(await importarOriginal<typeof import('../../api/reservas')>()),
  obtenerReserva: vi.fn(),
}))

const ver = vi.mocked(obtenerReserva)

const RESERVA: Reserva = {
  id: 'e1f2a3b4-0000-4000-8000-000000000600',
  alojamientoId: 'a-1',
  alojamientoTitulo: 'Cabaña en Minca',
  alojamientoCiudad: 'Minca',
  imagenPortada: 'http://fotos.prueba/cabana.jpg',
  fechaLlegada: '2026-12-10',
  fechaSalida: '2026-12-13',
  numeroHuespedes: 2,
  estado: 'CONFIRMADA',
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
  creadaEn: '2026-11-01T10:00:00Z',
}

async function error(codigo: string, status: number) {
  return {
    estado: 'error' as const,
    error: await interpretarRespuestaError(
      new Response(JSON.stringify({ codigo, mensaje: 'x', correlationId: 'corr-9' }), { status }),
    ),
  }
}

const RUTA = `/reservas/${RESERVA.id}`

beforeEach(() => {
  iniciarSesionDePrueba('HUESPED')
  ver.mockReset()
  ver.mockResolvedValue({ estado: 'ok', datos: RESERVA })
})

describe('detalle de la reserva', () => {
  it('muestra alojamiento, fechas, huéspedes, desglose y estado', async () => {
    renderizarApp(RUTA)

    expect(await screen.findByRole('heading', { level: 1, name: 'Cabaña en Minca' })).toBeInTheDocument()
    expect(ver).toHaveBeenCalledWith(RESERVA.id)
    expect(screen.getByRole('link', { name: 'Ver el alojamiento' })).toHaveAttribute('href', '/alojamientos/a-1')

    const estado = screen.getByRole('region', { name: 'Confirmada' })
    expect(within(estado).getByText('Todo listo para tu viaje.')).toBeInTheDocument()

    const estadia = within(screen.getByRole('region', { name: 'Tu estadía' }))
    expect(estadia.getByText((_, el) => el?.getAttribute('datetime') === '2026-12-10')).toBeInTheDocument()
    expect(estadia.getByText((_, el) => el?.getAttribute('datetime') === '2026-12-13')).toBeInTheDocument()
    expect(estadia.getByText('3 noches')).toBeInTheDocument()
    expect(estadia.getByText('2 huéspedes')).toBeInTheDocument()

    const desglose = within(screen.getByRole('region', { name: 'Desglose del precio' }))
    expect(desglose.getByText('Tarifa de servicio (8,5 %)')).toBeInTheDocument()
    expect(desglose.getByText(/853\.750/)).toBeInTheDocument()
    expect(screen.getByText(RESERVA.id)).toBeInTheDocument()
    // Reserva confirmada
    expect(screen.queryByRole('link', { name: 'Pagar ahora' })).not.toBeInTheDocument()
  })

  it('pendiente de pago ofrece pagar, aunque no venga de reservar', async () => {
    ver.mockResolvedValue({ estado: 'ok', datos: { ...RESERVA, estado: 'PENDIENTE_PAGO' } })
    renderizarApp(RUTA)

    expect(await screen.findByRole('link', { name: 'Pagar ahora' })).toHaveAttribute('href', `${RUTA}/pago`)
    expect(screen.getByRole('heading', { level: 2, name: 'Pendiente de pago' })).not.toHaveFocus()
  })

  it('permite volver a mis reservas', async () => {
    renderizarApp(RUTA)
    await screen.findByRole('heading', { level: 1, name: 'Cabaña en Minca' })
    expect(within(screen.getByRole('main')).getByRole('link', { name: 'Mis reservas' })).toHaveAttribute(
      'href',
      '/reservas',
    )
  })

  it('cargando', () => {
    ver.mockReturnValue(new Promise(() => {}))
    renderizarApp(RUTA)
    expect(screen.getByRole('status')).toHaveTextContent('Cargando la reserva…')
  })

  it('404 RESERVA_NO_ENCONTRADA lleva a mis reservas', async () => {
    ver.mockResolvedValue(await error('RESERVA_NO_ENCONTRADA', 404))
    renderizarApp(RUTA)

    expect(await screen.findByRole('heading', { name: 'No encontramos esta reserva' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver mis reservas' })).toHaveAttribute('href', '/reservas')
  })

  it('si la consulta se rechaza muestra el error de conexión y permite reintentar', async () => {
    ver.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    const { usuario } = renderizarApp(RUTA)

    const alerta = await screen.findByRole('alert')
    expect(alerta).toHaveTextContent('No pudimos cargar la reserva')
    expect(alerta).toHaveTextContent('No pudimos conectar con el servidor')
    await usuario.click(within(alerta).getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Cabaña en Minca' })).toBeInTheDocument()
    expect(ver).toHaveBeenCalledTimes(2)
  })

  it('error con reintento', async () => {
    ver.mockResolvedValueOnce(await error('ERROR_INTERNO', 500))
    const { usuario } = renderizarApp(RUTA)

    const alerta = await screen.findByRole('alert')
    expect(alerta).toHaveTextContent('No pudimos cargar la reserva')
    expect(alerta).toHaveTextContent('corr-9')
    await usuario.click(within(alerta).getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Cabaña en Minca' })).toBeInTheDocument()
    expect(ver).toHaveBeenCalledTimes(2)
  })

  it.each(['ANFITRION', 'ADMINISTRADOR'] as const)('no deja entrar a %s', (rol) => {
    iniciarSesionDePrueba(rol)
    renderizarApp(RUTA)
    expect(ver).not.toHaveBeenCalled()
  })
})
