import { describe, expect, it } from 'vitest'
import {
  aConsulta,
  contarNoches,
  describirEstadia,
  escribirFiltros,
  FILTROS_VACIOS,
  hayFiltros,
  leerFiltros,
  leerPrecioEscrito,
  paginasVisibles,
  validarBusqueda,
  validarPrecios,
} from './filtrosBusqueda'

const SERVICIO_A = 'b0a1c3d4-0000-4000-8000-000000000101'
const SERVICIO_B = 'b0a1c3d4-0000-4000-8000-000000000104'

describe('filtros de búsqueda en la URL', () => {
  it('lee todos los filtros de la URL', () => {
    const filtros = leerFiltros(
      new URLSearchParams(
        `ciudad=Medellín&llegada=2030-12-10&salida=2030-12-14&huespedes=3&precioMin=100000&precioMax=300000&tipo=CASA&servicios=${SERVICIO_A},${SERVICIO_B}&pagina=2`,
      ),
    )
    expect(filtros).toEqual({
      ciudad: 'Medellín',
      llegada: '2030-12-10',
      salida: '2030-12-14',
      huespedes: 3,
      precioMin: 100000,
      precioMax: 300000,
      tipo: 'CASA',
      servicios: [SERVICIO_A, SERVICIO_B],
      pagina: 2,
    })
  })

  it('escribir y volver a leer conserva los filtros', () => {
    const filtros = {
      ...FILTROS_VACIOS,
      ciudad: 'Cali',
      llegada: '2030-01-05',
      salida: '2030-01-07',
      tipo: 'CABANA' as const,
      servicios: [SERVICIO_A],
      pagina: 3,
    }
    expect(leerFiltros(escribirFiltros(filtros))).toEqual(filtros)
  })

  it('omite lo vacío y la página 1, para que la URL quede limpia', () => {
    expect(escribirFiltros(FILTROS_VACIOS).toString()).toBe('')
    expect(escribirFiltros({ ...FILTROS_VACIOS, ciudad: 'Cali' }).toString()).toBe(
      'ciudad=Cali',
    )
  })

  it('ignora lo que no entiende de un enlace editado a mano', () => {
    const filtros = leerFiltros(
      new URLSearchParams(
        'huespedes=abc&precioMin=-5&tipo=CASTILLO&pagina=0&llegada=2030-02-30&salida=2030-03-02',
      ),
    )
    expect(filtros).toEqual(FILTROS_VACIOS)
  })

  it('solo conserva las fechas si vienen las dos', () => {
    expect(leerFiltros(new URLSearchParams('llegada=2030-12-10')).llegada).toBe('')
  })

  it('conserva una salida anterior a la llegada para que la API la rechace', () => {
    const filtros = leerFiltros(new URLSearchParams('llegada=2030-12-14&salida=2030-12-10'))
    expect(filtros).toMatchObject({ llegada: '2030-12-14', salida: '2030-12-10' })
  })

  it('traduce a la consulta de la API con la página desde 0', () => {
    expect(
      aConsulta({ ...FILTROS_VACIOS, ciudad: 'Cali', huespedes: 2, pagina: 2 }),
    ).toEqual({
      ciudad: 'Cali',
      fechaLlegada: undefined,
      fechaSalida: undefined,
      huespedes: 2,
      precioMin: undefined,
      precioMax: undefined,
      tipo: undefined,
      serviciosIds: [],
      pagina: 1,
      tamano: 12,
    })
  })

  it('la página sola no cuenta como filtro', () => {
    expect(hayFiltros({ ...FILTROS_VACIOS, pagina: 4 })).toBe(false)
    expect(hayFiltros({ ...FILTROS_VACIOS, tipo: 'CASA' })).toBe(true)
  })
})

describe('noches: la salida es exclusiva', () => {
  it('del 10 al 14 son cuatro noches', () => {
    expect(contarNoches('2030-12-10', '2030-12-14')).toBe(4)
  })

  it('de un día al siguiente es una noche', () => {
    expect(contarNoches('2030-12-31', '2031-01-01')).toBe(1)
  })

  it('sin noches no hay estadía', () => {
    expect(contarNoches('2030-12-10', '2030-12-10')).toBeNull()
    expect(contarNoches('2030-12-14', '2030-12-10')).toBeNull()
    expect(contarNoches('', '2030-12-10')).toBeNull()
  })

  it('lo describe en noches y con el día de salida', () => {
    const texto = describirEstadia('2030-12-10', '2030-12-14')
    expect(texto).toMatch(/^4 noches: llegas el .*10.* y sales el .*14/)
    expect(describirEstadia('2030-12-10', '2030-12-11')).toMatch(/^1 noche:/)
  })
})

describe('validación del buscador', () => {
  const HOY = '2030-12-01'
  const vacio = { ciudad: '', llegada: '', salida: '', huespedes: '' }

  it('sin datos es válido: muestra todo', () => {
    expect(validarBusqueda(vacio, HOY)).toEqual({})
  })

  it.each([
    [{ llegada: '2030-12-10' }, 'Elige también la fecha de salida.'],
    [{ salida: '2030-12-10' }, 'Elige también la fecha de llegada.'],
    [{ llegada: '2030-11-20', salida: '2030-11-25' }, 'La llegada no puede ser en el pasado.'],
    [
      { llegada: '2030-12-10', salida: '2030-12-10' },
      'La salida debe ser al menos un día después de la llegada.',
    ],
  ])('fechas %j → %s', (fechas, mensaje) => {
    expect(validarBusqueda({ ...vacio, ...fechas }, HOY).fechas).toBe(mensaje)
  })

  it.each(['0', '2.5', '51', 'x'])('rechaza %s huéspedes', (huespedes) => {
    expect(validarBusqueda({ ...vacio, huespedes }, HOY).huespedes).toBe(
      'Indica entre 1 y 50 huéspedes.',
    )
  })
})

describe('rango de precio', () => {
  it('acepta el punto de miles y la coma decimal', () => {
    expect(leerPrecioEscrito('150.000')).toBe(150000)
    expect(leerPrecioEscrito('95000,5')).toBe(95000.5)
    expect(leerPrecioEscrito('')).toBeNull()
    expect(leerPrecioEscrito('mucho')).toBeUndefined()
  })

  it('el mínimo no puede superar al máximo', () => {
    expect(validarPrecios('300000', '100000')).toBe(
      'El precio mínimo no puede ser mayor que el máximo.',
    )
    expect(validarPrecios('100000', '')).toBeNull()
  })
})

describe('páginas visibles', () => {
  it('muestra todas si son pocas', () => {
    expect(paginasVisibles(1, 3)).toEqual([1, 2, 3])
  })

  it('resume las lejanas con «…»', () => {
    expect(paginasVisibles(6, 12)).toEqual([1, '…', 4, 5, 6, 7, 8, '…', 12])
  })
})
