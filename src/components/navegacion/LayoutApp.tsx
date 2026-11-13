import { Outlet } from 'react-router'
import { modoDemoActivo } from '../../auth/sesionDemo'
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
      {modoDemoActivo() && (
        <p className="aviso-modo-demo" role="note">
          Modo de desarrollo: sesión simulada
        </p>
      )}
    </div>
  )
}

export default LayoutApp
