import { obtenerTokenSesion, type UsuarioSesion } from '../auth/sesion'
import { solicitarApi, type ResultadoApi } from './cliente'

export interface DatosLogin {
  correo: string
  contrasena: string
}

// LoginResponse del contrato.
export interface RespuestaLogin {
  token: string
  tipo: string
  expiraEn: string
  usuario: UsuarioSesion
}

export function iniciarSesion(
  datos: DatosLogin,
): Promise<ResultadoApi<RespuestaLogin>> {
  return solicitarApi<RespuestaLogin>({
    ruta: '/api/auth/login',
    metodo: 'POST',
    estadoExito: 200,
    cuerpo: datos,
  })
}

export function obtenerUsuarioActual(): Promise<ResultadoApi<UsuarioSesion>> {
  return solicitarApi<UsuarioSesion>({
    ruta: '/api/auth/me',
    metodo: 'GET',
    estadoExito: 200,
    token: obtenerTokenSesion(),
  })
}
