import { render, screen, within } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  listarPoliticasCancelacion,
  listarServicios,
} from '../../api/catalogos'
import type { ErrorApi } from '../../api/errores'
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
vi.mock('../../api/catalogos', () => ({
  listarPoliticasCancelacion: vi.fn(),
  listarServicios: vi.fn(),
}))

const crear = vi.mocked(crearPublicacion)
const obtener = vi.mocked(obtenerPublicacion)
const actualizar = vi.mocked(actualizarPublicacion)
const politicas = vi.mocked(listarPoliticasCancelacion)
const servicios = vi.mocked(listarServicios)

const existente: Publicacion = {
  id: '7',
  estado: 'BORRADOR',
  titulo: 'Casa de campo',
  descripcion: 'Con vista',
  ciudad: 'Medellín',
  ubicacionTextual: 'El Poblado',
  tipo: 'CABANA',
  capacidad: 4,
  imagenes: ['/fotos/1.jpg'],
  precioNoche: 200000.5,
  tarifaLimpieza: 0,
  politicaCancelacionId: 'pol-2',
  modoReserva: 'CON_APROBACION',
  reglas: 'No fumar',
  serviciosIds: ['s2'],
  serviciosAdicionales: [{ nombre: 'Desayuno', costo: 15000 }],
}

const ok: ResultadoPublicacion = { estado: 'ok', datos: existente }

const CUERPO_MINIMO = {
  politicaCancelacionId: 'pol-1',
  titulo: 'Casa',
  descripcion: 'Linda',
  ciudad: 'Bogotá',
  ubicacionTextual: 'Chapinero',
  tipo: 'HABITACION',
  capacidad: 2,
  precioNoche: 150,
  reglas: '',
  modoReserva: 'INMEDIATA',
  serviciosIds: [],
  serviciosAdicionales: [],
  imagenes: [],
}

function fallo(parcial: Partial<ErrorApi>): ResultadoPublicacion {
  return {
    estado: 'error',
    error: {
      codigo: 'ERROR_INTERNO',
      mensaje: 'Falló el servidor.',
      erroresPorCampo: {},
      ...parcial,
    },
  }
}

function renderEn(ruta: string) {
  const router = createMemoryRouter(routes, { initialEntries: [ruta] })
  render(<RouterProvider router={router} />)
  return userEvent.setup()
}

const ETIQUETAS = {
  titulo: 'Título',
  descripcion: 'Descripción',
  ciudad: 'Ciudad',
  ubicacion: 'Ubicación (texto)',
  capacidad: 'Capacidad',
  precio: 'Precio por noche (COP)',
  tarifa: 'Tarifa de limpieza (COP, opcional)',
  reglas: 'Reglas de la casa (opcional)',
}

const campo = {
  titulo: () => screen.getByLabelText(ETIQUETAS.titulo),
  descripcion: () => screen.getByLabelText(ETIQUETAS.descripcion),
  capacidad: () => screen.getByLabelText(ETIQUETAS.capacidad),
  precio: () => screen.getByLabelText(ETIQUETAS.precio),
  tarifa: () => screen.getByLabelText(ETIQUETAS.tarifa),
  reglas: () => screen.getByLabelText(ETIQUETAS.reglas),
}

async function escribir(usuario: UserEvent, etiqueta: string, texto: string) {
  await usuario.click(screen.getByLabelText(etiqueta))
  await usuario.paste(texto)
}

interface Omisiones {
  titulo?: string
  capacidad?: string
  precio?: string
}

async function llenarObligatorios(
  usuario: UserEvent,
  { titulo = 'Casa', capacidad = '2', precio = '150' }: Omisiones = {},
) {
  await escribir(usuario, ETIQUETAS.titulo, titulo)
  await escribir(usuario, ETIQUETAS.descripcion, 'Linda')
  await escribir(usuario, ETIQUETAS.ciudad, 'Bogotá')
  await escribir(usuario, ETIQUETAS.ubicacion, 'Chapinero')
  await usuario.selectOptions(screen.getByLabelText('Tipo'), 'Habitación')
  await escribir(usuario, ETIQUETAS.capacidad, capacidad)
  await escribir(usuario, ETIQUETAS.precio, precio)
  await usuario.selectOptions(
    await screen.findByLabelText('Política de cancelación'),
    'Flexible',
  )
  await usuario.click(screen.getByRole('radio', { name: /reserva inmediata/i }))
}

