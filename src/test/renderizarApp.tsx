import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { routes } from '../routes'

// Monta la aplicación completa (layout, encabezado y rutas) en una ruta.
export function renderizarApp(ruta: string) {
  const router = createMemoryRouter(routes, { initialEntries: [ruta] })
  const usuario = userEvent.setup()
  render(<RouterProvider router={router} />)
  return { router, usuario }
}
