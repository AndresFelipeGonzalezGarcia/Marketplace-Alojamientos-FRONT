import { screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { listarPendientes, type PublicacionRevision } from '../../api/admin'
import { interpretarRespuestaError } from '../../api/errores'
import { renderizarApp } from '../../test/renderizarApp'
import { iniciarSesionDePrueba } from '../../test/sesion'

vi.mock('../../api/admin', async (importarOriginal) => ({
  ...(await importarOriginal<typeof import('../../api/admin')>()),
  listarPendientes: vi.fn(),
  obtenerPublicacionRevision: vi.fn(() => new Promise(() => {})),
}))
vi.mock('../../api/catalogos', () => ({
  listarPoliticasCancelacion: vi.fn(() => new Promise(() => {})),
  listarServicios: vi.fn(() => new Promise(() => {})),
}))
vi.mock('../../api/configuracion', () => ({
  obtenerTarifaServicio: vi.fn(() => new Promise(() => {})),
  actualizarTarifaServicio: vi.fn(),
}))

const listar = vi.mocked(listarPendientes)

function fila(cambios: Partial<PublicacionRevision>): PublicacionRevision {
  return {
    id: 'p-1',
    titulo: 'Cabaña en Guatapé',
    ciudad: 'Guatapé',
    tipo: 'CABANA',
    capacidad: 5,
    precioNoche: 320000,
    estado: 'PENDIENTE_REVISION',
    anfitrionId: 'a-1',
    anfitrionNombre: 'Carlos Mejía',
    fechaEnvio: '2026-11-12T15:00:00Z',
    imagenPortada: 'http://fotos.prueba/cabana.jpg',
    ...cambios,
  }
}

async function errorDelServidor(cuerpo: object, status: number) {
  return {
    estado: 'error' as const,
    error: await interpretarRespuestaError(
      new Response(JSON.stringify(cuerpo), { status }),
    ),
  }
}

const lista = () => screen.getByRole('list', { name: 'Publicaciones por revisar' })

// Sección de la bandeja
async function seccionBandeja(titulo: string) {
  const encabezado = await screen.findByRole('heading', { name: titulo })
  return within(encabezado.closest('section') as HTMLElement)
}

beforeEach(() => {
  iniciarSesionDePrueba('ADMINISTRADOR')
  listar.mockReset()
})

describe('bandeja de aprobación', () => {
  it('muestra el estado de carga mientras consulta', () => {
    listar.mockReturnValue(new Promise(() => {}))
    renderizarApp('/admin')

    // Carga de la tarifa
    expect(
      screen.getByText('Cargando publicaciones pendientes…'),
    ).toHaveAttribute('role', 'status')
    expect(
      screen.getByRole('heading', { name: 'Publicaciones pendientes' }),
    ).toBeInTheDocument()
  })

  it('lista de la más antigua a la más reciente con los datos de cada fila', async () => {
    // Publicaciones desordenadas
    listar.mockResolvedValue({
      estado: 'ok',
      datos: [
        fila({
          id: 'p-3',
          titulo: 'Habitación cerca a la UPB',
          ciudad: 'Medellín',
          tipo: 'HABITACION',
          capacidad: 1,
          precioNoche: 95000,
          anfitrionNombre: 'Sofía Patiño',
          fechaEnvio: '2026-11-17T21:00:00Z',
          imagenPortada: null,
        }),
        fila({}),
        fila({
          id: 'p-2',
          titulo: 'Apartamento en Chapinero',
          anfitrionNombre: 'Laura Ríos',
          fechaEnvio: '2026-11-15T18:00:00Z',
        }),
      ],
    })
    renderizarApp('/admin')

    await screen.findByRole('list', { name: 'Publicaciones por revisar' })
    const filas = within(lista()).getAllByRole('listitem')
    expect(
      filas.map((item) => within(item).getByRole('heading').textContent),
    ).toEqual([
      'Cabaña en Guatapé',
      'Apartamento en Chapinero',
      'Habitación cerca a la UPB',
    ])
    expect(screen.getByText('3 por revisar')).toBeInTheDocument()

    const primera = filas[0]
    expect(within(primera).getByRole('link', { name: 'Cabaña en Guatapé' })).toHaveAttribute(
      'href',
      '/admin/publicaciones/p-1',
    )
    expect(primera).toHaveTextContent('Guatapé')
    expect(primera).toHaveTextContent('Cabaña')
    expect(primera).toHaveTextContent('5 huéspedes')
    expect(primera).toHaveTextContent(/\$\s?320\.000/)
    expect(primera).toHaveTextContent('/ noche')
    expect(primera).toHaveTextContent('Anfitrión: Carlos Mejía')
    // Hora de Bogotá
    const envio = within(primera).getByText(/12 de nov de 2026/)
    expect(envio).toHaveAttribute('datetime', '2026-11-12T15:00:00Z')
    expect(envio).toHaveTextContent(/10:00/)
    expect(primera.querySelector('img')).toHaveAttribute(
      'src',
      'http://fotos.prueba/cabana.jpg',
    )

    const tercera = filas[2]
    expect(tercera).toHaveTextContent('1 huésped')
    expect(tercera).toHaveTextContent('Habitación')
    expect(within(tercera).getByText('Sin portada')).toBeInTheDocument()
  })

  it('al abrir una fila muestra su detalle', async () => {
    listar.mockResolvedValue({ estado: 'ok', datos: [fila({})] })
    const { router, usuario } = renderizarApp('/admin')

    await usuario.click(
      await screen.findByRole('link', { name: 'Cabaña en Guatapé' }),
    )

    expect(router.state.location.pathname).toBe('/admin/publicaciones/p-1')
    expect(await screen.findByText('Cargando publicación…')).toBeInTheDocument()
  })

  it('sin pendientes muestra el estado vacío', async () => {
    listar.mockResolvedValue({ estado: 'ok', datos: [] })
    renderizarApp('/admin')

    expect(
      await screen.findByRole('heading', { name: 'No hay publicaciones por revisar' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('list', { name: 'Publicaciones por revisar' }),
    ).not.toBeInTheDocument()
  })

  it('si falla la consulta permite reintentar', async () => {
    listar.mockResolvedValueOnce(
      await errorDelServidor(
        { codigo: 'ERROR_INTERNO', mensaje: 'x', correlationId: 'ref-1' },
        500,
      ),
    )
    listar.mockResolvedValueOnce({ estado: 'ok', datos: [fila({})] })
    const { usuario } = renderizarApp('/admin')

    const bandeja = await seccionBandeja(
      'No pudimos cargar las publicaciones pendientes',
    )
    expect(bandeja.getByText(/Código de referencia: ref-1/)).toBeInTheDocument()

    await usuario.click(bandeja.getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByRole('link', { name: 'Cabaña en Guatapé' })).toBeInTheDocument()
    expect(listar).toHaveBeenCalledTimes(2)
  })

  it('un 403 se muestra como acceso denegado', async () => {
    listar.mockResolvedValue(
      await errorDelServidor({ codigo: 'ACCESO_DENEGADO', mensaje: 'x' }, 403),
    )
    renderizarApp('/admin')

    const bandeja = await seccionBandeja('Acceso denegado')
    expect(bandeja.getByText(/no tiene permiso/)).toBeInTheDocument()
    expect(bandeja.queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument()
  })

  it('tras una decisión anuncia el resultado y no muestra esa publicación', async () => {
    listar.mockResolvedValue({
      estado: 'ok',
      // Publicación ya decidida
      datos: [fila({}), fila({ id: 'p-2', titulo: 'Otra' })],
    })
    renderizarApp({
      pathname: '/admin',
      state: {
        resultado: { id: 'p-1', titulo: 'Cabaña en Guatapé', decision: 'aprobada' },
      },
    })

    expect(screen.getByText(/ya está activa y visible/).closest('[role="status"]')).toHaveTextContent(
      '«Cabaña en Guatapé» ya está activa y visible para los huéspedes.',
    )
    await screen.findByRole('link', { name: 'Otra' })
    expect(
      screen.queryByRole('link', { name: 'Cabaña en Guatapé' }),
    ).not.toBeInTheDocument()
  })

  it.each(['HUESPED', 'ANFITRION'] as const)('niega la bandeja a %s', (rol) => {
    iniciarSesionDePrueba(rol)
    renderizarApp('/admin')

    expect(screen.getByRole('heading', { name: 'Acceso denegado' })).toBeInTheDocument()
    expect(listar).not.toHaveBeenCalled()
  })
})
