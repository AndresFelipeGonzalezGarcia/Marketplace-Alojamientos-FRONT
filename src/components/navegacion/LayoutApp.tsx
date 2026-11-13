import { Outlet } from 'react-router'
import EncabezadoApp from './EncabezadoApp'
import './navegacion.css'

function LayoutApp() {
  return (
    <div className="app">
      <a className="saltar-contenido" href="#contenido">
        Saltar al contenido
      </a>
      <EncabezadoApp />
      <div className="app__contenido" id="contenido" tabIndex={-1}>
        <Outlet />
      </div>
    </div>
  )
}

export default LayoutApp
