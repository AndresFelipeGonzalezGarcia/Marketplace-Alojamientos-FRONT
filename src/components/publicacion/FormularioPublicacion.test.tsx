import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  actualizarPublicacion,
  crearPublicacion,
  obtenerPublicacion,
  type Publicacion,
  type ResultadoPublicacion,
} from '../../api/publicaciones'
import { routes } from '../../routes'

vi.mock('../../api/publicaciones', async (importarOriginal) => ({
  ...(await importarOriginal<typeof import('../../api/publicaciones')>()),
  crearPublicacion: vi.fn(),
  obtenerPublicacion: vi.fn(),
  actualizarPublicacion: vi.fn(),
}))

const crear = vi.mocked(crearPublicacion)
const obtener = vi.mocked(obtenerPublicacion)
const actualizar = vi.mocked(actualizarPublicacion)

const existente: Publicacion = {
  id: '7',
  estado: 'BORRADOR',
  titulo: 'Casa de campo',
  descripcion: 'Con vista',
  ciudad: 'Medellín',
  ubicacion: 'El Poblado',
  tipo: 'Casa',
  capacidad: 4,
  precioNoche: 200000,
  servicios: ['Cocina'],
  reglas: 'No fumar',
  imagenes: ['/fotos/1.jpg'],
}

function renderEn(ruta: string) {
  const router = createMemoryRouter(routes, { initialEntries: [ruta] })
  render(<RouterProvider router={router} />)
  return userEvent.setup()
}

const campo = {
  titulo: () => screen.getByLabelText('Título'),
  descripcion: () => screen.getByLabelText('Descripción'),
  capacidad: () => screen.getByLabelText('Capacidad'),
  precio: () => screen.getByLabelText('Precio por noche (COP)'),
}

function botonGuardar() {
  return screen.getByRole('button', { name: 'Guardar borrador' })
}

function requisito(texto: string) {
  return screen.getByText(texto).closest('li') as HTMLElement
}

