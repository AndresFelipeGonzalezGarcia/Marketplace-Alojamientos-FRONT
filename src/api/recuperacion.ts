import { solicitarApi, type ResultadoApi } from './cliente'

// RecuperacionResponse del contrato. `enlaceSimulado` solo llega cuando el
// backend corre con el perfil de desarrollo.
export interface RespuestaRecuperacion {
  mensaje?: string
  enlaceSimulado?: string
}

export interface DatosRestablecimiento {
  token: string
  nuevaContrasena: string
}

// Siempre responde 202, exista o no la cuenta.
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

// Responde 204 sin cuerpo; luego el enlace deja de servir.
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
