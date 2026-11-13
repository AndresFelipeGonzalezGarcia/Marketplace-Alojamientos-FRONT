import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import { limpiarSesion } from '../auth/sesion'
import { asegurarLocalStorage } from './almacenamiento'

asegurarLocalStorage()

afterEach(() => {
  cleanup()
  limpiarSesion()
  localStorage.clear()
})
