import { afterEach, describe, expect, it, vi } from 'vitest'
import { crearSesionDemo, modoDemoActivo } from './sesionDemo'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('sesión de prueba', () => {
  it('está apagada si la variable no existe', () => {
    vi.stubEnv('VITE_SESION_DEMO', undefined)

    expect(modoDemoActivo()).toBe(false)
  })

  it('solo se activa con "true" exacto', () => {
    vi.stubEnv('VITE_SESION_DEMO', 'true')
    expect(modoDemoActivo()).toBe(true)

    vi.stubEnv('VITE_SESION_DEMO', 'yes')
    expect(modoDemoActivo()).toBe(false)
  })

  it('queda apagada fuera de desarrollo aunque la variable esté puesta', () => {
    vi.stubEnv('VITE_SESION_DEMO', 'true')
    vi.stubEnv('DEV', false)

    expect(modoDemoActivo()).toBe(false)
  })

  it('crea una sesión local de una hora para el rol pedido', () => {
    const ahora = Date.parse('2026-11-12T10:00:00Z')

    const sesion = crearSesionDemo('ADMINISTRADOR', ahora)

    expect(sesion.expiraEn).toBe('2026-11-12T11:00:00.000Z')
    expect(sesion.usuario).toMatchObject({
      rol: 'ADMINISTRADOR',
      nombre: 'Administrador de prueba',
    })
    expect(sesion.usuario.correo).toMatch(/@demo\.invalid$/)
  })
})
