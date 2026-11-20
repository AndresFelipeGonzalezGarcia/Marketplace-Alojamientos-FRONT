// Registro de pago

export interface RegistroPago {
  clave: string
  incierto?: boolean
}

const PREFIJO = 'pago-reserva:'
const enMemoria = new Map<string, RegistroPago>()

function leer(reservaId: string): RegistroPago | null {
  try {
    const crudo = localStorage.getItem(PREFIJO + reservaId)
    if (crudo) {
      const valor = JSON.parse(crudo) as Partial<RegistroPago>
      if (typeof valor.clave === 'string' && valor.clave) {
        return { clave: valor.clave, incierto: valor.incierto === true }
      }
    }
  } catch {
    // Almacenamiento no disponible
  }
  return enMemoria.get(reservaId) ?? null
}

function guardar(reservaId: string, registro: RegistroPago) {
  enMemoria.set(reservaId, registro)
  try {
    localStorage.setItem(PREFIJO + reservaId, JSON.stringify(registro))
  } catch {
    // Memoria
  }
}

export function leerRegistroPago(reservaId: string) {
  return leer(reservaId)
}

// Clave de pago
export function claveDePago(reservaId: string): string {
  const existente = leer(reservaId)
  if (existente) return existente.clave
  const clave = crypto.randomUUID()
  guardar(reservaId, { clave })
  return clave
}

export function marcarPagoIncierto(reservaId: string) {
  guardar(reservaId, { clave: claveDePago(reservaId), incierto: true })
}

// Reinicio para pruebas
export function olvidarRegistrosEnMemoria() {
  enMemoria.clear()
}
