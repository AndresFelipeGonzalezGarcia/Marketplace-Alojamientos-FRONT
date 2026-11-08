import type { ReactNode } from 'react'

export type NombreIcono =
  | 'usuario'
  | 'correo'
  | 'candado'
  | 'ojo'
  | 'ojo-tachado'
  | 'verificacion'

const OJO = (
  <>
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </>
)

const TRAZOS: Record<NombreIcono, ReactNode> = {
  usuario: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
    </>
  ),
  correo: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </>
  ),
  candado: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </>
  ),
  ojo: OJO,
  'ojo-tachado': (
    <>
      {OJO}
      <path d="m4 4 16 16" />
    </>
  ),
  verificacion: <path d="m5 13 4 4L19 7" />,
}

interface IconoProps {
  nombre: NombreIcono
  className?: string
}

function Icono({ nombre, className }: IconoProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {TRAZOS[nombre]}
    </svg>
  )
}

export default Icono
