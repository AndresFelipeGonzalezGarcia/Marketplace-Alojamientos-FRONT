import { useId } from 'react'
import DiaCalendario, { type EstadoDia } from './DiaCalendario'
import { nombreMes, semanasDelMes } from './fechasCalendario'

interface MesCalendarioProps {
  mes: string
  estadoDia: (fecha: string) => EstadoDia
  foco: string
  onElegir: (fecha: string) => void
}

const DIAS_SEMANA = [
  ['L', 'lunes'],
  ['M', 'martes'],
  ['M', 'miércoles'],
  ['J', 'jueves'],
  ['V', 'viernes'],
  ['S', 'sábado'],
  ['D', 'domingo'],
]

function MesCalendario({ mes, estadoDia, foco, onElegir }: MesCalendarioProps) {
  const idTitulo = useId()

  return (
    <div className="mes-calendario">
      <h3 className="mes-calendario__titulo" id={idTitulo}>
        {nombreMes(mes)}
      </h3>
      <table className="mes-calendario__tabla" role="grid" aria-labelledby={idTitulo}>
        <thead>
          <tr>
            {DIAS_SEMANA.map(([corto, largo]) => (
              <th key={largo} scope="col" abbr={largo}>
                <span aria-hidden="true">{corto}</span>
                <span className="solo-lector">{largo}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {semanasDelMes(mes).map((semana, indice) => (
            <tr key={indice}>
              {semana.map((fecha, columna) => (
                <td key={fecha ?? `vacio-${columna}`}>
                  {fecha && (
                    <DiaCalendario
                      dia={estadoDia(fecha)}
                      enfocable={fecha === foco}
                      onElegir={onElegir}
                    />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default MesCalendario
