import { screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { interpretarRespuestaError } from '../../api/errores'
import {
  ESTADOS_RESERVA,
  listarMisReservas,
  type ReservaResumen,
} from '../../api/reservas'
import { renderizarApp } from '../../test/renderizarApp'
import { iniciarSesionDePrueba } from '../../test/sesion'
import { PRESENTACION_RESERVA } from './estadoReserva'

vi.mock('../../api/reservas', async (importarOriginal) => ({
  ...(await importarOriginal<typeof import('../../api/reservas')>()),
  listarMisReservas: vi.fn(),
}))

const listar = vi.mocked(listarMisReservas)

function reserva(cambios: Partial<ReservaResumen>): ReservaResumen {
  return {
    id: 'r-1',
    fechaLlegada: '2026-12-10',
    fechaSalida: '2026-12-13',
    numeroHuespedes: 2,
    estado: 'CONFIRMADA',
    alojamientoId: 'a-1',
    alojamientoTitulo: 'Cabaña en Minca',
    alojamientoCiudad: 'Minca',
    imagenPortada: 'http://fotos.prueba/cabana.jpg',
    total: 876300,
    ...cambios,
  }
}

const ok = (datos: ReservaResumen[]) => ({ estado: 'ok' as const, datos })

async function errorDelServidor() {
  return {
    estado: 'error' as const,
    error: await interpretarRespuestaError(
      new Response(
        JSON.stringify({
          codigo: 'ERROR_INTERNO',
          mensaje: 'Falló',
          correlationId: 'corr-123',
        }),
        { status: 500 },
      ),
    ),
  }
}

const lista = () => screen.getByRole('list', { name: 'Tus reservas' })
const tarjetas = () => within(lista()).getAllByRole('listitem')

beforeEach(() => {
  iniciarSesionDePrueba('HUESPED')
  listar.mockReset()
})

describe('mis reservas', () => {
  describe('listado', () => {
    it('ordena de la llegada más reciente a la más antigua', async () => {
      listar.mockResolvedValue(
        ok([
          reserva({ id: 'r-1', alojamientoTitulo: 'Antigua', fechaLlegada: '2026-01-05', fechaSalida: '2026-01-07' }),
          reserva({ id: 'r-2', alojamientoTitulo: 'Reciente', fechaLlegada: '2027-02-01', fechaSalida: '2027-02-03' }),
          reserva({ id: 'r-3', alojamientoTitulo: 'Media', fechaLlegada: '2026-06-10', fechaSalida: '2026-06-12' }),
        ]),
      )
      renderizarApp('/reservas')

      await screen.findByRole('list', { name: 'Tus reservas' })
      expect(
        tarjetas().map((t) => within(t).getByRole('heading').textContent),
      ).toEqual(['Reciente', 'Media', 'Antigua'])
      expect(screen.getByText('3 reservas')).toBeInTheDocument()
    })

    it('muestra foto, título, ciudad, fechas, noches, huéspedes, total y estado', async () => {
      listar.mockResolvedValue(ok([reserva({})]))
      renderizarApp('/reservas')

      await screen.findByRole('list', { name: 'Tus reservas' })
      const [tarjeta] = tarjetas()
      const t = within(tarjeta)
      expect(tarjeta.querySelector('img')).toHaveAttribute(
        'src',
        'http://fotos.prueba/cabana.jpg',
      )
      expect(t.getByRole('link', { name: 'Cabaña en Minca' })).toHaveAttribute(
        'href',
        '/reservas/r-1',
      )
      expect(t.getByText('Minca')).toBeInTheDocument()
      expect(tarjeta.querySelector('time[datetime="2026-12-10"]')).not.toBeNull()
      expect(tarjeta.querySelector('time[datetime="2026-12-13"]')).not.toBeNull()
      expect(t.getByText('3 noches · 2 huéspedes')).toBeInTheDocument()
      expect(t.getByText(/876\.300/)).toBeInTheDocument()
      expect(t.getByText('Confirmada')).toBeInTheDocument()
    })

    it('distingue los siete estados con nombre e icono propios', async () => {
      listar.mockResolvedValue(
        ok(
          ESTADOS_RESERVA.map((estado, n) =>
            reserva({
              id: `r-${n}`,
              estado,
              fechaLlegada: `2026-12-1${n}`,
              fechaSalida: `2026-12-2${n}`,
            }),
          ),
        ),
      )
      renderizarApp('/reservas')

      await screen.findByRole('list', { name: 'Tus reservas' })
      const etiquetas = new Set<string>()
      const iconos = new Set<string>()
      for (const tarjeta of tarjetas()) {
        const insignia = tarjeta.querySelector('.insignia-reserva')
        etiquetas.add(insignia?.textContent ?? '')
        iconos.add(insignia?.querySelector('svg')?.innerHTML ?? '')
      }
      expect(etiquetas.size).toBe(7)
      expect(iconos.size).toBe(7)
      for (const estado of ESTADOS_RESERVA) {
        expect(
          screen.getByText(PRESENTACION_RESERVA[estado].descripcion),
        ).toBeInTheDocument()
      }
    })

    it('solo ofrece pagar en las pendientes de pago', async () => {
      listar.mockResolvedValue(
        ok([
          reserva({ id: 'r-pagar', estado: 'PENDIENTE_PAGO', alojamientoTitulo: 'Por pagar', fechaLlegada: '2026-12-20', fechaSalida: '2026-12-22' }),
          reserva({ id: 'r-ok', estado: 'CONFIRMADA' }),
          reserva({ id: 'r-falla', estado: 'PAGO_FALLIDO', fechaLlegada: '2026-11-01', fechaSalida: '2026-11-02' }),
        ]),
      )
      renderizarApp('/reservas')

      await screen.findByRole('list', { name: 'Tus reservas' })
      const pagar = screen.getAllByRole('link', { name: /^Pagar/ })
      expect(pagar).toHaveLength(1)
      expect(pagar[0]).toHaveAccessibleName('Pagar la reserva en Por pagar')
      expect(pagar[0]).toHaveAttribute('href', '/reservas/r-pagar/pago')
    })

    it('el detalle es por ahora un marcador de posición', async () => {
      listar.mockResolvedValue(ok([reserva({})]))
      const { usuario } = renderizarApp('/reservas')

      await usuario.click(
        await screen.findByRole('link', { name: 'Cabaña en Minca' }),
      )
      expect(
        screen.getByRole('heading', { name: 'Detalle de la reserva' }),
      ).toBeInTheDocument()
      expect(screen.getByText('Próximamente')).toBeInTheDocument()
    })

    it('marca «Mis reservas» en la navegación', async () => {
      listar.mockResolvedValue(ok([]))
      renderizarApp('/reservas')

      const menu = within(screen.getByRole('navigation', { name: 'Principal' }))
      expect(menu.getByRole('link', { name: 'Mis reservas' })).toHaveAttribute(
        'aria-current',
        'page',
      )
    })

    it.each(['ANFITRION', 'ADMINISTRADOR'] as const)(
      'no deja entrar a %s',
      (rol) => {
        iniciarSesionDePrueba(rol)
        renderizarApp('/reservas')

        expect(listar).not.toHaveBeenCalled()
        expect(
          screen.queryByRole('heading', { name: 'Mis reservas' }),
        ).not.toBeInTheDocument()
      },
    )
  })

  describe('filtro por estado', () => {
    it('consulta al backend con el estado elegido y lo guarda en la URL', async () => {
      listar.mockResolvedValue(ok([reserva({})]))
      const { usuario, router } = renderizarApp('/reservas')

      await screen.findByRole('list', { name: 'Tus reservas' })
      expect(listar).toHaveBeenLastCalledWith(undefined)
      expect(screen.getByRole('radio', { name: 'Todas' })).toBeChecked()

      listar.mockResolvedValue(
        ok([reserva({ id: 'r-9', estado: 'PENDIENTE_PAGO', alojamientoTitulo: 'Por pagar' })]),
      )
      await usuario.click(screen.getByRole('radio', { name: 'Pendiente de pago' }))

      expect(listar).toHaveBeenLastCalledWith('PENDIENTE_PAGO')
      expect(router.state.location.search).toBe('?estado=PENDIENTE_PAGO')
      expect(await screen.findByRole('link', { name: 'Por pagar' })).toBeInTheDocument()
      expect(screen.queryByRole('link', { name: 'Cabaña en Minca' })).not.toBeInTheDocument()

      listar.mockResolvedValue(ok([reserva({})]))
      await usuario.click(screen.getByRole('radio', { name: 'Todas' }))
      expect(listar).toHaveBeenLastCalledWith(undefined)
      expect(router.state.location.search).toBe('')
    })

    it('lee el estado de la URL e ignora uno desconocido', async () => {
      listar.mockResolvedValue(ok([]))
      renderizarApp('/reservas?estado=CANCELADA')
      expect(await screen.findByRole('radio', { name: 'Cancelada' })).toBeChecked()
      expect(listar).toHaveBeenLastCalledWith('CANCELADA')
    })

    it('con un estado desconocido muestra todas', async () => {
      listar.mockResolvedValue(ok([]))
      renderizarApp('/reservas?estado=INVENTADO')
      expect(await screen.findByRole('radio', { name: 'Todas' })).toBeChecked()
      expect(listar).toHaveBeenLastCalledWith(undefined)
    })

    it('ofrece los siete estados además de «Todas»', async () => {
      listar.mockResolvedValue(ok([]))
      renderizarApp('/reservas')
      const grupo = within(
        await screen.findByRole('group', { name: 'Filtrar por estado' }),
      )
      expect(grupo.getAllByRole('radio')).toHaveLength(8)
    })
  })

  describe('estados de la pantalla', () => {
    it('cargando', () => {
      listar.mockReturnValue(new Promise(() => {}))
      renderizarApp('/reservas')

      expect(screen.getByText('Cargando tus reservas…')).toHaveAttribute(
        'role',
        'status',
      )
      expect(
        screen.getByRole('heading', { name: 'Mis reservas' }),
      ).toBeInTheDocument()
    })

    it('vacío invita a buscar alojamientos', async () => {
      listar.mockResolvedValue(ok([]))
      renderizarApp('/reservas')

      expect(
        await screen.findByRole('heading', { name: 'Aún no tienes reservas' }),
      ).toBeInTheDocument()
      expect(
        within(screen.getByRole('main')).getByRole('link', {
          name: 'Buscar alojamientos',
        }),
      ).toHaveAttribute('href', '/alojamientos')
    })

    it('vacío con filtro permite volver a ver todas', async () => {
      listar.mockResolvedValue(ok([]))
      const { usuario, router } = renderizarApp('/reservas?estado=EN_REVISION')

      expect(
        await screen.findByRole('heading', { name: 'No tienes reservas «En revisión»' }),
      ).toBeInTheDocument()
      await usuario.click(screen.getByRole('button', { name: 'Ver todas mis reservas' }))
      expect(router.state.location.search).toBe('')
      expect(listar).toHaveBeenLastCalledWith(undefined)
    })

    it('error con reintento', async () => {
      listar.mockResolvedValueOnce(await errorDelServidor())
      const { usuario } = renderizarApp('/reservas')

      const alerta = await screen.findByRole('alert')
      expect(
        within(alerta).getByRole('heading', { name: 'No pudimos cargar tus reservas' }),
      ).toBeInTheDocument()
      expect(alerta).toHaveTextContent('corr-123')

      listar.mockResolvedValueOnce(ok([reserva({})]))
      await usuario.click(screen.getByRole('button', { name: 'Reintentar' }))

      expect(
        await screen.findByRole('link', { name: 'Cabaña en Minca' }),
      ).toBeInTheDocument()
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      expect(listar).toHaveBeenCalledTimes(2)
    })
  })
})