function botonGuardar() {
  return screen.getByRole('button', { name: 'Guardar borrador' })
}

function botonAgregarServicio() {
  return screen.getByRole('button', { name: '+ Agregar servicio' })
}

function botonAgregarFoto() {
  return screen.getByRole('button', { name: '+ Agregar foto' })
}

function requisito(texto: string) {
  return screen.getByText(texto).closest('li') as HTMLElement
}

beforeEach(() => {
  crear.mockReset()
  obtener.mockReset()
  actualizar.mockReset()
  politicas.mockReset()
  servicios.mockReset()
  crear.mockResolvedValue(ok)
  obtener.mockResolvedValue(ok)
  actualizar.mockResolvedValue(ok)
  politicas.mockResolvedValue({
    estado: 'ok',
    datos: [
      { id: 'pol-1', nombre: 'Flexible' },
      { id: 'pol-2', nombre: 'Estricta' },
    ],
  })
  servicios.mockResolvedValue({
    estado: 'ok',
    datos: [
      { id: 's1', nombre: 'Wi-Fi' },
      { id: 's2', nombre: 'Cocina' },
    ],
  })
})

describe('crear publicación', () => {
  it('envía todos los campos y queda en BORRADOR', async () => {
    const usuario = renderEn('/publicaciones/nueva')

    await llenarObligatorios(usuario, { precio: '200000,50' })
    await usuario.selectOptions(screen.getByLabelText('Tipo'), 'Cabaña')
    await escribir(usuario, ETIQUETAS.tarifa, '0')
    await usuario.click(await screen.findByRole('checkbox', { name: 'Wi-Fi' }))
    await escribir(usuario, ETIQUETAS.reglas, ' No fumar ')
    await usuario.click(botonAgregarServicio())
    await escribir(usuario, 'Nombre del servicio 1', 'Desayuno')
    await escribir(usuario, 'Costo del servicio 1 (COP)', '15000')
    await usuario.click(botonAgregarFoto())
    await escribir(usuario, 'Ruta o URL de la foto 1', 'https://a.co/1.jpg')
    await usuario.click(botonGuardar())

    expect(crear).toHaveBeenCalledExactlyOnceWith({
      ...CUERPO_MINIMO,
      tipo: 'CABANA',
      precioNoche: 200000.5,
      tarifaLimpieza: 0,
      reglas: 'No fumar',
      serviciosIds: ['s1'],
      serviciosAdicionales: [{ nombre: 'Desayuno', costo: 15000 }],
      imagenes: ['https://a.co/1.jpg'],
    })
    expect(
      await screen.findByRole('heading', { name: 'Editar publicación' }),
    ).toBeInTheDocument()
    expect(screen.getByText('BORRADOR')).toBeInTheDocument()
    expect(screen.getByText('Borrador guardado')).toBeInTheDocument()
  })

  it('guarda solo con los obligatorios y omite la tarifa vacía', async () => {
    const usuario = renderEn('/publicaciones/nueva')

    await llenarObligatorios(usuario)
    await usuario.click(botonGuardar())

    expect(crear).toHaveBeenCalledExactlyOnceWith(CUERPO_MINIMO)
    expect(crear.mock.calls[0][0]).not.toHaveProperty('tarifaLimpieza')
  })

  it('muestra etiquetas legibles para los valores del enum', () => {
    renderEn('/publicaciones/nueva')

    const opciones = within(screen.getByLabelText('Tipo')).getAllByRole(
      'option',
    ) as HTMLOptionElement[]
    expect(opciones.map((opcion) => [opcion.value, opcion.textContent])).toEqual([
      ['', 'Selecciona una opción'],
      ['APARTAMENTO', 'Apartamento'],
      ['CASA', 'Casa'],
      ['HABITACION', 'Habitación'],
      ['CABANA', 'Cabaña'],
    ])
  })

  it('exige todos los campos obligatorios', async () => {
    const usuario = renderEn('/publicaciones/nueva')
    await screen.findByLabelText('Política de cancelación')

    await usuario.click(botonGuardar())

    for (const mensaje of [
      'Ingresa el título de la publicación.',
      'Ingresa la descripción.',
      'Ingresa la ciudad.',
      'Ingresa la ubicación.',
      'Selecciona el tipo de alojamiento.',
      'La capacidad debe ser un número entero mayor que 0.',
      'Ingresa el precio por noche.',
      'Selecciona una política de cancelación.',
      'Selecciona el modo de reserva.',
    ]) {
      expect(screen.getByText(mensaje)).toBeInTheDocument()
    }
    expect(campo.titulo()).toHaveFocus()
    expect(crear).not.toHaveBeenCalled()
  })

  it('no acepta un título con solo espacios', async () => {
    const usuario = renderEn('/publicaciones/nueva')

    await llenarObligatorios(usuario, { titulo: '   ' })
    await usuario.click(botonGuardar())

    expect(
      screen.getByText('Ingresa el título de la publicación.'),
    ).toBeInTheDocument()
    expect(crear).not.toHaveBeenCalled()
  })

  it('no guarda con capacidad 0', async () => {
    const usuario = renderEn('/publicaciones/nueva')

    await llenarObligatorios(usuario, { capacidad: '0' })
    await usuario.click(botonGuardar())

    expect(
      screen.getByText('La capacidad debe ser un número entero mayor que 0.'),
    ).toBeInTheDocument()
    expect(crear).not.toHaveBeenCalled()
  })

  it('acepta capacidad 1', async () => {
    const usuario = renderEn('/publicaciones/nueva')

    await llenarObligatorios(usuario, { capacidad: '1' })
    await usuario.click(botonGuardar())

    expect(crear).toHaveBeenCalledWith(
      expect.objectContaining({ capacidad: 1 }),
    )
  })

  it.each([
    [ETIQUETAS.titulo, 150, 'El título admite máximo 150 caracteres.'],
    [ETIQUETAS.ciudad, 80, 'La ciudad admite máximo 80 caracteres.'],
    [ETIQUETAS.ubicacion, 255, 'La ubicación admite máximo 255 caracteres.'],
  ])('limita %s a %i caracteres', async (etiqueta, maximo, mensaje) => {
    const usuario = renderEn('/publicaciones/nueva')

    await llenarObligatorios(usuario)
    await usuario.clear(screen.getByLabelText(etiqueta))
    await escribir(usuario, etiqueta, 'x'.repeat(maximo + 1))
    await usuario.click(botonGuardar())

    expect(screen.getByText(mensaje)).toBeInTheDocument()
    expect(crear).not.toHaveBeenCalled()

    await usuario.clear(screen.getByLabelText(etiqueta))
    await escribir(usuario, etiqueta, 'x'.repeat(maximo))
    await usuario.click(botonGuardar())

    expect(crear).toHaveBeenCalledTimes(1)
  })

  it('deshabilita el botón mientras guarda', async () => {
    let responder: (resultado: ResultadoPublicacion) => void = () => {}
    crear.mockReturnValue(
      new Promise((resolver) => {
        responder = resolver
      }),
    )
    const usuario = renderEn('/publicaciones/nueva')

    await llenarObligatorios(usuario)
    await usuario.click(botonGuardar())

    expect(screen.getByRole('button', { name: 'Guardando…' })).toBeDisabled()

    responder(fallo({}))
    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(botonGuardar()).toBeEnabled()
  })

  it('avisa si la sesión no es válida y conserva los datos', async () => {
    crear.mockResolvedValue(
      fallo({
        codigo: 'NO_AUTENTICADO',
        mensaje: 'Tu sesión no es válida. Inicia sesión de nuevo.',
      }),
    )
    const usuario = renderEn('/publicaciones/nueva')

    await llenarObligatorios(usuario)
    await usuario.click(botonGuardar())

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Tu sesión no es válida',
    )
    expect(campo.titulo()).toHaveValue('Casa')
  })

  it('mantiene deshabilitado Enviar a revisión', () => {
    renderEn('/publicaciones/nueva')

    expect(
      screen.getByRole('button', { name: 'Enviar a revisión' }),
    ).toBeDisabled()
  })
})

