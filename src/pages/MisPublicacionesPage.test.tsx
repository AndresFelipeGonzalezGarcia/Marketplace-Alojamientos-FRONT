import { screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { interpretarRespuestaError } from '../api/errores'
import {
  listarPublicaciones,
  obtenerPublicacion,
  type PublicacionResumen,
} from '../api/publicaciones'
import { renderizarApp } from '../test/renderizarApp'
import { iniciarSesionDePrueba } from '../test/sesion'

vi.mock('../api/publicaciones', async (importarOriginal) => ({
  ...(await importarOriginal<typeof import('../api/publicaciones')>()),
  listarPublicaciones: vi.fn(),
  obtenerPublicacion: vi.fn(() => new Promise(() => {})),
}))
vi.mock('../api/catalogos', () => ({
  listarPoliticasCancelacion: vi.fn(() => new Promise(() => {})),
  listarServicios: vi.fn(() => new Promise(() => {})),
}))
vi.mock('../api/periodos', async (importarOriginal) => ({
  ...(await importarOriginal<typeof import('../api/periodos')>()),
  listarPeriodos: vi.fn(() => new Promise(() => {})),
}))

const listar = vi.mocked(listarPublicaciones)

function publicacion(cambios: Partial<PublicacionResumen>): PublicacionResumen {
  return {
    id: 'p-1',
    titulo: 'Cabaña en Guatapé',
    ciudad: 'Guatapé',
    estado: 'ACTIVA',
    capacidad: 5,
    precioNoche: 320000,
    ...cambios,
  }
}

async function errorDelServidor() {
  return {
    estado: 'error' as const,
    error: await interpretarRespuestaError(
      new Response(
        JSON.stringify({ codigo: 'ERROR_INTERNO', mensaje: 'x', correlationId: 'ref-1' }),
        { status: 500 },
      ),
    ),
  }
}

const lista = () => screen.getByRole('list', { name: 'Tus publicaciones' })
const filas = () => within(lista()).getAllByRole('listitem')

// Sección del mensaje
async function seccionMensaje(titulo: string) {
  const encabezado = await screen.findByRole('heading', { name: titulo })
  return within(encabezado.closest('section') as HTMLElement)
}

beforeEach(() => {
  iniciarSesionDePrueba('ANFITRION')
  listar.mockReset()
})

describe('mis publicaciones', () => {
  it('muestra el estado de carga mientras consulta', () => {
    listar.mockReturnValue(new Promise(() => {}))
    renderizarApp('/publicaciones')

    expect(screen.getByText('Cargando tus publicaciones…')).toHaveAttribute(
      'role',
      'status',
    )
    expect(
      screen.getByRole('heading', { level: 1, name: 'Mis publicaciones' }),
    ).toBeInTheDocument()
  })

  it('lista las publicaciones con sus datos', async () => {
    listar.mockResolvedValue({
      estado: 'ok',
      datos: [
        publicacion({}),
        publicacion({
          id: 'p-2',
          titulo: 'Habitación cerca a la UPB',
          ciudad: 'Medellín',
          estado: 'BORRADOR',
          capacidad: 1,
          precioNoche: 95000,
        }),
      ],
    })
    renderizarApp('/publicaciones')

    await screen.findByRole('list', { name: 'Tus publicaciones' })
    expect(
      filas().map((fila) => within(fila).getByRole('heading').textContent),
    ).toEqual(['Cabaña en Guatapé', 'Habitación cerca a la UPB'])
    expect(screen.getByText('2 publicaciones')).toBeInTheDocument()

    const [primera, segunda] = filas()
    expect(primera).toHaveTextContent('Guatapé')
    expect(primera).toHaveTextContent('5 huéspedes')
    expect(primera).toHaveTextContent(/\$\s?320\.000/)
    expect(primera).toHaveTextContent('/ noche')
    expect(primera).toHaveTextContent('Estado: Activa')
    expect(segunda).toHaveTextContent('Medellín')
    expect(segunda).toHaveTextContent('1 huésped')
    expect(segunda).toHaveTextContent('Estado: Borrador')
  })

  it('los enlaces de cada fila apuntan a editar y disponibilidad', async () => {
    listar.mockResolvedValue({
      estado: 'ok',
      datos: [publicacion({}), publicacion({ id: 'p 2', titulo: 'Otra' })],
    })
    renderizarApp('/publicaciones')

    await screen.findByRole('list', { name: 'Tus publicaciones' })
    const [primera, segunda] = filas()

    expect(
      within(primera).getByRole('link', { name: 'Editar Cabaña en Guatapé' }),
    ).toHaveAttribute('href', '/publicaciones/p-1/editar')
    expect(
      within(primera).getByRole('link', {
        name: 'Disponibilidad de Cabaña en Guatapé',
      }),
    ).toHaveAttribute('href', '/publicaciones/p-1/disponibilidad')
    expect(within(segunda).getByRole('link', { name: 'Editar Otra' })).toHaveAttribute(
      'href',
      '/publicaciones/p%202/editar',
    )
    expect(
      within(segunda).getByRole('link', { name: 'Disponibilidad de Otra' }),
    ).toHaveAttribute('href', '/publicaciones/p%202/disponibilidad')
  })

  it('al abrir Editar navega al formulario', async () => {
    listar.mockResolvedValue({ estado: 'ok', datos: [publicacion({})] })
    const { router, usuario } = renderizarApp('/publicaciones')

    await usuario.click(
      await screen.findByRole('link', { name: 'Editar Cabaña en Guatapé' }),
    )

    expect(router.state.location.pathname).toBe('/publicaciones/p-1/editar')
    expect(obtenerPublicacion).toHaveBeenCalledWith('p-1')
  })

  it('sin publicaciones invita a crear la primera', async () => {
    listar.mockResolvedValue({ estado: 'ok', datos: [] })
    renderizarApp('/publicaciones')

    const vacio = await seccionMensaje('Aún no tienes publicaciones')
    expect(
      vacio.getByRole('link', { name: 'Crear mi primera publicación' }),
    ).toHaveAttribute('href', '/publicaciones/nueva')
    expect(
      screen.queryByRole('list', { name: 'Tus publicaciones' }),
    ).not.toBeInTheDocument()
  })

  it('si falla la consulta permite reintentar', async () => {
    listar.mockResolvedValueOnce(await errorDelServidor())
    listar.mockResolvedValueOnce({ estado: 'ok', datos: [publicacion({})] })
    const { usuario } = renderizarApp('/publicaciones')

    const error = await seccionMensaje('No pudimos cargar tus publicaciones')
    expect(error.getByText(/Código de referencia: ref-1/)).toBeInTheDocument()

    await usuario.click(error.getByRole('button', { name: 'Reintentar' }))

    expect(
      await screen.findByRole('heading', { name: 'Cabaña en Guatapé' }),
    ).toBeInTheDocument()
    expect(listar).toHaveBeenCalledTimes(2)
  })

  it.each(['HUESPED', 'ADMINISTRADOR'] as const)('niega la pantalla a %s', (rol) => {
    iniciarSesionDePrueba(rol)
    renderizarApp('/publicaciones')

    expect(screen.getByRole('heading', { name: 'Acceso denegado' })).toBeInTheDocument()
    expect(listar).not.toHaveBeenCalled()
  })
})
