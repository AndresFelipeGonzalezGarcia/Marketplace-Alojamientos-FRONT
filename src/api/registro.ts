export type Rol = 'HUESPED' | 'ANFITRION'

export interface DatosRegistro {
  nombreCompleto: string
  correo: string
  contrasena: string
  rol: Rol
}

export type ResultadoRegistro =
  | { estado: 'ok' }
  | { estado: 'correo_duplicado' }
  | { estado: 'contrasena_invalida' }
  | { estado: 'error' }

// Contrato provisional: ajustar aquí cuando la API esté definida.
const RUTA_REGISTRO = '/api/usuarios/registro'

export async function registrarUsuario(
  datos: DatosRegistro,
): Promise<ResultadoRegistro> {
  const urlBase: string | undefined = import.meta.env.VITE_API_URL

  if (!urlBase) {
    return { estado: 'error' }
  }

  try {
    const respuesta = await fetch(
      `${urlBase.replace(/\/+$/, '')}${RUTA_REGISTRO}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
      },
    )

    switch (respuesta.status) {
      case 201:
        return { estado: 'ok' }
      case 409:
        return { estado: 'correo_duplicado' }
      case 400:
      case 422:
        return { estado: 'contrasena_invalida' }
      default:
        return { estado: 'error' }
    }
  } catch {
    return { estado: 'error' }
  }
}
