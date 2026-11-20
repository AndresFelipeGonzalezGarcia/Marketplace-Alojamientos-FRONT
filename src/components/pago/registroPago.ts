// Lo que el navegador recuerda del pago de cada reserva, por reserva:
//
// - `clave`: la Idempotency-Key. Se genera una sola vez por reserva y se
//   reutiliza en cada intento, también tras recargar la página: es la clave
//   con la que la conciliación consulta el pago, y un reintento con ella no
//   cobra dos veces.
// - `incierto`: el backend respondió 202 (PAGO_INCIERTO). Desde entonces la
//   pantalla no vuelve a ofrecer pagar esa reserva, aunque el estado que
//   devuelva el backend siga diciendo PENDIENTE_PAGO.
//
// Se guarda en localStorage; si no está disponible (modo privado, bloqueado)
// queda en memoria mientras dure la pestaña.

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
    // Almacenamiento no disponible o dato corrupto: se usa la memoria.
  }
  return enMemoria.get(reservaId) ?? null
}

function guardar(reservaId: string, registro: RegistroPago) {
  enMemoria.set(reservaId, registro)
  try {
    localStorage.setItem(PREFIJO + reservaId, JSON.stringify(registro))
  } catch {
    // Queda en memoria.
  }
}

export function leerRegistroPago(reservaId: string) {
  return leer(reservaId)
}

// La clave de la reserva; la crea la primera vez.
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

// Solo para las pruebas: la memoria sobrevive entre casos.
export function olvidarRegistrosEnMemoria() {
  enMemoria.clear()
}
