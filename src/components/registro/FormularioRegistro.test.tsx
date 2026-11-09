import { render, screen } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ErrorApi } from '../../api/errores'
import { registrarUsuario, type ResultadoRegistro } from '../../api/registro'
import FormularioRegistro from './FormularioRegistro'

vi.mock('../../api/registro', () => ({ registrarUsuario: vi.fn() }))

const registrar = vi.mocked(registrarUsuario)
const CONTRASENA_VALIDA = 'Segura123*'
const POLITICA =
  'La contraseña debe tener de 8 a 128 caracteres, con mayúscula, minúscula, número y símbolo.'
const creada: ResultadoRegistro = {
  estado: 'ok',
  datos: { id: 'u1', nombre: 'Ana', correo: 'a@b.co', rol: 'ANFITRION' },
}

function fallo(parcial: Partial<ErrorApi>): ResultadoRegistro {
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

interface Datos {
  rol?: RegExp
  nombre?: string
  correo?: string
  telefono?: string
  contrasena?: string
  confirmar?: string
}

async function pegar(usuario: UserEvent, etiqueta: string, texto: string) {
  await usuario.click(screen.getByLabelText(etiqueta))
  await usuario.paste(texto)
}

async function llenar({
  rol = /anfitrión/i,
  nombre = 'Ana Pérez',
  correo = 'ana@correo.com',
  telefono,
  contrasena = CONTRASENA_VALIDA,
  confirmar = contrasena,
}: Datos = {}) {
  const usuario = userEvent.setup()
  await usuario.click(screen.getByRole('radio', { name: rol }))
  await pegar(usuario, 'Nombre completo', nombre)
  await pegar(usuario, 'Correo', correo)
  if (telefono) {
    await pegar(usuario, 'Teléfono (opcional)', telefono)
  }
  await pegar(usuario, 'Contraseña', contrasena)
  await pegar(usuario, 'Confirmar contraseña', confirmar)
  return usuario
}

function botonCrear() {
  return screen.getByRole('button', { name: 'Crear cuenta' })
}

describe('FormularioRegistro', () => {
  beforeEach(() => {
    registrar.mockReset()
    render(<FormularioRegistro />)
  })

  it('muestra los errores de los campos vacíos y no llama a la API', async () => {
    await userEvent.click(botonCrear())

    expect(screen.getByText('Selecciona un tipo de cuenta.')).toBeInTheDocument()
    expect(screen.getByText('Ingresa tu nombre completo.')).toBeInTheDocument()
    expect(screen.getByText('Ingresa tu correo.')).toBeInTheDocument()
    expect(screen.getByText(POLITICA)).toBeInTheDocument()
    expect(screen.getByText('Confirma tu contraseña.')).toBeInTheDocument()
    expect(registrar).not.toHaveBeenCalled()
  })

  it('indica junto al correo cuando ya está registrado', async () => {
    const mensaje =
      'Este correo ya está registrado. Usa otro correo o inicia sesión.'
    registrar.mockResolvedValue(
      fallo({
        codigo: 'CORREO_YA_REGISTRADO',
        mensaje,
        erroresPorCampo: { correo: mensaje },
      }),
    )
    const usuario = await llenar()

    await usuario.click(botonCrear())

    expect(await screen.findByText(mensaje)).toBeInTheDocument()
    expect(screen.getByLabelText('Correo')).toHaveAttribute(
      'aria-invalid',
      'true',
    )
    expect(screen.getByLabelText('Correo')).toHaveFocus()
    expect(screen.queryByText('Cuenta creada')).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it.each([
    ['7 caracteres', 'Ab1*xyz'],
    ['129 caracteres', `Ab1*${'x'.repeat(125)}`],
    ['sin mayúscula', 'segura123*'],
    ['sin minúscula', 'SEGURA123*'],
    ['sin número', 'Seguraaaa*'],
    ['sin símbolo', 'Segura1234'],
    ['con espacio como único símbolo', 'Segura 123'],
  ])('rechaza una contraseña %s', async (_caso, contrasena) => {
    const usuario = await llenar({ contrasena })

    await usuario.click(botonCrear())

    expect(screen.getByText(POLITICA)).toBeInTheDocument()
    expect(registrar).not.toHaveBeenCalled()
  })

  it.each([
    ['de 8 caracteres', 'Abcde1*x'],
    ['de 128 caracteres', `Ab1*${'x'.repeat(124)}`],
  ])('acepta una contraseña %s', async (_caso, contrasena) => {
    registrar.mockResolvedValue(creada)
    const usuario = await llenar({ contrasena })

    await usuario.click(botonCrear())

    expect(await screen.findByText('Cuenta creada')).toBeInTheDocument()
  })

  it('muestra junto a cada campo los detalles que devuelve la API', async () => {
    registrar.mockResolvedValue(
      fallo({
        codigo: 'SOLICITUD_INVALIDA',
        mensaje: 'Revisa los datos ingresados.',
        erroresPorCampo: {
          contrasena: 'No cumple la política.',
          telefono: 'Teléfono inválido.',
        },
      }),
    )
    const usuario = await llenar()

    await usuario.click(botonCrear())

    expect(await screen.findByText('No cumple la política.')).toBeInTheDocument()
    expect(screen.getByText('Teléfono inválido.')).toBeInTheDocument()
    expect(screen.getByLabelText('Teléfono (opcional)')).toHaveFocus()
    expect(screen.queryByText('Cuenta creada')).not.toBeInTheDocument()
  })

  it('muestra en el mensaje general un detalle de un campo desconocido', async () => {
    registrar.mockResolvedValue(
      fallo({
        codigo: 'SOLICITUD_INVALIDA',
        erroresPorCampo: { otroCampo: 'Valor no admitido.' },
      }),
    )
    const usuario = await llenar()

    await usuario.click(botonCrear())

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Valor no admitido.',
    )
  })

  it('muestra un error si las contraseñas no coinciden', async () => {
    const usuario = await llenar({ confirmar: 'Otra123*clave' })

    await usuario.click(botonCrear())

    expect(
      screen.getByText('Las contraseñas no coinciden.'),
    ).toBeInTheDocument()
    expect(registrar).not.toHaveBeenCalled()
  })

  it('crea la cuenta con el rol Anfitrión y sin enviar la confirmación', async () => {
    registrar.mockResolvedValue(creada)
    const usuario = await llenar({ telefono: ' 3001234567 ' })

    await usuario.click(botonCrear())

    expect(await screen.findByText('Cuenta creada')).toBeInTheDocument()
    expect(
      screen.getByText('Tu cuenta de Anfitrión quedó creada.'),
    ).toBeInTheDocument()
    expect(registrar).toHaveBeenCalledExactlyOnceWith({
      nombre: 'Ana Pérez',
      correo: 'ana@correo.com',
      telefono: '3001234567',
      contrasena: CONTRASENA_VALIDA,
      rol: 'ANFITRION',
    })
  })

  it('omite el teléfono si está vacío', async () => {
    registrar.mockResolvedValue(creada)
    const usuario = await llenar()

    await usuario.click(botonCrear())

    expect(await screen.findByText('Cuenta creada')).toBeInTheDocument()
    expect(registrar.mock.calls[0][0]).not.toHaveProperty('telefono')
  })

  it('rechaza un teléfono de más de 30 caracteres', async () => {
    const usuario = await llenar({ telefono: '1'.repeat(31) })

    await usuario.click(botonCrear())

    expect(
      screen.getByText('El teléfono admite máximo 30 caracteres.'),
    ).toBeInTheDocument()
    expect(registrar).not.toHaveBeenCalled()
  })

  it('deshabilita el botón mientras envía', async () => {
    let responder: (resultado: ResultadoRegistro) => void = () => {}
    registrar.mockReturnValue(
      new Promise((resolver) => {
        responder = resolver
      }),
    )
    const usuario = await llenar()

    await usuario.click(botonCrear())

    expect(
      screen.getByRole('button', { name: 'Creando cuenta…' }),
    ).toBeDisabled()

    responder(creada)
    expect(await screen.findByText('Cuenta creada')).toBeInTheDocument()
  })

  it('muestra un error general con referencia y conserva los datos', async () => {
    registrar.mockResolvedValue(fallo({ correlationId: 'abc-123' }))
    const usuario = await llenar()

    await usuario.click(botonCrear())

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Falló el servidor. Código de referencia: abc-123.',
    )
    expect(screen.getByLabelText('Correo')).toHaveValue('ana@correo.com')
    expect(botonCrear()).toBeEnabled()
  })
})