describe('crear publicación', () => {
  beforeEach(() => {
    crear.mockReset()
    obtener.mockReset()
    actualizar.mockReset()
  })

  it('crea con campos válidos y queda en BORRADOR', async () => {
    crear.mockResolvedValue({ estado: 'ok', publicacion: existente })
    obtener.mockResolvedValue({ estado: 'ok', publicacion: existente })
    const usuario = renderEn('/publicaciones/nueva')

    await usuario.type(campo.titulo(), ' Casa de campo ')
    await usuario.type(screen.getByLabelText('Ciudad'), 'Medellín')
    await usuario.selectOptions(screen.getByLabelText('Tipo'), 'Cabaña')
    await usuario.type(campo.capacidad(), '4')
    await usuario.type(campo.precio(), '200000')
    await usuario.click(screen.getByRole('button', { name: 'Wi-Fi' }))
    await usuario.click(screen.getByRole('button', { name: '+ Agregar foto' }))
    await usuario.type(
      screen.getByLabelText('Ruta o URL de la foto 1'),
      '/fotos/1.jpg',
    )
    await usuario.click(botonGuardar())

    expect(crear).toHaveBeenCalledExactlyOnceWith({
      titulo: 'Casa de campo',
      descripcion: '',
      ciudad: 'Medellín',
      ubicacion: '',
      tipo: 'Cabaña',
      capacidad: 4,
      precioNoche: 200000,
      servicios: ['Wi-Fi'],
      reglas: '',
      imagenes: ['/fotos/1.jpg'],
    })
    expect(
      await screen.findByRole('heading', { name: 'Editar publicación' }),
    ).toBeInTheDocument()
    expect(screen.getByText('BORRADOR')).toBeInTheDocument()
    expect(screen.getByText('Borrador guardado')).toBeInTheDocument()
  })

  it('ofrece solo los cuatro tipos acordados', () => {
    renderEn('/publicaciones/nueva')

    const opciones = within(screen.getByLabelText('Tipo'))
      .getAllByRole('option')
      .map((opcion) => opcion.textContent)
    expect(opciones).toEqual([
      'Selecciona una opción',
      'Apartamento',
      'Casa',
      'Habitación',
      'Cabaña',
    ])
  })

  it('no guarda sin título', async () => {
    const usuario = renderEn('/publicaciones/nueva')

    await usuario.type(campo.capacidad(), '2')
    await usuario.click(botonGuardar())

    expect(
      screen.getByText('Ingresa el título de la publicación.'),
    ).toBeInTheDocument()
    expect(campo.titulo()).toHaveFocus()
    expect(crear).not.toHaveBeenCalled()
  })

  it('no acepta un título con solo espacios', async () => {
    const usuario = renderEn('/publicaciones/nueva')

    await usuario.type(campo.titulo(), '   ')
    await usuario.type(campo.capacidad(), '2')
    await usuario.click(botonGuardar())

    expect(
      screen.getByText('Ingresa el título de la publicación.'),
    ).toBeInTheDocument()
    expect(crear).not.toHaveBeenCalled()
  })

  it('no guarda con capacidad 0', async () => {
    const usuario = renderEn('/publicaciones/nueva')

    await usuario.type(campo.titulo(), 'Casa')
    await usuario.type(campo.capacidad(), '0')
    await usuario.click(botonGuardar())

    expect(
      screen.getByText('La capacidad debe ser un número entero mayor que 0.'),
    ).toBeInTheDocument()
    expect(crear).not.toHaveBeenCalled()
  })

  it('acepta capacidad 1 y deja vacíos los campos opcionales', async () => {
    crear.mockResolvedValue({ estado: 'ok', publicacion: existente })
    obtener.mockResolvedValue({ estado: 'ok', publicacion: existente })
    const usuario = renderEn('/publicaciones/nueva')

    await usuario.type(campo.titulo(), 'Casa')
    await usuario.type(campo.capacidad(), '1')
    await usuario.click(botonGuardar())

    expect(crear).toHaveBeenCalledWith(
      expect.objectContaining({ capacidad: 1, precioNoche: null }),
    )
  })

  it('rechaza un precio inválido si se llena', async () => {
    const usuario = renderEn('/publicaciones/nueva')

    await usuario.type(campo.titulo(), 'Casa')
    await usuario.type(campo.capacidad(), '2')
    await usuario.type(campo.precio(), '0')
    await usuario.click(botonGuardar())

    expect(
      screen.getByText('El precio debe ser un número entero mayor que 0.'),
    ).toBeInTheDocument()
    expect(crear).not.toHaveBeenCalled()
  })

  it('alterna chips y quita imágenes', async () => {
    const usuario = renderEn('/publicaciones/nueva')
    const chip = screen.getByRole('button', { name: 'Lavadora' })

    await usuario.click(chip)
    expect(chip).toHaveAttribute('aria-pressed', 'true')
    await usuario.click(chip)
    expect(chip).toHaveAttribute('aria-pressed', 'false')

    await usuario.click(screen.getByRole('button', { name: '+ Agregar foto' }))
    await usuario.click(screen.getByRole('button', { name: 'Quitar foto 1' }))
    expect(
      screen.queryByLabelText('Ruta o URL de la foto 1'),
    ).not.toBeInTheDocument()
  })

  it('deshabilita el botón mientras guarda', async () => {
    let responder: (resultado: ResultadoPublicacion) => void = () => {}
    crear.mockReturnValue(
      new Promise((resolver) => {
        responder = resolver
      }),
    )
    const usuario = renderEn('/publicaciones/nueva')

    await usuario.type(campo.titulo(), 'Casa')
    await usuario.type(campo.capacidad(), '2')
    await usuario.click(botonGuardar())

    expect(screen.getByRole('button', { name: 'Guardando…' })).toBeDisabled()

    responder({ estado: 'error' })
    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(botonGuardar()).toBeEnabled()
  })

  it('muestra los errores por campo que devuelve la API', async () => {
    crear.mockResolvedValue({
      estado: 'validacion',
      errores: { titulo: 'Título no permitido' },
    })
    const usuario = renderEn('/publicaciones/nueva')

    await usuario.type(campo.titulo(), 'Casa')
    await usuario.type(campo.capacidad(), '2')
    await usuario.click(botonGuardar())

    expect(await screen.findByText('Título no permitido')).toBeInTheDocument()
  })

  it('avisa si la sesión no es válida y conserva los datos', async () => {
    crear.mockResolvedValue({ estado: 'sesion_invalida' })
    const usuario = renderEn('/publicaciones/nueva')

    await usuario.type(campo.titulo(), 'Casa')
    await usuario.type(campo.capacidad(), '2')
    await usuario.click(botonGuardar())

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Tu sesión no es válida',
    )
    expect(campo.titulo()).toHaveValue('Casa')
  })

  it('deja visibles pero deshabilitados la sección 2 y Enviar a revisión', () => {
    renderEn('/publicaciones/nueva')

    expect(
      screen.getByRole('heading', { name: '2. Condiciones comerciales' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Política de cancelación')).toBeDisabled()
    expect(screen.getByLabelText('Tarifa de limpieza (COP)')).toBeDisabled()
    expect(
      screen.getByRole('radio', { name: /reserva inmediata/i }),
    ).toBeDisabled()
    expect(
      screen.getByRole('button', { name: 'Enviar a revisión' }),
    ).toBeDisabled()
  })
})

describe('panel Antes de enviar a revisión', () => {
  beforeEach(() => {
    obtener.mockReset()
  })

  it('cambia en vivo entre alerta y OK', async () => {
    const usuario = renderEn('/publicaciones/nueva')
    const noCumplido = 'Falta'

    expect(requisito('Título y descripción')).toHaveTextContent(noCumplido)
    expect(requisito('Precio por noche positivo')).toHaveTextContent(noCumplido)
    expect(requisito('Capacidad mayor que 0')).toHaveTextContent(noCumplido)

    await usuario.type(campo.titulo(), 'Casa')
    expect(requisito('Título y descripción')).toHaveTextContent(noCumplido)
    await usuario.type(campo.descripcion(), 'Linda')
    expect(requisito('Título y descripción')).toHaveTextContent('OK')

    await usuario.type(campo.precio(), '100')
    expect(requisito('Precio por noche positivo')).toHaveTextContent('OK')

    await usuario.type(campo.capacidad(), '0')
    expect(requisito('Capacidad mayor que 0')).toHaveTextContent(noCumplido)
    await usuario.clear(campo.capacidad())
    await usuario.type(campo.capacidad(), '3')
    expect(requisito('Capacidad mayor que 0')).toHaveTextContent('OK')

    await usuario.clear(campo.titulo())
    expect(requisito('Título y descripción')).toHaveTextContent(noCumplido)
  })

  it('deja Condiciones comerciales sin estado', async () => {
    const usuario = renderEn('/publicaciones/nueva')

    await usuario.type(campo.titulo(), 'Casa')

    const fila = requisito('Condiciones comerciales')
    expect(fila).not.toHaveTextContent('OK')
    expect(fila).not.toHaveTextContent('Falta')
    expect(fila).not.toHaveTextContent('!')
  })
})

describe('editar publicación', () => {
  beforeEach(() => {
    crear.mockReset()
    obtener.mockReset()
    actualizar.mockReset()
  })

  it('muestra el estado de carga y luego los datos existentes', async () => {
    obtener.mockResolvedValue({ estado: 'ok', publicacion: existente })
    renderEn('/publicaciones/7/editar')

    expect(screen.getByText('Cargando publicación…')).toBeInTheDocument()
    expect(await screen.findByLabelText('Título')).toHaveValue('Casa de campo')
    expect(obtener).toHaveBeenCalledWith('7')
    expect(campo.capacidad()).toHaveValue('4')
    expect(screen.getByLabelText('Tipo')).toHaveValue('Casa')
    expect(screen.getByRole('button', { name: 'Cocina' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByLabelText('Ruta o URL de la foto 1')).toHaveValue(
      '/fotos/1.jpg',
    )
    expect(requisito('Capacidad mayor que 0')).toHaveTextContent('OK')
    expect(screen.queryByText('Borrador guardado')).not.toBeInTheDocument()
  })

  it('enlaza a la disponibilidad solo en modo editar', async () => {
    obtener.mockResolvedValue({ estado: 'ok', publicacion: existente })
    renderEn('/publicaciones/7/editar')

    expect(
      await screen.findByRole('link', { name: 'Gestionar disponibilidad' }),
    ).toHaveAttribute('href', '/publicaciones/7/disponibilidad')
  })

  it('no muestra el enlace a disponibilidad al crear', () => {
    renderEn('/publicaciones/nueva')

    expect(
      screen.queryByRole('link', { name: 'Gestionar disponibilidad' }),
    ).not.toBeInTheDocument()
  })

  it('actualiza la publicación existente sin crear otra', async () => {
    obtener.mockResolvedValue({ estado: 'ok', publicacion: existente })
    actualizar.mockResolvedValue({ estado: 'ok', publicacion: existente })
    const usuario = renderEn('/publicaciones/7/editar')

    await screen.findByLabelText('Título')
    await usuario.type(campo.titulo(), ' nueva')
    await usuario.click(botonGuardar())

    expect(await screen.findByText('Borrador guardado')).toBeInTheDocument()
    expect(actualizar).toHaveBeenCalledWith(
      '7',
      expect.objectContaining({ titulo: 'Casa de campo nueva' }),
    )
    expect(crear).not.toHaveBeenCalled()
  })

  it('muestra Acceso denegado si la API responde 403 al cargar', async () => {
    obtener.mockResolvedValue({ estado: 'acceso_denegado' })
    renderEn('/publicaciones/7/editar')

    expect(
      await screen.findByRole('heading', { name: 'Acceso denegado' }),
    ).toBeInTheDocument()
    expect(screen.queryByLabelText('Título')).not.toBeInTheDocument()
  })

  it('muestra Acceso denegado si la API responde 403 al guardar', async () => {
    obtener.mockResolvedValue({ estado: 'ok', publicacion: existente })
    actualizar.mockResolvedValue({ estado: 'acceso_denegado' })
    const usuario = renderEn('/publicaciones/7/editar')

    await screen.findByLabelText('Título')
    await usuario.click(botonGuardar())

    expect(
      await screen.findByRole('heading', { name: 'Acceso denegado' }),
    ).toBeInTheDocument()
    expect(screen.queryByLabelText('Título')).not.toBeInTheDocument()
  })

  it('indica cuando la publicación no existe', async () => {
    obtener.mockResolvedValue({ estado: 'no_encontrada' })
    renderEn('/publicaciones/99/editar')

    expect(
      await screen.findByRole('heading', { name: 'Publicación no encontrada' }),
    ).toBeInTheDocument()
  })

  it('permite reintentar si falla la carga', async () => {
    obtener.mockResolvedValueOnce({ estado: 'error' })
    obtener.mockResolvedValueOnce({ estado: 'ok', publicacion: existente })
    const usuario = renderEn('/publicaciones/7/editar')

    await usuario.click(
      await screen.findByRole('button', { name: 'Reintentar' }),
    )

    expect(await screen.findByLabelText('Título')).toHaveValue('Casa de campo')
  })
})