describe('imágenes', () => {
  it('quita filas y descarta las vacías al guardar', async () => {
    const usuario = renderEn('/publicaciones/nueva')

    await llenarObligatorios(usuario)
    await usuario.click(botonAgregarFoto())
    await usuario.click(botonAgregarFoto())
    await usuario.click(screen.getByRole('button', { name: 'Quitar foto 2' }))
    expect(
      screen.queryByLabelText('Ruta o URL de la foto 2'),
    ).not.toBeInTheDocument()
    await usuario.click(botonGuardar())

    expect(crear).toHaveBeenCalledWith(
      expect.objectContaining({ imagenes: [] }),
    )
  })

  it('no permite más de 15 imágenes', async () => {
    const usuario = renderEn('/publicaciones/nueva')

    for (let vez = 0; vez < 15; vez += 1) {
      await usuario.click(botonAgregarFoto())
    }

    expect(screen.getByLabelText('Ruta o URL de la foto 15')).toBeInTheDocument()
    expect(botonAgregarFoto()).toBeDisabled()
  })

  it('rechaza guardar una publicación cargada con más de 15 imágenes', async () => {
    obtener.mockResolvedValue({
      estado: 'ok',
      datos: {
        ...existente,
        imagenes: Array.from({ length: 16 }, (_, i) => `/fotos/${i}.jpg`),
      },
    })
    const usuario = renderEn('/publicaciones/7/editar')
    await screen.findByLabelText(ETIQUETAS.titulo)

    await usuario.click(botonGuardar())

    expect(
      screen.getByText('Puedes agregar máximo 15 imágenes.'),
    ).toBeInTheDocument()
    expect(actualizar).not.toHaveBeenCalled()
  })

  it('limita cada ruta a 500 caracteres', async () => {
    const usuario = renderEn('/publicaciones/nueva')

    await llenarObligatorios(usuario)
    await usuario.click(botonAgregarFoto())
    await escribir(usuario, 'Ruta o URL de la foto 1', 'x'.repeat(501))
    await usuario.click(botonGuardar())

    expect(
      screen.getByText('La ruta o URL admite máximo 500 caracteres.'),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Ruta o URL de la foto 1')).toHaveFocus()
    expect(crear).not.toHaveBeenCalled()
  })
})

describe('condiciones comerciales', () => {
  it('habilita la sección y carga los catálogos', async () => {
    renderEn('/publicaciones/nueva')

    expect(
      screen.getByRole('heading', { name: '2. Condiciones comerciales' }),
    ).toBeInTheDocument()
    expect(screen.getAllByText('Cargando opciones…')).toHaveLength(2)

    const selector = await screen.findByLabelText('Política de cancelación')
    expect(selector).toBeEnabled()
    expect(
      within(selector)
        .getAllByRole('option')
        .map((opcion) => opcion.textContent),
    ).toEqual(['Selecciona una opción', 'Flexible', 'Estricta'])
    expect(
      await screen.findByRole('checkbox', { name: 'Cocina' }),
    ).toBeEnabled()
  })

  it('indica cuando un catálogo está vacío', async () => {
    politicas.mockResolvedValue({ estado: 'ok', datos: [] })
    renderEn('/publicaciones/nueva')

    expect(
      await screen.findByText('No hay políticas de cancelación disponibles.'),
    ).toBeInTheDocument()
  })

  it('permite reintentar si falla un catálogo y mantiene el formulario', async () => {
    servicios.mockResolvedValueOnce({
      estado: 'error',
      error: {
        codigo: 'ERROR_INTERNO',
        mensaje: 'Falló el servidor.',
        erroresPorCampo: {},
      },
    })
    const usuario = renderEn('/publicaciones/nueva')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Falló el servidor.',
    )
    expect(campo.titulo()).toBeEnabled()

    await usuario.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(
      await screen.findByRole('checkbox', { name: 'Wi-Fi' }),
    ).toBeInTheDocument()
  })

  it('explica por qué no guarda si no cargaron las políticas', async () => {
    politicas.mockResolvedValue({ estado: 'ok', datos: [] })
    const usuario = renderEn('/publicaciones/nueva')
    await screen.findByText('No hay políticas de cancelación disponibles.')

    await usuario.click(botonGuardar())

    expect(
      screen.getByText('Selecciona una política de cancelación.'),
    ).toBeInTheDocument()
    expect(crear).not.toHaveBeenCalled()
  })

  it.each([
    ['0', 'cero'],
    ['-5', 'negativo'],
    ['10.123', 'con 3 decimales'],
    ['200.000', 'con punto de miles'],
    ['abc', 'no numérico'],
  ])('rechaza el precio %s (%s)', async (precio) => {
    const usuario = renderEn('/publicaciones/nueva')

    await llenarObligatorios(usuario, { precio })
    await usuario.click(botonGuardar())

    expect(
      screen.getByText(
        'El precio debe ser mayor que 0 y tener máximo 2 decimales.',
      ),
    ).toBeInTheDocument()
    expect(crear).not.toHaveBeenCalled()
  })

  it.each(['0.01', '150', '99,5'])('acepta el precio %s', async (precio) => {
    const usuario = renderEn('/publicaciones/nueva')

    await llenarObligatorios(usuario, { precio })
    await usuario.click(botonGuardar())

    expect(crear).toHaveBeenCalledWith(
      expect.objectContaining({
        precioNoche: Number(precio.replace(',', '.')),
      }),
    )
  })

  it('rechaza una tarifa negativa', async () => {
    const usuario = renderEn('/publicaciones/nueva')

    await llenarObligatorios(usuario)
    await escribir(usuario, ETIQUETAS.tarifa, '-1')
    await usuario.click(botonGuardar())

    expect(
      screen.getByText(
        'La tarifa de limpieza debe ser 0 o mayor, con máximo 2 decimales.',
      ),
    ).toBeInTheDocument()
    expect(crear).not.toHaveBeenCalled()
  })

  it('limita las reglas a 4000 caracteres', async () => {
    const usuario = renderEn('/publicaciones/nueva')

    await llenarObligatorios(usuario)
    await escribir(usuario, ETIQUETAS.reglas, 'x'.repeat(4001))
    await usuario.click(botonGuardar())

    expect(
      screen.getByText('Las reglas admiten máximo 4000 caracteres.'),
    ).toBeInTheDocument()
    expect(crear).not.toHaveBeenCalled()
  })

  it('valida nombre y costo de cada servicio adicional', async () => {
    const usuario = renderEn('/publicaciones/nueva')

    await llenarObligatorios(usuario)
    await usuario.click(botonAgregarServicio())
    await escribir(usuario, 'Nombre del servicio 1', 'x'.repeat(81))
    await usuario.click(botonGuardar())

    expect(
      screen.getByText('El nombre admite máximo 80 caracteres.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'El costo debe ser 0 o mayor, con hasta 10 enteros y 2 decimales.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Nombre del servicio 1')).toHaveFocus()
    expect(crear).not.toHaveBeenCalled()
  })

  it('rechaza un costo de más de 10 enteros', async () => {
    const usuario = renderEn('/publicaciones/nueva')

    await llenarObligatorios(usuario)
    await usuario.click(botonAgregarServicio())
    await escribir(usuario, 'Nombre del servicio 1', 'Desayuno')
    await escribir(usuario, 'Costo del servicio 1 (COP)', '12345678901')
    await usuario.click(botonGuardar())

    expect(
      screen.getByText(
        'El costo debe ser 0 o mayor, con hasta 10 enteros y 2 decimales.',
      ),
    ).toBeInTheDocument()
    expect(crear).not.toHaveBeenCalled()
  })

  it('exige nombre si el servicio tiene costo y acepta costo 0', async () => {
    const usuario = renderEn('/publicaciones/nueva')

    await llenarObligatorios(usuario)
    await usuario.click(botonAgregarServicio())
    await escribir(usuario, 'Costo del servicio 1 (COP)', '0')
    await usuario.click(botonGuardar())

    expect(
      screen.getByText('Ingresa el nombre del servicio.'),
    ).toBeInTheDocument()
    expect(
      screen.queryByText(
        'El costo debe ser 0 o mayor, con hasta 10 enteros y 2 decimales.',
      ),
    ).not.toBeInTheDocument()
  })

  it('no permite más de 20 servicios adicionales', async () => {
    const usuario = renderEn('/publicaciones/nueva')

    for (let vez = 0; vez < 20; vez += 1) {
      await usuario.click(botonAgregarServicio())
    }

    expect(screen.getByLabelText('Nombre del servicio 20')).toBeInTheDocument()
    expect(botonAgregarServicio()).toBeDisabled()
  })

  it('descarta filas de servicios vacías y permite quitar filas', async () => {
    const usuario = renderEn('/publicaciones/nueva')

    await llenarObligatorios(usuario)
    await usuario.click(botonAgregarServicio())
    await usuario.click(botonAgregarServicio())
    await usuario.click(screen.getByRole('button', { name: 'Quitar servicio 2' }))
    await usuario.click(botonGuardar())

    expect(crear).toHaveBeenCalledWith(
      expect.objectContaining({ serviciosAdicionales: [] }),
    )
  })

  it('muestra junto a cada campo los detalles del backend', async () => {
    crear.mockResolvedValue(
      fallo({
        codigo: 'SOLICITUD_INVALIDA',
        erroresPorCampo: {
          ubicacionTextual: 'Ubicación no válida.',
          politicaCancelacionId: 'Política inexistente.',
          'serviciosAdicionales[0].nombre': 'Nombre repetido.',
          'imagenes[0]': 'Ruta no admitida.',
        },
      }),
    )
    const usuario = renderEn('/publicaciones/nueva')

    await llenarObligatorios(usuario)
    await usuario.click(botonAgregarServicio())
    await escribir(usuario, 'Nombre del servicio 1', 'A')
    await escribir(usuario, 'Costo del servicio 1 (COP)', '1')
    await usuario.click(botonAgregarFoto())
    await escribir(usuario, 'Ruta o URL de la foto 1', '/a.jpg')
    await usuario.click(botonGuardar())

    expect(await screen.findByText('Ubicación no válida.')).toBeInTheDocument()
    expect(screen.getByText('Política inexistente.')).toBeInTheDocument()
    expect(screen.getByText('Nombre repetido.')).toBeInTheDocument()
    expect(screen.getByText('Ruta no admitida.')).toBeInTheDocument()
    expect(screen.getByLabelText(ETIQUETAS.ubicacion)).toHaveFocus()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('muestra en el aviso general un detalle de un campo desconocido', async () => {
    crear.mockResolvedValue(
      fallo({
        codigo: 'SOLICITUD_INVALIDA',
        erroresPorCampo: { otroCampo: 'Valor no admitido.' },
        correlationId: 'abc',
      }),
    )
    const usuario = renderEn('/publicaciones/nueva')

    await llenarObligatorios(usuario)
    await usuario.click(botonGuardar())

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Valor no admitido. Código de referencia: abc.',
    )
  })
})

describe('panel Antes de enviar a revisión', () => {
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

    await usuario.type(campo.precio(), '100.50')
    expect(requisito('Precio por noche positivo')).toHaveTextContent('OK')

    await usuario.type(campo.capacidad(), '0')
    expect(requisito('Capacidad mayor que 0')).toHaveTextContent(noCumplido)
    await usuario.clear(campo.capacidad())
    await usuario.type(campo.capacidad(), '3')
    expect(requisito('Capacidad mayor que 0')).toHaveTextContent('OK')

    await usuario.clear(campo.titulo())
    expect(requisito('Título y descripción')).toHaveTextContent(noCumplido)
  })

  it('marca Condiciones comerciales con política y modo de reserva', async () => {
    const usuario = renderEn('/publicaciones/nueva')

    expect(requisito('Condiciones comerciales')).toHaveTextContent('Falta')

    await usuario.selectOptions(
      await screen.findByLabelText('Política de cancelación'),
      'Estricta',
    )
    expect(requisito('Condiciones comerciales')).toHaveTextContent('Falta')

    await usuario.click(screen.getByRole('radio', { name: /reserva inmediata/i }))
    expect(requisito('Condiciones comerciales')).toHaveTextContent('OK')
  })
})

describe('editar publicación', () => {
  it('muestra el estado de carga y luego los datos existentes', async () => {
    renderEn('/publicaciones/7/editar')

    expect(screen.getByText('Cargando publicación…')).toBeInTheDocument()
    expect(await screen.findByLabelText(ETIQUETAS.titulo)).toHaveValue(
      'Casa de campo',
    )
    expect(obtener).toHaveBeenCalledWith('7')
    expect(campo.capacidad()).toHaveValue('4')
    expect(screen.getByLabelText(ETIQUETAS.ubicacion)).toHaveValue('El Poblado')
    expect(screen.getByLabelText('Ruta o URL de la foto 1')).toHaveValue(
      '/fotos/1.jpg',
    )
    expect(campo.precio()).toHaveValue('200000.5')
    expect(campo.tarifa()).toHaveValue('0')
    expect(campo.reglas()).toHaveValue('No fumar')
    expect(
      await screen.findByLabelText('Política de cancelación'),
    ).toHaveValue('pol-2')
    expect(screen.getByRole('radio', { name: /con aprobación/i })).toBeChecked()
    expect(
      await screen.findByRole('checkbox', { name: 'Cocina' }),
    ).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Wi-Fi' })).not.toBeChecked()
    expect(screen.getByLabelText('Nombre del servicio 1')).toHaveValue(
      'Desayuno',
    )
    expect(requisito('Condiciones comerciales')).toHaveTextContent('OK')
    expect(screen.queryByText('Borrador guardado')).not.toBeInTheDocument()
  })

  it('convierte el tipo del enum a su etiqueta al cargar', async () => {
    renderEn('/publicaciones/7/editar')

    const tipo = await screen.findByLabelText('Tipo')

    expect(tipo).toHaveValue('CABANA')
    expect(tipo).toHaveDisplayValue('Cabaña')
  })

  it('enlaza a la disponibilidad solo en modo editar', async () => {
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

  it('actualiza la publicación existente con el valor del enum', async () => {
    const usuario = renderEn('/publicaciones/7/editar')

    await screen.findByLabelText(ETIQUETAS.titulo)
    await usuario.type(campo.titulo(), ' nueva')
    await usuario.click(botonGuardar())

    expect(await screen.findByText('Borrador guardado')).toBeInTheDocument()
    expect(actualizar).toHaveBeenCalledWith(
      '7',
      expect.objectContaining({
        titulo: 'Casa de campo nueva',
        tipo: 'CABANA',
        ubicacionTextual: 'El Poblado',
        precioNoche: 200000.5,
        serviciosIds: ['s2'],
      }),
    )
    expect(crear).not.toHaveBeenCalled()
  })

  it('también exige los obligatorios al editar', async () => {
    const usuario = renderEn('/publicaciones/7/editar')

    await screen.findByLabelText(ETIQUETAS.titulo)
    await usuario.clear(campo.descripcion())
    await usuario.click(botonGuardar())

    expect(screen.getByText('Ingresa la descripción.')).toBeInTheDocument()
    expect(actualizar).not.toHaveBeenCalled()
  })

  it('muestra Acceso denegado si la API responde 403 al cargar', async () => {
    obtener.mockResolvedValue(fallo({ codigo: 'ACCESO_DENEGADO' }))
    renderEn('/publicaciones/7/editar')

    expect(
      await screen.findByRole('heading', { name: 'Acceso denegado' }),
    ).toBeInTheDocument()
    expect(screen.queryByLabelText(ETIQUETAS.titulo)).not.toBeInTheDocument()
  })

  it('muestra Acceso denegado si la API responde 403 al guardar', async () => {
    actualizar.mockResolvedValue(fallo({ codigo: 'ACCESO_DENEGADO' }))
    const usuario = renderEn('/publicaciones/7/editar')

    await screen.findByLabelText(ETIQUETAS.titulo)
    await usuario.click(botonGuardar())

    expect(
      await screen.findByRole('heading', { name: 'Acceso denegado' }),
    ).toBeInTheDocument()
    expect(screen.queryByLabelText(ETIQUETAS.titulo)).not.toBeInTheDocument()
  })

  it('muestra el aviso si el estado no permite editar', async () => {
    actualizar.mockResolvedValue(
      fallo({
        codigo: 'ESTADO_PUBLICACION_INVALIDO',
        mensaje: 'La publicación no se puede modificar en su estado actual.',
      }),
    )
    const usuario = renderEn('/publicaciones/7/editar')

    await screen.findByLabelText(ETIQUETAS.titulo)
    await usuario.click(botonGuardar())

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'no se puede modificar',
    )
  })

  it('indica cuando la publicación no existe', async () => {
    obtener.mockResolvedValue(fallo({ codigo: 'PUBLICACION_NO_ENCONTRADA' }))
    renderEn('/publicaciones/99/editar')

    expect(
      await screen.findByRole('heading', { name: 'Publicación no encontrada' }),
    ).toBeInTheDocument()
  })

  it('permite reintentar si falla la carga', async () => {
    obtener.mockResolvedValueOnce(fallo({}))
    obtener.mockResolvedValueOnce(ok)
    const usuario = renderEn('/publicaciones/7/editar')

    await usuario.click(
      await screen.findByRole('button', { name: 'Reintentar' }),
    )

    expect(await screen.findByLabelText(ETIQUETAS.titulo)).toHaveValue(
      'Casa de campo',
    )
  })
})
