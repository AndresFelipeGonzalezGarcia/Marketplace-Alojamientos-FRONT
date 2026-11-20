// localStorage en memoria
class AlmacenamientoEnMemoria implements Storage {
  private datos = new Map<string, string>()

  get length() {
    return this.datos.size
  }

  clear() {
    this.datos.clear()
  }

  getItem(clave: string) {
    return this.datos.get(String(clave)) ?? null
  }

  key(indice: number) {
    return [...this.datos.keys()][indice] ?? null
  }

  removeItem(clave: string) {
    this.datos.delete(String(clave))
  }

  setItem(clave: string, valor: string) {
    this.datos.set(String(clave), String(valor))
  }
}

export function asegurarLocalStorage() {
  const actual = globalThis.localStorage as Partial<Storage> | undefined
  if (typeof actual?.getItem === 'function') return

  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: new AlmacenamientoEnMemoria(),
  })
}
