import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { iniciarSesionDePrueba } from '../test/sesion'
import { limpiarSesion } from './sesion'
import { useSesion } from './useSesion'

describe('useSesion', () => {
  it('devuelve null sin sesión', () => {
    const { result } = renderHook(() => useSesion())

    expect(result.current).toBeNull()
  })

  it('devuelve la sesión que ya existía', () => {
    const sesion = iniciarSesionDePrueba('HUESPED')

    const { result } = renderHook(() => useSesion())

    expect(result.current).toEqual(sesion)
  })

  it('se actualiza solo al entrar y al salir', () => {
    const { result } = renderHook(() => useSesion())

    let sesion: ReturnType<typeof iniciarSesionDePrueba> | undefined
    act(() => {
      sesion = iniciarSesionDePrueba('ANFITRION')
    })
    expect(result.current).toEqual(sesion)

    act(() => {
      limpiarSesion()
    })
    expect(result.current).toBeNull()
  })
})
