import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { registrarUsuario, type ResultadoRegistro } from '../../api/registro'
import FormularioRegistro from './FormularioRegistro'

vi.mock('../../api/registro', () => ({ registrarUsuario: vi.fn() }))

const registrar = vi.mocked(registrarUsuario)

interface Datos {
  rol?: RegExp
  nombre?: string
  correo?: string
  contrasena?: string
  confirmar?: string
}

async function llenar({
  rol = /anfitrión/i,
  nombre = 'Ana Pérez',
  correo = 'ana@correo.com',
  contrasena = 'clave-segura',
  confirmar = contrasena,
}: Datos = {}) {
  const usuario = userEvent.setup()
  await usuario.click(screen.getByRole('radio', { name: rol }))
  await usuario.type(screen.getByLabelText('Nombre completo'), nombre)
  await usuario.type(screen.getByLabelText('Correo'), correo)
  await usuario.type(screen.getByLabelText('Contraseña'), contrasena)
  await usuario.type(screen.getByLabelText('Confirmar contraseña'), confirmar)
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
    expect(screen.getByText('Confirma tu contraseña.')).toBeInTheDocument()
    expect(registrar).not.toHaveBeenCalled()
  })

  it('indica cuando el correo ya está registrado', async () => {
    registrar.mockResolvedValue({ estado: 'correo_duplicado' })
    const usuario = await llenar()

    await usuario.click(botonCrear())

    expect(
      await screen.findByText('Este correo ya está registrado.'),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Correo')).toHaveAttribute(
      'aria-invalid',
      'true',
    )
    expect(screen.queryByText('Cuenta creada')).not.toBeInTheDocument()
  })

  it('rechaza una contraseña de 7 caracteres', async () => {
    const usuario = await llenar({ contrasena: '1234567' })

    await usuario.click(botonCrear())

    expect(
      screen.getByText('La contraseña debe tener mínimo 8 caracteres.'),
    ).toBeInTheDocument()
    expect(registrar).not.toHaveBeenCalled()
  })

  it('acepta una contraseña de 8 caracteres', async () => {
    registrar.mockResolvedValue({ estado: 'ok' })
    const usuario = await llenar({ contrasena: '12345678' })

    await usuario.click(botonCrear())

    expect(await screen.findByText('Cuenta creada')).toBeInTheDocument()
  })

  it('muestra el error si la API rechaza la contraseña', async () => {
    registrar.mockResolvedValue({ estado: 'contrasena_invalida' })
    const usuario = await llenar()

    await usuario.click(botonCrear())

    expect(
      await screen.findByText(
        'La contraseña no cumple la política de seguridad.',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByText('Cuenta creada')).not.toBeInTheDocument()
  })

  it('muestra un error si las contraseñas no coinciden', async () => {
    const usuario = await llenar({ confirmar: 'otra-clave' })

    await usuario.click(botonCrear())

    expect(
      screen.getByText('Las contraseñas no coinciden.'),
    ).toBeInTheDocument()
    expect(registrar).not.toHaveBeenCalled()
  })

  it('crea la cuenta con el rol Anfitrión', async () => {
    registrar.mockResolvedValue({ estado: 'ok' })
    const usuario = await llenar()

    await usuario.click(botonCrear())

    expect(await screen.findByText('Cuenta creada')).toBeInTheDocument()
    expect(
      screen.getByText('Tu cuenta de Anfitrión quedó creada.'),
    ).toBeInTheDocument()
    expect(registrar).toHaveBeenCalledExactlyOnceWith({
      nombreCompleto: 'Ana Pérez',
      correo: 'ana@correo.com',
      contrasena: 'clave-segura',
      rol: 'ANFITRION',
    })
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

    responder({ estado: 'ok' })
    expect(await screen.findByText('Cuenta creada')).toBeInTheDocument()
  })

  it('muestra un error general y conserva los datos si falla la red', async () => {
    registrar.mockResolvedValue({ estado: 'error' })
    const usuario = await llenar()

    await usuario.click(botonCrear())

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No pudimos crear tu cuenta',
    )
    expect(screen.getByLabelText('Correo')).toHaveValue('ana@correo.com')
    expect(botonCrear()).toBeEnabled()
  })
})
