import { afterEach, describe, expect, it, vi } from 'vitest'
import { crearSesionDePrueba, iniciarSesionDePrueba } from '../test/sesion'
import {
  CLAVE_SESION,
  guardarSesion,
  invalidarSesion,
  limpiarSesion,
  obtenerMotivoUltimoCierre,
  obtenerRolSesion,
  obtenerSesion,
  obtenerTokenSesion,
  obtenerUsuarioSesion,
  suscribirSesion,
  type Sesion,
} from './sesion'

const UNA_HORA = 60 * 60 * 1000

function leerGuardada(): unknown {
  const crudo = localStorage.getItem(CLAVE_SESION)
  return crudo ? JSON.parse(crudo) : null
}

// Prototipo real del localStorage en uso (jsdom o el de src/test).
function prototipoAlmacenamiento(): Storage {
  return Object.getPrototypeOf(localStorage) as Storage
}

// Importa una copia nueva del módulo, como si la página se recargara.
async function recargarModulo() {
  vi.resetModules()
  return import('./sesion')
}

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('sesión', () => {
  it('guarda en localStorage solo token, expiraEn y usuario', () => {
    const sesion = crearSesionDePrueba('ANFITRION')
    const respuestaLogin = {
      ...sesion,
      tipo: 'Bearer',
      usuario: { ...sesion.usuario, extra: 'x' },
    } as Sesion

    guardarSesion(respuestaLogin)

    expect(leerGuardada()).toEqual(sesion)
    expect(obtenerSesion()).toEqual(sesion)
    expect(obtenerTokenSesion()).toBe(sesion.token)
    expect(obtenerRolSesion()).toBe('ANFITRION')
    expect(obtenerUsuarioSesion()).toEqual(sesion.usuario)
  })

  it('rechaza una sesión con formato inválido', () => {
    const sesion = crearSesionDePrueba('ANFITRION')
    const conRolDesconocido = {
      ...sesion,
      usuario: { ...sesion.usuario, rol: 'SUPERUSUARIO' },
    } as unknown as Sesion

    expect(() => guardarSesion(conRolDesconocido)).toThrow()
    expect(obtenerSesion()).toBeNull()
  })

  it('devuelve el mismo objeto mientras la sesión no cambia', () => {
    iniciarSesionDePrueba('HUESPED')

    expect(obtenerSesion()).toBe(obtenerSesion())
  })

  it('limpia la sesión del almacenamiento y de memoria', () => {
    iniciarSesionDePrueba('ANFITRION')

    limpiarSesion()

    expect(obtenerSesion()).toBeNull()
    expect(obtenerTokenSesion()).toBeNull()
    expect(obtenerRolSesion()).toBeNull()
    expect(localStorage.getItem(CLAVE_SESION)).toBeNull()
    expect(obtenerMotivoUltimoCierre()).toBe('manual')
  })

  it('considera vencida una sesión cuyo expiraEn ya pasó', () => {
    iniciarSesionDePrueba('ANFITRION', {
      expiraEn: new Date(Date.now() - 1000).toISOString(),
    })

    expect(obtenerSesion()).toBeNull()
    expect(obtenerTokenSesion()).toBeNull()
  })

  it('cierra la sesión y avisa cuando llega expiraEn', () => {
    vi.useFakeTimers({ now: new Date('2026-11-12T10:00:00Z') })
    const oyente = vi.fn()
    iniciarSesionDePrueba('ANFITRION', {
      expiraEn: new Date(Date.now() + UNA_HORA).toISOString(),
    })
    suscribirSesion(oyente)

    vi.advanceTimersByTime(UNA_HORA - 1)
    expect(obtenerSesion()).not.toBeNull()
    expect(oyente).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(obtenerSesion()).toBeNull()
    expect(oyente).toHaveBeenCalledTimes(1)
    expect(obtenerMotivoUltimoCierre()).toBe('expirada')
    expect(localStorage.getItem(CLAVE_SESION)).toBeNull()
  })

  it('avisa a los suscriptores al guardar y al limpiar', () => {
    const oyente = vi.fn()
    const cancelar = suscribirSesion(oyente)

    iniciarSesionDePrueba('ANFITRION')
    limpiarSesion()
    expect(oyente).toHaveBeenCalledTimes(2)

    cancelar()
    iniciarSesionDePrueba('ANFITRION')
    expect(oyente).toHaveBeenCalledTimes(2)
  })

  it('no avisa al limpiar si no había sesión', () => {
    const oyente = vi.fn()
    suscribirSesion(oyente)

    limpiarSesion()

    expect(oyente).not.toHaveBeenCalled()
  })

  it('invalida la sesión solo si el token rechazado es el actual', () => {
    const sesion = iniciarSesionDePrueba('ANFITRION', { token: 'nuevo' })

    invalidarSesion('viejo')
    expect(obtenerSesion()).toEqual(sesion)

    invalidarSesion('nuevo')
    expect(obtenerSesion()).toBeNull()
    expect(obtenerMotivoUltimoCierre()).toBe('expirada')
  })

  describe('al cargar la página', () => {
    it('recupera la sesión guardada en localStorage', async () => {
      const sesion = crearSesionDePrueba('ADMINISTRADOR')
      localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion))

      const modulo = await recargarModulo()

      expect(modulo.obtenerSesion()).toEqual(sesion)
      expect(modulo.obtenerRolSesion()).toBe('ADMINISTRADOR')
      modulo.limpiarSesion()
    })

    it.each([
      ['un JSON roto', '{no-es-json'],
      ['un objeto incompleto', JSON.stringify({ token: 'x' })],
      [
        'un rol desconocido',
        JSON.stringify({
          ...crearSesionDePrueba('HUESPED'),
          usuario: { id: '1', nombre: 'X', correo: 'x@x.co', rol: 'OTRO' },
        }),
      ],
    ])('ignora %s', async (_caso, crudo) => {
      localStorage.setItem(CLAVE_SESION, crudo)

      const modulo = await recargarModulo()

      expect(modulo.obtenerSesion()).toBeNull()
    })

    it('descarta una sesión ya vencida y la borra', async () => {
      const vencida = crearSesionDePrueba('ANFITRION', {
        expiraEn: new Date(Date.now() - UNA_HORA).toISOString(),
      })
      localStorage.setItem(CLAVE_SESION, JSON.stringify(vencida))

      const modulo = await recargarModulo()

      expect(modulo.obtenerSesion()).toBeNull()
      expect(modulo.obtenerMotivoUltimoCierre()).toBe('expirada')
      expect(localStorage.getItem(CLAVE_SESION)).toBeNull()
    })
  })

  it('mantiene la sesión en memoria si localStorage está bloqueado', async () => {
    vi.spyOn(prototipoAlmacenamiento(), 'getItem').mockImplementation(() => {
      throw new DOMException('Bloqueado', 'SecurityError')
    })
    vi.spyOn(prototipoAlmacenamiento(), 'setItem').mockImplementation(() => {
      throw new DOMException('Bloqueado', 'SecurityError')
    })
    vi.spyOn(prototipoAlmacenamiento(), 'removeItem').mockImplementation(() => {
      throw new DOMException('Bloqueado', 'SecurityError')
    })
    const modulo = await recargarModulo()
    const sesion = crearSesionDePrueba('ANFITRION')

    expect(() => modulo.guardarSesion(sesion)).not.toThrow()
    expect(modulo.obtenerSesion()).toEqual(sesion)

    expect(() => modulo.limpiarSesion()).not.toThrow()
    expect(modulo.obtenerSesion()).toBeNull()
  })

  it('se sincroniza cuando otra pestaña inicia o cierra sesión', () => {
    const oyente = vi.fn()
    suscribirSesion(oyente)
    const sesion = crearSesionDePrueba('ANFITRION')

    localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion))
    window.dispatchEvent(new StorageEvent('storage', { key: CLAVE_SESION }))
    expect(obtenerSesion()).toEqual(sesion)
    expect(oyente).toHaveBeenCalledTimes(1)

    localStorage.removeItem(CLAVE_SESION)
    window.dispatchEvent(new StorageEvent('storage', { key: CLAVE_SESION }))
    expect(obtenerSesion()).toBeNull()
    expect(oyente).toHaveBeenCalledTimes(2)
  })

  it('ignora cambios de otras claves del almacenamiento', () => {
    const oyente = vi.fn()
    suscribirSesion(oyente)

    window.dispatchEvent(new StorageEvent('storage', { key: 'otra.clave' }))

    expect(oyente).not.toHaveBeenCalled()
  })
})
