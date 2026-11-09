import { describe, expect, it } from 'vitest'
import {
  formatearFecha,
  hoyEnBogota,
  ordenarPorInicio,
  validarPeriodo,
} from './validacionPeriodo'

const HOY = '2026-11-10'

describe('validarPeriodo', () => {
  it('exige ambas fechas', () => {
    expect(validarPeriodo({ fechaInicio: '', fechaFin: '' }, HOY)).toEqual({
      fechaInicio: 'La fecha de inicio es obligatoria.',
      fechaFin: 'La fecha final es obligatoria.',
    })
  })

  it('rechaza un fin anterior al inicio', () => {
    expect(
      validarPeriodo({ fechaInicio: '2026-12-10', fechaFin: '2026-12-09' }, HOY),
    ).toEqual({
      fechaFin: 'La fecha final no puede ser anterior a la inicial.',
    })
  })

  it('acepta inicio y fin el mismo día, porque son inclusivos', () => {
    expect(
      validarPeriodo({ fechaInicio: '2026-12-10', fechaFin: '2026-12-10' }, HOY),
    ).toEqual({})
  })

  it('acepta empezar hoy y rechaza empezar ayer', () => {
    expect(
      validarPeriodo({ fechaInicio: HOY, fechaFin: HOY }, HOY),
    ).toEqual({})
    expect(
      validarPeriodo({ fechaInicio: '2026-11-09', fechaFin: HOY }, HOY),
    ).toEqual({ fechaInicio: 'El periodo no puede empezar en el pasado.' })
  })
})

describe('hoyEnBogota', () => {
  it('usa la fecha de Bogotá aunque en UTC ya sea el día siguiente', () => {
    expect(hoyEnBogota(new Date('2026-12-01T03:00:00Z'))).toBe('2026-11-30')
  })

  it('cambia de día a medianoche de Bogotá', () => {
    expect(hoyEnBogota(new Date('2026-12-01T05:00:00Z'))).toBe('2026-12-01')
  })
})

describe('utilidades', () => {
  it('formatea la fecha sin correrla por la zona horaria', () => {
    expect(formatearFecha('2026-12-01')).toBe('1 de diciembre de 2026')
  })

  it('ordena por fecha de inicio', () => {
    const tardio = { fechaInicio: '2027-01-01', fechaFin: '2027-01-02' }
    const temprano = { fechaInicio: '2026-12-01', fechaFin: '2026-12-02' }

    expect(ordenarPorInicio([tardio, temprano])).toEqual([temprano, tardio])
  })
})
