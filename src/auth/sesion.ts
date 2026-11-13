// Único punto de lectura y escritura de la sesión.
// Se guarda en localStorage y se mantiene una copia en memoria para que,
// si el almacenamiento falla o está bloqueado, la sesión dure al menos
// lo que dure la pestaña.

export type RolUsuario = 'HUESPED' | 'ANFITRION' | 'ADMINISTRADOR'

export const ROLES: readonly RolUsuario[] = [
  'HUESPED',
  'ANFITRION',
  'ADMINISTRADOR',
]

export interface UsuarioSesion {
  id: string
  nombre: string
  correo: string
  rol: RolUsuario
}

// Lo que devuelve POST /api/auth/login (sin `tipo`, que siempre es Bearer).
export interface Sesion {
  token: string
  expiraEn: string
  usuario: UsuarioSesion
}

// Por qué terminó la última sesión, para que el login pueda explicarlo.
export type MotivoCierre = 'manual' | 'expirada'

export const CLAVE_SESION = 'marketplace.sesion'

// setTimeout no admite esperas mayores a ~24,8 días.
const ESPERA_MAXIMA_MS = 2_147_483_647

type Oyente = () => void

const oyentes = new Set<Oyente>()
let cargada = false
let enMemoria: Sesion | null = null
let ultimoCierre: MotivoCierre | null = null
let temporizador: ReturnType<typeof setTimeout> | undefined

function esTexto(valor: unknown): valor is string {
  return typeof valor === 'string' && valor.length > 0
}

function esSesion(valor: unknown): valor is Sesion {
  const posible = valor as Partial<Sesion> | null
  const usuario = posible?.usuario as Partial<UsuarioSesion> | undefined
  return (
    esTexto(posible?.token) &&
    esTexto(posible.expiraEn) &&
    !Number.isNaN(Date.parse(posible.expiraEn)) &&
    esTexto(usuario?.id) &&
    typeof usuario.nombre === 'string' &&
    typeof usuario.correo === 'string' &&
    ROLES.includes(usuario.rol as RolUsuario)
  )
}

function normalizar(sesion: Sesion): Sesion {
  const { token, expiraEn, usuario } = sesion
  const { id, nombre, correo, rol } = usuario
  return { token, expiraEn, usuario: { id, nombre, correo, rol } }
}

function estaVencida(sesion: Sesion, ahora = Date.now()) {
  return Date.parse(sesion.expiraEn) <= ahora
}

function leerAlmacenamiento(): Sesion | null {
  try {
    const crudo = localStorage.getItem(CLAVE_SESION)
    if (!crudo) return null
    const valor: unknown = JSON.parse(crudo)
    return esSesion(valor) ? normalizar(valor) : null
  } catch {
    return null
  }
}

function escribirAlmacenamiento(sesion: Sesion | null) {
  try {
    if (sesion) {
      localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion))
    } else {
      localStorage.removeItem(CLAVE_SESION)
    }
  } catch {
    // Almacenamiento bloqueado o lleno: queda la copia en memoria.
  }
}

function avisar() {
  for (const oyente of [...oyentes]) {
    oyente()
  }
}

// Programa el cierre automático cuando llegue `expiraEn`, para que la
// interfaz reaccione aunque nadie haga una petición.
function programarVencimiento() {
  clearTimeout(temporizador)
  temporizador = undefined
  if (!enMemoria) return

  const restante = Date.parse(enMemoria.expiraEn) - Date.now()
  temporizador = setTimeout(
    () => {
      if (enMemoria && estaVencida(enMemoria)) {
        cerrar('expirada')
      } else {
        programarVencimiento()
      }
    },
    Math.min(Math.max(restante, 0), ESPERA_MAXIMA_MS),
  )
}

function cargar() {
  if (cargada) return
  cargada = true
  enMemoria = leerAlmacenamiento()
  if (enMemoria && estaVencida(enMemoria)) {
    enMemoria = null
    ultimoCierre = 'expirada'
    escribirAlmacenamiento(null)
  }
  programarVencimiento()
}

function cerrar(motivo: MotivoCierre) {
  cargar()
  const habiaSesion = enMemoria !== null
  enMemoria = null
  ultimoCierre = motivo
  escribirAlmacenamiento(null)
  programarVencimiento()
  if (habiaSesion) avisar()
}

export function guardarSesion(sesion: Sesion) {
  if (!esSesion(sesion)) {
    throw new Error('La sesión recibida no tiene el formato esperado.')
  }
  cargada = true
  enMemoria = normalizar(sesion)
  ultimoCierre = null
  escribirAlmacenamiento(enMemoria)
  programarVencimiento()
  avisar()
}

// Devuelve la sesión vigente o null. Conserva la identidad del objeto
// mientras no cambie, como exige useSyncExternalStore.
export function obtenerSesion(): Sesion | null {
  cargar()
  if (enMemoria && estaVencida(enMemoria)) {
    // Se informa en el próximo turno para no avisar en medio de un render.
    queueMicrotask(() => {
      if (enMemoria && estaVencida(enMemoria)) cerrar('expirada')
    })
    return null
  }
  return enMemoria
}

export function obtenerTokenSesion(): string | null {
  return obtenerSesion()?.token ?? null
}

export function obtenerUsuarioSesion(): UsuarioSesion | null {
  return obtenerSesion()?.usuario ?? null
}

export function obtenerRolSesion(): RolUsuario | null {
  return obtenerSesion()?.usuario.rol ?? null
}

export function obtenerMotivoUltimoCierre(): MotivoCierre | null {
  cargar()
  return ultimoCierre
}

// Cierre pedido por la persona.
export function limpiarSesion() {
  cerrar('manual')
}

// El servidor rechazó el token (401 NO_AUTENTICADO). Solo se cierra si el
// token rechazado es el actual: una respuesta tardía de una sesión anterior
// no debe tumbar una sesión nueva.
export function invalidarSesion(tokenRechazado: string) {
  if (obtenerTokenSesion() === tokenRechazado) {
    cerrar('expirada')
  }
}

export function suscribirSesion(oyente: Oyente): () => void {
  oyentes.add(oyente)
  return () => {
    oyentes.delete(oyente)
  }
}

// Mantiene sincronizadas varias pestañas: si otra entra o sale, esta también.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (evento) => {
    if (evento.key !== CLAVE_SESION && evento.key !== null) return
    const anterior = enMemoria
    let nueva = leerAlmacenamiento()
    if (nueva && estaVencida(nueva)) nueva = null
    cargada = true
    if (JSON.stringify(anterior) === JSON.stringify(nueva)) return

    enMemoria = nueva
    if (!nueva && anterior) ultimoCierre = 'manual'
    if (nueva) ultimoCierre = null
    programarVencimiento()
    avisar()
  })
}
