import { act, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  obtenerAlojamiento,
  obtenerCalendario,
  type AlojamientoDetalle,
  type DiaCalendario,
} from '../../api/alojamientos'
import type { ResultadoApi } from '../../api/cliente'
import { errorDeConexion, interpretarRespuestaError } from '../../api/errores'
import { renderizarApp } from '../../test/renderizarApp'
import { sumarDias } from './fechasCalendario'

vi.mock('../../api/alojamientos', async (importarOriginal) => ({
  ...(await importarOriginal<typeof import('../../api/alojamientos')>()),
  obtenerAlojamiento: vi.fn(),
  obtenerCalendario: vi.fn(),
}))

const detalle = vi.mocked(obtenerAlojamiento)
const calendario = vi.mocked(obtenerCalendario)

const ID = 'c1d2e3f4-0000-4000-8000-000000000210'
// Hoy es el martes 5 de marzo de 2030 en Bogotá: se ven marzo y abril.
const AHORA = new Date('2030-03-05T15:00:00Z')

const ALOJAMIENTO: AlojamientoDetalle = {
  id: ID,
  titulo: 'Cabaña en la Sierra',
  descripcion: 'Entre cafetales.',
  ciudad: 'Minca',
  ubicacionTextual: 'Vereda Pozo Azul',
  tipo: 'CABANA',
  capacidad: 4,
  precioNoche: 260000,
  modoReserva: 'INMEDIATA',
  anfitrionNombre: 'Sofía',
  imagenes: [],
}

// Todo libre salvo `ocupados`.
function conOcupados(...ocupados: string[]) {
  return async (_id: string, desde: string, hasta: string): Promise<ResultadoApi<DiaCalendario[]>> => {
    const dias: DiaCalendario[] = []
    for (let fecha = desde; fecha <= hasta; fecha = sumarDias(fecha, 1)) {
      dias.push({ fecha, disponible: !ocupados.includes(fecha) })
    }
    return { estado: 'ok', datos: dias }
  }
}

async function errorDelServidor(codigo: string, status: number): Promise<ResultadoApi<DiaCalendario[]>> {
  const respuesta = new Response(JSON.stringify({ codigo, mensaje: 'x' }), { status })
  return { estado: 'error', error: await interpretarRespuestaError(respuesta) }
}

const dia = (fecha: string) => {
  const boton = document.querySelector<HTMLButtonElement>(`[data-fecha="${fecha}"]`)
  if (!boton) throw new Error(`No se ve el día ${fecha}`)
  return boton
}
const calendarioVisible = () => within(screen.getByRole('region', { name: 'Disponibilidad' }))
const meses = () =>
  screen.getAllByRole('heading', { level: 3 }).map((titulo) => titulo.textContent)
const estadiaEnUrl = (router: { state: { location: { search: string } } }) => {
  const parametros = new URLSearchParams(router.state.location.search)
  return [parametros.get('llegada'), parametros.get('salida')]
}

// Abre el detalle y espera a que el calendario tenga datos.
async function abrir(ruta: Parameters<typeof renderizarApp>[0] = `/alojamientos/${ID}`) {
  const app = renderizarApp(ruta)
  await screen.findByRole('heading', { level: 1, name: ALOJAMIENTO.titulo })
  await vi.waitFor(() => expect(screen.queryByText('Cargando disponibilidad…')).not.toBeInTheDocument())
  return app
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(AHORA)
  detalle.mockReset()
  calendario.mockReset()
  detalle.mockResolvedValue({ estado: 'ok', datos: ALOJAMIENTO })
  calendario.mockImplementation(conOcupados())
})

afterEach(() => {
  vi.useRealTimers()
})

