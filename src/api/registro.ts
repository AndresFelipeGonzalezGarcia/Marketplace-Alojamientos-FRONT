import { solicitarApi, type ResultadoApi } from './cliente'

export type Rol = 'HUESPED' | 'ANFITRION'

export interface DatosRegistro {
  nombre: string
  correo: string
  telefono?: string
  contrasena: string
  rol: Rol
}

export interface UsuarioRegistrado {
  id: string
  nombre: string
  correo: string
  rol: Rol
}

export type ResultadoRegistro = ResultadoApi<UsuarioRegistrado>

export function registrarUsuario(
  datos: DatosRegistro,
): Promise<ResultadoRegistro> {
  return solicitarApi<UsuarioRegistrado>({
    ruta: '/api/auth/registro',
    metodo: 'POST',
    estadoExito: 201,
    cuerpo: datos,
  })
}
