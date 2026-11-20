import '@testing-library/jest-dom/vitest'
import { cleanup, configure } from '@testing-library/react'
import { afterEach } from 'vitest'
import { limpiarSesion } from '../auth/sesion'
import { asegurarLocalStorage } from './almacenamiento'

asegurarLocalStorage()

// Tiempo de espera de findBy y waitFor
configure({ asyncUtilTimeout: 3000 })

afterEach(() => {
  cleanup()
  limpiarSesion()
  localStorage.clear()
})
