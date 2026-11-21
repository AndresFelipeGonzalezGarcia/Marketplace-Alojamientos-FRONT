import { act, fireEvent, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  buscarAlojamientos,
  listarServiciosPublicos,
  obtenerAlojamiento,
  type AlojamientoResumen,
  type PaginaAlojamientos,
} from '../../api/alojamientos'
import type { ResultadoApi } from '../../api/cliente'
import { interpretarRespuestaError } from '../../api/errores'
import { renderizarApp } from '../../test/renderizarApp'
import { iniciarSesionDePrueba } from '../../test/sesion'

vi.mock('../../api/alojamientos', async (importarOriginal) => ({
  ...(await importarOriginal<typeof import('../../api/alojamientos')>()),
  buscarAlojamientos: vi.fn(),
  listarServiciosPublicos: vi.fn(),
  obtenerAlojamiento: vi.fn(),
}))

const buscar = vi.mocked(buscarAlojamientos)
const servicios = vi.mocked(listarServiciosPublicos)
const detalle = vi.mocked(obtenerAlojamiento)

const WIFI = 'b0a1c3d4-0000-4000-8000-000000000101'
const PISCINA = 'b0a1c3d4-0000-4000-8000-000000000104'
// Fechas de prueba
const LLEGADA = '2030-12-10'
const SALIDA = '2030-12-14'

function alojamiento(n: number, cambios: Partial<AlojamientoResumen> = {}): AlojamientoResumen {
  return {
    id: `a-${n}`,
    titulo: `Alojamiento ${n}`,
    ciudad: 'Medellín',
    tipo: 'APARTAMENTO',
    capacidad: 4,
    precioNoche: 200000,
    imagenPortada: `http://fotos.prueba/${n}.jpg`,
    modoReserva: 'INMEDIATA',
    ...cambios,
  }
}

function pagina(
  contenido: AlojamientoResumen[],
  { pagina = 0, total = contenido.length, tamano = 12 } = {},
): ResultadoApi<PaginaAlojamientos> {
  return {
    estado: 'ok',
    datos: { contenido, pagina, tamano, total, totalPaginas: Math.ceil(total / tamano) },
  }
}

async function errorDelServidor(cuerpo: object, status: number) {
  return {
    estado: 'error' as const,
    error: await interpretarRespuestaError(new Response(JSON.stringify(cuerpo), { status })),
  }
}

async function abrir(ruta = '/alojamientos') {
  const app = renderizarApp(ruta)
  await screen.findByRole('heading', { level: 2, name: /alojamiento|Resultados/ })
  return app
}

// Esperar búsqueda
async function esperarResultados() {
  await screen.findByRole('list', { name: 'Alojamientos encontrados' })
}

const ultimaConsulta = () => buscar.mock.lastCall?.[0]
const tarjetas = () =>
  within(screen.getByRole('list', { name: 'Alojamientos encontrados' })).getAllByRole('listitem')
const buscador = () => within(screen.getByRole('search', { name: 'Buscar alojamientos' }))
const busquedaEnUrl = (router: { state: { location: { search: string } } }) =>
  new URLSearchParams(router.state.location.search)

beforeEach(() => {
  buscar.mockReset()
  servicios.mockReset()
  buscar.mockResolvedValue(pagina([alojamiento(1), alojamiento(2)]))
  servicios.mockResolvedValue({
    estado: 'ok',
    datos: [
      { id: WIFI, nombre: 'Wifi' },
      { id: PISCINA, nombre: 'Piscina' },
    ],
  })
})

