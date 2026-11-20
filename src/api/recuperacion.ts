import { solicitarApi, type ResultadoApi } from './cliente'

// Respuesta de recuperación
export interface RespuestaRecuperacion {
  mensaje?: string
  enlaceSimulado?: string
}

export interface DatosRestablecimiento {
  token: string
  nuevaContrasena: string
}

// Solicitar recuperación
export function solicitarRecuperacion(
  correo: string,
): Promise<ResultadoApi<RespuestaRecuperacion | undefined>> {
  return solicitarApi<RespuestaRecuperacion | undefined>({
    ruta: '/api/auth/recuperar-contrasena',
    metodo: 'POST',
    estadoExito: 202,
    cuerpo: { correo },
  })
}

// Restablecer contraseña
export function restablecerContrasena(
  datos: DatosRestablecimiento,
): Promise<ResultadoApi<void>> {
  return solicitarApi<void>({
    ruta: '/api/auth/restablecer-contrasena',
    metodo: 'POST',
    estadoExito: 204,
    cuerpo: datos,
  })
}