describe('Calendario de disponibilidad', () => {
  describe('carga', () => {
    it('pide el mes visible, el que se ve al lado y el siguiente, en una sola consulta', async () => {
      calendario.mockImplementation(conOcupados('2030-03-12'))
      await abrir()

      expect(calendario).toHaveBeenCalledTimes(1)
      expect(calendario).toHaveBeenCalledWith(ID, '2030-03-01', '2030-05-31')
      expect(meses()).toEqual(['Marzo de 2030', 'Abril de 2030'])
      expect(dia('2030-03-12')).toHaveAccessibleName(/12 de marzo de 2030, no disponible$/)
      expect(dia('2030-03-13')).toHaveAccessibleName(/13 de marzo de 2030, disponible$/)
      expect(dia('2030-03-04')).toHaveAccessibleName(/fecha pasada$/)
      expect(dia('2030-03-04')).toHaveAttribute('aria-disabled', 'true')
    })

    it('mientras carga lo anuncia y no deja elegir', async () => {
      calendario.mockReturnValue(new Promise(() => {}))
      renderizarApp(`/alojamientos/${ID}`)
      await screen.findByRole('heading', { level: 1, name: ALOJAMIENTO.titulo })

      expect(screen.getByText('Cargando disponibilidad…')).toBeInTheDocument()
      expect(dia('2030-03-20')).toHaveAttribute('aria-disabled', 'true')
      expect(dia('2030-03-20')).toHaveAccessibleName(/cargando disponibilidad$/)
    })

    it('un error de carga ofrece reintentar sin romper el resto del detalle', async () => {
      calendario.mockResolvedValueOnce({ estado: 'error', error: errorDeConexion() })
      const { usuario } = renderizarApp(`/alojamientos/${ID}`)

      expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos cargar la disponibilidad')
      expect(screen.getByRole('heading', { level: 1, name: ALOJAMIENTO.titulo })).toBeInTheDocument()
      expect(screen.getByRole('complementary', { name: 'Precio y reserva' })).toBeInTheDocument()

      await usuario.click(screen.getByRole('button', { name: 'Reintentar' }))
      await vi.waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
      expect(calendario).toHaveBeenCalledTimes(2)
      expect(dia('2030-03-20')).toHaveAccessibleName(/, disponible$/)
    })

    it('un 400 por rango inválido lo explica y ofrece volver al mes actual, no reintentar', async () => {
      calendario.mockImplementation(conOcupados())
      const { usuario } = await abrir()
      calendario.mockResolvedValueOnce(await errorDelServidor('RANGO_EXCESIVO', 400))

      await usuario.click(screen.getByRole('button', { name: 'Mes siguiente' }))
      await usuario.click(screen.getByRole('button', { name: 'Mes siguiente' }))

      const alerta = await screen.findByRole('alert')
      expect(alerta).toHaveTextContent('No pudimos consultar esas fechas')
      expect(alerta).toHaveTextContent('Solo se pueden consultar 365 días a la vez.')
      expect(within(alerta).queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument()

      await usuario.click(within(alerta).getByRole('button', { name: 'Volver al mes actual' }))
      expect(meses()).toEqual(['Marzo de 2030', 'Abril de 2030'])
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })

  describe('selección de rango', () => {
    it('llegada y salida marcan el rango, la salida aparte, y cuenta las noches', async () => {
      const { router, usuario } = await abrir({
        pathname: `/alojamientos/${ID}`,
        search: '?huespedes=2',
        state: { desde: '?ciudad=Minca' },
      })

      await usuario.click(dia('2030-04-10'))
      expect(screen.getByText(/Ahora elige el día de salida/)).toBeInTheDocument()
      expect(estadiaEnUrl(router)).toEqual([null, null])

      await usuario.click(dia('2030-04-14'))
      expect(estadiaEnUrl(router)).toEqual(['2030-04-10', '2030-04-14'])
      // Conserva lo demás de la URL y la búsqueda de la que se vino.
      expect(new URLSearchParams(router.state.location.search).get('huespedes')).toBe('2')
      expect(screen.getByRole('link', { name: 'Volver a los resultados' })).toHaveAttribute(
        'href',
        '/alojamientos?ciudad=Minca',
      )

      expect(dia('2030-04-10')).toHaveAccessibleName(/tu llegada/)
      for (const noche of ['2030-04-11', '2030-04-12', '2030-04-13']) {
        expect(dia(noche)).toHaveAccessibleName(/noche de tu estadía/)
        expect(dia(noche)).toHaveClass('dia-calendario--noche')
      }
      expect(dia('2030-04-14')).toHaveAccessibleName(/tu salida, esa noche no se cuenta/)
      expect(dia('2030-04-14')).toHaveClass('dia-calendario--salida')
      expect(dia('2030-04-14')).not.toHaveClass('dia-calendario--noche')

      expect(calendarioVisible().getByText('4 noches')).toBeInTheDocument()
      // La cotización lee las mismas fechas: hoy las muestra el panel.
      expect(screen.getByRole('complementary', { name: 'Precio y reserva' })).toHaveTextContent('4 noches')
    })

    it('un nuevo clic empieza otra estadía y «Borrar fechas» la quita', async () => {
      const { router, usuario } = await abrir(`/alojamientos/${ID}?llegada=2030-04-10&salida=2030-04-14`)

      await usuario.click(dia('2030-04-20'))
      // Mientras se elige la salida no queda una estadía a medias para cotizar.
      expect(estadiaEnUrl(router)).toEqual([null, null])
      await usuario.click(dia('2030-04-22'))
      expect(estadiaEnUrl(router)).toEqual(['2030-04-20', '2030-04-22'])
      expect(calendarioVisible().getByText('2 noches')).toBeInTheDocument()

      await usuario.click(screen.getByRole('button', { name: 'Borrar fechas' }))
      expect(estadiaEnUrl(router)).toEqual([null, null])
      expect(screen.getByText('Elige el día de llegada y después el de salida.')).toBeInTheDocument()
    })

    it('muestra seleccionadas las fechas que traía la búsqueda y abre en su mes', async () => {
      await abrir(`/alojamientos/${ID}?llegada=2030-05-10&salida=2030-05-12`)

      expect(meses()).toEqual(['Mayo de 2030', 'Junio de 2030'])
      expect(calendario).toHaveBeenCalledWith(ID, '2030-05-01', '2030-07-31')
      expect(dia('2030-05-10')).toHaveAccessibleName(/tu llegada/)
      expect(dia('2030-05-12')).toHaveAccessibleName(/tu salida/)
      expect(calendarioVisible().getByText('2 noches')).toBeInTheDocument()
    })

    it('ignora fechas de la búsqueda que ya pasaron', async () => {
      await abrir(`/alojamientos/${ID}?llegada=2030-03-01&salida=2030-03-03`)

      expect(meses()).toEqual(['Marzo de 2030', 'Abril de 2030'])
      expect(dia('2030-03-01')).toHaveAttribute('aria-pressed', 'false')
    })
  })

  describe('bloqueo de días ocupados', () => {
    it('no deja llegar un día ocupado ni en el pasado', async () => {
      calendario.mockImplementation(conOcupados('2030-04-15'))
      const { usuario } = await abrir()

      await usuario.click(dia('2030-04-15'))
      await usuario.click(dia('2030-03-02'))
      expect(screen.getByText('Elige el día de llegada y después el de salida.')).toBeInTheDocument()
      expect(dia('2030-04-15')).toHaveAttribute('aria-pressed', 'false')
    })

    it('no deja una salida que cruce noches ocupadas, pero sí salir el día ocupado', async () => {
      calendario.mockImplementation(conOcupados('2030-04-15', '2030-04-16'))
      const { router, usuario } = await abrir()

      await usuario.click(dia('2030-04-12'))
      expect(screen.getByText(/Como máximo puedes salir el/)).toHaveTextContent(/15 (de )?abr/)

      // Más allá de la primera noche ocupada no se puede salir.
      expect(dia('2030-04-17')).toHaveAttribute('aria-disabled', 'true')
      await usuario.click(dia('2030-04-17'))
      expect(estadiaEnUrl(router)).toEqual([null, null])
      expect(screen.getByText(/Ahora elige el día de salida/)).toBeInTheDocument()

      // El 15 está ocupado, pero como salida no se usa su noche.
      expect(dia('2030-04-15')).toHaveAccessibleName(/ocupado, pero puedes salir este día$/)
      expect(dia('2030-04-15')).toHaveAttribute('aria-disabled', 'false')
      await usuario.click(dia('2030-04-15'))
      expect(estadiaEnUrl(router)).toEqual(['2030-04-12', '2030-04-15'])
      expect(calendarioVisible().getByText('3 noches')).toBeInTheDocument()
    })

    it('si las fechas de la búsqueda ya no están libres, las quita y lo avisa', async () => {
      calendario.mockImplementation(conOcupados('2030-04-12'))
      const { router } = await abrir({
        pathname: `/alojamientos/${ID}`,
        search: '?llegada=2030-04-10&salida=2030-04-14',
        state: { desde: '?ciudad=Minca' },
      })

      await vi.waitFor(() => expect(estadiaEnUrl(router)).toEqual([null, null]))
      // La URL cambia antes de que React pinte: se espera al aviso.
      expect(await screen.findByText(/ya no están libres en este alojamiento/)).toBeInTheDocument()
      expect(dia('2030-04-10')).toHaveAttribute('aria-pressed', 'false')
      expect(screen.getByRole('link', { name: 'Volver a los resultados' })).toHaveAttribute(
        'href',
        '/alojamientos?ciudad=Minca',
      )
    })
  })

  describe('cambio de mes', () => {
    it('avanza y retrocede, y solo pide al backend los meses que faltan', async () => {
      const { usuario } = await abrir()
      expect(screen.getByRole('button', { name: 'Mes anterior' })).toBeDisabled()

      await usuario.click(screen.getByRole('button', { name: 'Mes siguiente' }))
      expect(meses()).toEqual(['Abril de 2030', 'Mayo de 2030'])
      await vi.waitFor(() => expect(calendario).toHaveBeenCalledTimes(2))
      expect(calendario).toHaveBeenLastCalledWith(ID, '2030-06-01', '2030-06-30')

      await usuario.click(screen.getByRole('button', { name: 'Mes anterior' }))
      expect(meses()).toEqual(['Marzo de 2030', 'Abril de 2030'])
      expect(calendario).toHaveBeenCalledTimes(2)
    })

    it('no avanza más de un año', async () => {
      const { usuario } = await abrir()
      const siguiente = screen.getByRole('button', { name: 'Mes siguiente' })
      for (let i = 0; i < 10; i++) await usuario.click(siguiente)

      expect(meses()).toEqual(['Enero de 2031', 'Febrero de 2031'])
      expect(siguiente).toBeDisabled()
      for (const [, desde, hasta] of calendario.mock.calls) {
        expect(Date.parse(hasta) - Date.parse(desde)).toBeLessThan(365 * 86_400_000)
      }
    })

    it('mantiene una selección hecha en otro mes', async () => {
      const { usuario } = await abrir()
      await usuario.click(dia('2030-04-28'))
      await usuario.click(screen.getByRole('button', { name: 'Mes siguiente' }))
      await usuario.click(dia('2030-05-02'))

      expect(calendarioVisible().getByText('4 noches')).toBeInTheDocument()
      expect(dia('2030-04-30')).toHaveAccessibleName(/noche de tu estadía/)
    })
  })

  describe('teclado', () => {
    it('se recorre con flechas, cambia de mes al pasar el borde y elige con Enter', async () => {
      const { router, usuario } = await abrir()

      // Un solo día en el orden de tabulación: hoy.
      act(() => dia('2030-03-05').focus())
      expect(dia('2030-03-05')).toHaveAttribute('tabindex', '0')
      expect(dia('2030-03-06')).toHaveAttribute('tabindex', '-1')

      await usuario.keyboard('{ArrowRight}')
      expect(dia('2030-03-06')).toHaveFocus()
      await usuario.keyboard('{ArrowDown}')
      expect(dia('2030-03-13')).toHaveFocus()
      await usuario.keyboard('{Enter}')
      await usuario.keyboard('{ArrowRight}{ArrowRight}{Enter}')
      expect(estadiaEnUrl(router)).toEqual(['2030-03-13', '2030-03-15'])

      // Bajar desde la última semana de abril lleva a mayo.
      await usuario.keyboard('{PageDown}')
      expect(dia('2030-04-15')).toHaveFocus()
      await usuario.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}')
      expect(dia('2030-05-06')).toHaveFocus()
      expect(meses()).toEqual(['Abril de 2030', 'Mayo de 2030'])

      // No va antes del mes actual: el viernes 1 de marzo es el primer día.
      await usuario.keyboard('{PageUp}{PageUp}{PageUp}')
      expect(meses()).toEqual(['Marzo de 2030', 'Abril de 2030'])
      expect(dia('2030-03-01')).toHaveFocus()
      await usuario.keyboard('{Home}')
      expect(dia('2030-03-01')).toHaveFocus()
      await usuario.keyboard('{End}')
      expect(dia('2030-03-03')).toHaveFocus()
    })
  })
})