describe('búsqueda de alojamientos', () => {
  describe('acceso', () => {
    it('funciona sin sesión y aparece en la navegación del visitante', async () => {
      await abrir()

      expect(
        within(screen.getByRole('navigation', { name: 'Principal' })).getByRole('link', {
          name: 'Buscar alojamientos',
        }),
      ).toHaveAttribute('aria-current', 'page')
      expect(screen.getByRole('heading', { level: 1, name: 'Encuentra dónde quedarte' })).toBeInTheDocument()
      await esperarResultados()
    })

    it.each(['HUESPED', 'ANFITRION', 'ADMINISTRADOR'] as const)(
      'está en la navegación de %s',
      async (rol) => {
        iniciarSesionDePrueba(rol)
        await abrir()

        expect(
          within(screen.getByRole('navigation', { name: 'Principal' })).getByRole('link', {
            name: 'Buscar alojamientos',
          }),
        ).toHaveAttribute('href', '/alojamientos')
      },
    )
  })

  describe('estados', () => {
    it('mientras carga muestra esqueletos de tarjeta, no una rueda', async () => {
      buscar.mockReturnValue(new Promise(() => {}))
      renderizarApp('/alojamientos')

      expect(await screen.findByRole('status')).toHaveTextContent('Buscando alojamientos…')
      const region = screen.getByRole('heading', { name: 'Resultados' }).closest('section')
      expect(region).toHaveAttribute('aria-busy', 'true')
      const esqueletos = region!.querySelectorAll('.tarjeta-alojamiento--esqueleto')
      expect(esqueletos).toHaveLength(6)
      esqueletos.forEach((esqueleto) => expect(esqueleto).toHaveAttribute('aria-hidden', 'true'))
    })

    it('muestra las tarjetas con foto, título, ciudad, tipo, capacidad y precio', async () => {
      buscar.mockResolvedValue(
        pagina([
          alojamiento(1, {
            titulo: 'Loft en El Poblado',
            ciudad: 'Medellín',
            tipo: 'APARTAMENTO',
            capacidad: 2,
            precioNoche: 240000,
          }),
          alojamiento(2, {
            titulo: 'Cabaña en Minca',
            tipo: 'CABANA',
            capacidad: 1,
            imagenPortada: null,
            modoReserva: 'CON_APROBACION',
          }),
        ]),
      )
      await abrir()
      await esperarResultados()

      expect(screen.getByRole('heading', { level: 2, name: '2 alojamientos' })).toBeInTheDocument()
      const [primera, segunda] = tarjetas()
      expect(primera.querySelector('img')).toHaveAttribute('src', 'http://fotos.prueba/1.jpg')
      expect(within(primera).getByRole('link', { name: 'Loft en El Poblado' })).toHaveAttribute(
        'href',
        '/alojamientos/a-1',
      )
      expect(primera).toHaveTextContent('Medellín · Apartamento')
      expect(primera).toHaveTextContent('Hasta 2 huéspedes')
      expect(primera).toHaveTextContent(/\$\s?240\.000\s*\/ noche/)
      expect(primera).toHaveTextContent('Reserva inmediata')

      expect(segunda).toHaveTextContent('Cabaña')
      expect(segunda).toHaveTextContent('Hasta 1 huésped')
      expect(within(segunda).getByText('Sin foto')).toBeInTheDocument()
      expect(segunda).not.toHaveTextContent('Reserva inmediata')
    })

    it('sin resultados invita a ampliar los filtros y permite limpiarlos', async () => {
      buscar.mockResolvedValue(pagina([]))
      const { router, usuario } = await abrir('/alojamientos?ciudad=Leticia&tipo=CASA')

      expect(
        await screen.findByText('No encontramos alojamientos con estos filtros'),
      ).toBeInTheDocument()
      expect(screen.getByText(/rango de\s+precio más amplio/)).toBeInTheDocument()

      buscar.mockResolvedValue(pagina([alojamiento(1)]))
      await usuario.click(screen.getByRole('button', { name: 'Limpiar filtros' }))

      expect(router.state.location.search).toBe('')
      await esperarResultados()
      expect(buscador().getByLabelText('Destino')).toHaveValue('')
      expect(ultimaConsulta()).toMatchObject({ ciudad: undefined, tipo: undefined })
    })

    it('sin resultados y sin filtros no ofrece limpiar', async () => {
      buscar.mockResolvedValue(pagina([]))
      await abrir()

      expect(
        await screen.findByText('Todavía no hay alojamientos publicados'),
      ).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Limpiar filtros' })).not.toBeInTheDocument()
    })

    it('si la búsqueda se rechaza muestra el error de conexión y permite reintentar', async () => {
      buscar.mockRejectedValueOnce(new TypeError('Failed to fetch'))
      const { usuario } = await abrir()

      const alerta = await screen.findByRole('alert')
      expect(alerta).toHaveTextContent('No pudimos cargar los alojamientos')
      expect(alerta).toHaveTextContent('No pudimos conectar con el servidor')

      await usuario.click(within(alerta).getByRole('button', { name: 'Reintentar' }))

      await esperarResultados()
      expect(buscar).toHaveBeenCalledTimes(2)
    })

    it('si falla permite reintentar', async () => {
      buscar.mockResolvedValueOnce(
        await errorDelServidor({ codigo: 'ERROR_INTERNO', mensaje: 'x', correlationId: 'ref-7' }, 500),
      )
      const { usuario } = await abrir()

      const alerta = await screen.findByRole('alert')
      expect(alerta).toHaveTextContent('No pudimos cargar los alojamientos')
      expect(alerta).toHaveTextContent('Código de referencia: ref-7')

      await usuario.click(within(alerta).getByRole('button', { name: 'Reintentar' }))

      await esperarResultados()
      expect(buscar).toHaveBeenCalledTimes(2)
    })
  })

  describe('búsqueda principal y URL', () => {
    it('lee los filtros de la URL, los muestra y consulta con ellos', async () => {
      await abrir(
        `/alojamientos?ciudad=Cali&llegada=${LLEGADA}&salida=${SALIDA}&huespedes=3&tipo=CASA&servicios=${WIFI}&precioMax=300000`,
      )
      await esperarResultados()

      expect(ultimaConsulta()).toEqual({
        ciudad: 'Cali',
        fechaLlegada: LLEGADA,
        fechaSalida: SALIDA,
        huespedes: 3,
        precioMin: undefined,
        precioMax: 300000,
        tipo: 'CASA',
        serviciosIds: [WIFI],
        pagina: 0,
        tamano: 12,
      })
      expect(buscador().getByLabelText('Destino')).toHaveValue('Cali')
      expect(buscador().getByLabelText('Llegada')).toHaveValue(LLEGADA)
      expect(buscador().getByLabelText('Salida')).toHaveValue(SALIDA)
      expect(buscador().getByLabelText('Huéspedes')).toHaveValue(3)
      expect(screen.getByRole('radio', { name: 'Casa' })).toBeChecked()
      expect(await screen.findByRole('checkbox', { name: 'Wifi' })).toBeChecked()
      expect(screen.getByLabelText('Hasta')).toHaveValue('300000')
    })

    it('al buscar escribe los filtros en la URL y vuelve a la página 1', async () => {
      const { router, usuario } = await abrir('/alojamientos?pagina=2')
      await esperarResultados()

      await usuario.type(buscador().getByLabelText('Destino'), 'Santa Marta')
      fireEvent.change(buscador().getByLabelText('Llegada'), { target: { value: LLEGADA } })
      fireEvent.change(buscador().getByLabelText('Salida'), { target: { value: SALIDA } })
      await usuario.type(buscador().getByLabelText('Huéspedes'), '2')
      await usuario.click(buscador().getByRole('button', { name: 'Buscar' }))

      expect(Object.fromEntries(busquedaEnUrl(router))).toEqual({
        ciudad: 'Santa Marta',
        llegada: LLEGADA,
        salida: SALIDA,
        huespedes: '2',
      })
      await esperarResultados()
      expect(ultimaConsulta()).toMatchObject({
        ciudad: 'Santa Marta',
        fechaLlegada: LLEGADA,
        fechaSalida: SALIDA,
        huespedes: 2,
        pagina: 0,
      })
    })

    it('cuenta las noches con la salida exclusiva: del 10 al 14 son 4', async () => {
      await abrir()

      fireEvent.change(buscador().getByLabelText('Llegada'), { target: { value: LLEGADA } })
      fireEvent.change(buscador().getByLabelText('Salida'), { target: { value: SALIDA } })

      expect(buscador().getByLabelText('Salida')).toHaveAccessibleDescription(
        /^4 noches: llegas el .*10.* y sales el .*14/,
      )
    })

    it('el resumen de resultados también habla en noches', async () => {
      await abrir(`/alojamientos?llegada=${LLEGADA}&salida=${SALIDA}`)
      await esperarResultados()

      expect(
        screen.getByRole('heading', { level: 2, name: /^2 alojamientos para 4 noches, del .*10.* al .*14/ }),
      ).toBeInTheDocument()
    })

    it('no busca si falta la fecha de salida y lo dice junto a las fechas', async () => {
      const { router, usuario } = await abrir()
      await esperarResultados()
      buscar.mockClear()

      fireEvent.change(buscador().getByLabelText('Llegada'), { target: { value: LLEGADA } })
      await usuario.click(buscador().getByRole('button', { name: 'Buscar' }))

      expect(buscador().getByLabelText('Llegada')).toHaveAccessibleDescription(
        /Elige también la fecha de salida\./,
      )
      expect(buscador().getByLabelText('Llegada')).toHaveAttribute('aria-invalid', 'true')
      expect(router.state.location.search).toBe('')
      expect(buscar).not.toHaveBeenCalled()
    })

    it('muestra el 400 FECHAS_INVALIDAS junto al campo de fechas', async () => {
      buscar.mockResolvedValue(
        await errorDelServidor({ codigo: 'FECHAS_INVALIDAS', mensaje: 'x' }, 400),
      )
      // Fechas invertidas
      await abrir(`/alojamientos?llegada=${SALIDA}&salida=${LLEGADA}`)

      const salida = buscador().getByLabelText('Salida')
      await vi.waitFor(() =>
        expect(salida).toHaveAccessibleDescription(
          /La salida debe ser al menos un día después de la llegada\./,
        ),
      )
      expect(salida).toHaveAttribute('aria-invalid', 'true')
      expect(screen.getByText('Revisa la búsqueda')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument()
    })
  })

  describe('filtros secundarios', () => {
    it('elegir un tipo lo aplica, va a la URL y vuelve a la página 1', async () => {
      const { router, usuario } = await abrir('/alojamientos?ciudad=Cali&pagina=2')
      await esperarResultados()

      await usuario.click(screen.getByRole('radio', { name: 'Cabaña' }))

      expect(Object.fromEntries(busquedaEnUrl(router))).toEqual({ ciudad: 'Cali', tipo: 'CABANA' })
      await esperarResultados()
      expect(ultimaConsulta()).toMatchObject({ ciudad: 'Cali', tipo: 'CABANA', pagina: 0 })

      await usuario.click(screen.getByRole('radio', { name: 'Todos' }))
      expect(busquedaEnUrl(router).has('tipo')).toBe(false)
    })

    it('marcar y desmarcar servicios actualiza la URL', async () => {
      const { router, usuario } = await abrir()
      await esperarResultados()

      await usuario.click(await screen.findByRole('checkbox', { name: 'Wifi' }))
      await usuario.click(screen.getByRole('checkbox', { name: 'Piscina' }))
      expect(busquedaEnUrl(router).get('servicios')).toBe(`${WIFI},${PISCINA}`)
      await esperarResultados()
      expect(ultimaConsulta()?.serviciosIds).toEqual([WIFI, PISCINA])

      await usuario.click(screen.getByRole('checkbox', { name: 'Wifi' }))
      expect(busquedaEnUrl(router).get('servicios')).toBe(PISCINA)
    })

    it('el precio se aplica al pulsar Aplicar', async () => {
      const { router, usuario } = await abrir()
      await esperarResultados()

      await usuario.type(screen.getByLabelText('Desde'), '100.000')
      await usuario.type(screen.getByLabelText('Hasta'), '300000')
      expect(busquedaEnUrl(router).has('precioMin')).toBe(false)

      await usuario.click(screen.getByRole('button', { name: 'Aplicar precio' }))

      expect(busquedaEnUrl(router).get('precioMin')).toBe('100000')
      expect(busquedaEnUrl(router).get('precioMax')).toBe('300000')
      await esperarResultados()
      expect(ultimaConsulta()).toMatchObject({ precioMin: 100000, precioMax: 300000 })
    })

    it('un mínimo mayor que el máximo no se aplica', async () => {
      const { router, usuario } = await abrir()
      await esperarResultados()

      await usuario.type(screen.getByLabelText('Desde'), '500000')
      await usuario.type(screen.getByLabelText('Hasta'), '100000')
      await usuario.click(screen.getByRole('button', { name: 'Aplicar precio' }))

      expect(screen.getByLabelText('Desde')).toHaveAccessibleDescription(
        /El precio mínimo no puede ser mayor que el máximo\./,
      )
      expect(router.state.location.search).toBe('')
    })

    it('si el catálogo de servicios se rechaza, los oculta y la búsqueda sigue', async () => {
      servicios.mockRejectedValue(new TypeError('Failed to fetch'))
      await abrir()
      await esperarResultados()

      await vi.waitFor(() =>
        expect(screen.queryByText('Cargando servicios…')).not.toBeInTheDocument(),
      )
      expect(screen.queryByRole('group', { name: 'Servicios' })).not.toBeInTheDocument()
      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    })

    it('si el catálogo de servicios falla, los oculta y lo demás sigue funcionando', async () => {
      servicios.mockResolvedValue(
        await errorDelServidor({ codigo: 'ERROR_INTERNO', mensaje: 'x' }, 500),
      )
      const { router, usuario } = await abrir()
      await esperarResultados()

      await vi.waitFor(() =>
        expect(screen.queryByText('Cargando servicios…')).not.toBeInTheDocument(),
      )
      expect(screen.queryByRole('group', { name: 'Servicios' })).not.toBeInTheDocument()
      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()

      await usuario.click(screen.getByRole('radio', { name: 'Casa' }))
      expect(busquedaEnUrl(router).get('tipo')).toBe('CASA')
      await esperarResultados()
    })
  })

  describe('paginación', () => {
    const veintiocho = (desde: number, cuantos: number) =>
      Array.from({ length: cuantos }, (_, i) => alojamiento(desde + i))

    it('muestra las páginas y el rango según PaginaAlojamientos', async () => {
      buscar.mockResolvedValue(pagina(veintiocho(1, 12), { total: 28 }))
      await abrir()
      await esperarResultados()

      const nav = screen.getByRole('navigation', { name: 'Paginación de resultados' })
      expect(within(nav).getByRole('link', { name: 'Página 1' })).toHaveAttribute('aria-current', 'page')
      expect(within(nav).getByRole('link', { name: 'Página 3' })).toHaveAttribute(
        'href',
        '/alojamientos?pagina=3',
      )
      expect(within(nav).getByText('← Anterior')).toHaveAttribute('aria-disabled', 'true')
      expect(screen.getByText('Mostrando 1–12 de 28')).toBeInTheDocument()
    })

    it('ir a la siguiente pide la página a la API, la pone en la URL y conserva los filtros', async () => {
      buscar.mockResolvedValue(pagina(veintiocho(1, 12), { total: 28 }))
      const { router, usuario } = await abrir('/alojamientos?ciudad=Cali')
      await esperarResultados()

      buscar.mockResolvedValue(pagina(veintiocho(13, 12), { pagina: 1, total: 28 }))
      await usuario.click(screen.getByRole('link', { name: 'Siguiente →' }))

      expect(Object.fromEntries(busquedaEnUrl(router))).toEqual({ ciudad: 'Cali', pagina: '2' })
      expect(await screen.findByText('Mostrando 13–24 de 28')).toBeInTheDocument()
      expect(ultimaConsulta()).toMatchObject({ ciudad: 'Cali', pagina: 1 })
      expect(screen.getByRole('link', { name: 'Página 2' })).toHaveAttribute('aria-current', 'page')
      // Foco en resultados
      expect(screen.getByRole('heading', { level: 2, name: '28 alojamientos' })).toHaveFocus()
    })

    it('en la última página no hay «Siguiente»', async () => {
      buscar.mockResolvedValue(pagina(veintiocho(25, 4), { pagina: 2, total: 28 }))
      await abrir('/alojamientos?pagina=3')
      await esperarResultados()

      expect(screen.getByText('Siguiente →')).toHaveAttribute('aria-disabled', 'true')
      expect(screen.getByText('Mostrando 25–28 de 28')).toBeInTheDocument()
    })

    it('con una sola página no muestra paginación', async () => {
      await abrir()
      await esperarResultados()

      expect(
        screen.queryByRole('navigation', { name: 'Paginación de resultados' }),
      ).not.toBeInTheDocument()
    })

    it('una página que ya no existe ofrece ir a la primera', async () => {
      buscar.mockResolvedValue(pagina([], { pagina: 8, total: 5 }))
      await abrir('/alojamientos?pagina=9')

      expect(await screen.findByText('Esta página ya no tiene resultados')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Ir a la primera página' })).toHaveAttribute(
        'href',
        '/alojamientos',
      )
    })
  })

  describe('detalle y vuelta', () => {
    it('la tarjeta lleva al detalle con las fechas y los huéspedes', async () => {
      await abrir(`/alojamientos?ciudad=Cali&llegada=${LLEGADA}&salida=${SALIDA}&huespedes=2`)
      await esperarResultados()

      expect(screen.getByRole('link', { name: 'Alojamiento 1' })).toHaveAttribute(
        'href',
        `/alojamientos/a-1?llegada=${LLEGADA}&salida=${SALIDA}&huespedes=2`,
      )
    })

    it('al volver desde el detalle los filtros siguen puestos', async () => {
      const busqueda = `?ciudad=Cali&tipo=CASA&pagina=2`
      buscar.mockResolvedValue(pagina([alojamiento(1)], { pagina: 1, total: 13 }))
      const { router, usuario } = await abrir(`/alojamientos${busqueda}`)
      await esperarResultados()

      detalle.mockResolvedValue({
        estado: 'ok',
        datos: {
          ...alojamiento(1),
          descripcion: 'Descripción.',
          ubicacionTextual: 'Calle 1',
          anfitrionNombre: 'Ana',
        },
      })
      await usuario.click(screen.getByRole('link', { name: 'Alojamiento 1' }))
      expect(
        await screen.findByRole('heading', { level: 1, name: 'Alojamiento 1' }),
      ).toBeInTheDocument()
      // Volver a la búsqueda
      expect(screen.getByRole('link', { name: 'Volver a los resultados' })).toHaveAttribute(
        'href',
        `/alojamientos${busqueda}`,
      )

      // Botón atrás
      await act(() => router.navigate(-1))
      await esperarResultados()
      expect(router.state.location.search).toBe(busqueda)
      expect(buscador().getByLabelText('Destino')).toHaveValue('Cali')
      expect(screen.getByRole('radio', { name: 'Casa' })).toBeChecked()
      expect(ultimaConsulta()).toMatchObject({ ciudad: 'Cali', tipo: 'CASA', pagina: 1 })
    })
  })
})
