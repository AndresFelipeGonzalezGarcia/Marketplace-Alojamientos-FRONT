import { describe, expect, it } from 'vitest'
import { leerEstadia } from './estadia'
import { nombreMes, semanasDelMes, sumarMeses, ultimoDia } from './fechasCalendario'
import { nochesLibres, puedeLlegar, puedeSalir, salidaMaxima } from './seleccionEstadia'

// Disponibilidad de prueba
const disponible = (fecha: string) =>
  fecha >= '2030-04-10' && fecha <= '2030-04-14' ? true : fecha === '2030-04-15' ? false : undefined

describe('fechas del calendario', () => {
  it('arma las semanas de lunes a domingo', () => {
    // Fecha de prueba
    const semanas = semanasDelMes('2030-03')
    expect(semanas[0]).toEqual([null, null, null, null, '2030-03-01', '2030-03-02', '2030-03-03'])
    expect(semanas.at(-1)).toEqual(['2030-03-25', '2030-03-26', '2030-03-27', '2030-03-28', '2030-03-29', '2030-03-30', '2030-03-31'])
    expect(semanas.flat().filter(Boolean)).toHaveLength(31)
  })

  it('suma meses cruzando el año y conoce los bisiestos', () => {
    expect(sumarMeses('2030-12', 1)).toBe('2031-01')
    expect(sumarMeses('2030-01', -1)).toBe('2029-12')
    expect(ultimoDia('2028-02')).toBe('2028-02-29')
    expect(nombreMes('2030-12')).toBe('Diciembre de 2030')
  })
})

describe('reglas de selección', () => {
  it('solo se llega a un día libre y no pasado', () => {
    expect(puedeLlegar('2030-04-10', '2030-04-01', disponible)).toBe(true)
    expect(puedeLlegar('2030-04-15', '2030-04-01', disponible)).toBe(false)
    expect(puedeLlegar('2030-04-10', '2030-04-11', disponible)).toBe(false)
  })

  it('la salida es exclusiva: se puede salir el primer día ocupado, no después', () => {
    expect(salidaMaxima('2030-04-10', disponible)).toBe('2030-04-15')
    expect(puedeSalir('2030-04-15', '2030-04-10', disponible)).toBe(true)
    expect(puedeSalir('2030-04-16', '2030-04-10', disponible)).toBe(false)
    expect(puedeSalir('2030-04-10', '2030-04-10', disponible)).toBe(false)
  })

  it('comprueba las noches de una estadía sin contar la salida', () => {
    expect(nochesLibres('2030-04-10', '2030-04-15', disponible)).toBe(true)
    expect(nochesLibres('2030-04-10', '2030-04-16', disponible)).toBe(false)
    expect(nochesLibres('2030-04-01', '2030-04-11', disponible)).toBeUndefined()
  })

  it('lee de la URL solo estadías completas, con noches y no pasadas', () => {
    const leer = (texto: string) => leerEstadia(new URLSearchParams(texto), '2030-04-01')
    expect(leer('llegada=2030-04-10&salida=2030-04-14')).toEqual({
      llegada: '2030-04-10',
      salida: '2030-04-14',
      noches: 4,
    })
    expect(leer('llegada=2030-04-10')).toBeNull()
    expect(leer('llegada=2030-04-10&salida=2030-04-10')).toBeNull()
    expect(leer('llegada=2030-03-30&salida=2030-04-02')).toBeNull()
    expect(leer('llegada=2030-02-30&salida=2030-03-02')).toBeNull()
  })
})
