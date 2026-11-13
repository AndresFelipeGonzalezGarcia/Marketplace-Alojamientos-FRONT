import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import VistaFoto from './VistaFoto'

describe('VistaFoto', () => {
  it.each(['https://ejemplo.com/foto.jpg', '/fotos/casa.jpg'])(
    'muestra la foto de %s',
    (url) => {
      render(<VistaFoto url={` ${url} `} numero={2} portada={false} />)

      expect(
        screen.getByRole('img', { name: 'Vista previa de la foto 2' }),
      ).toHaveAttribute('src', url)
    },
  )

  it('invita a pegar la dirección cuando está vacía', () => {
    render(<VistaFoto url="" numero={1} portada={false} />)

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(
      screen.getByText('Pega la dirección de la foto para verla aquí.'),
    ).toBeInTheDocument()
  })

  it.each(['foto.jpg', '//otro-sitio.test/a.jpg', 'javascript:alert(1)'])(
    'no intenta cargar %s',
    (url) => {
      render(<VistaFoto url={url} numero={1} portada={false} />)

      expect(screen.queryByRole('img')).not.toBeInTheDocument()
      expect(
        screen.getByText('No pudimos cargar esta foto. Revisa la dirección.'),
      ).toBeInTheDocument()
    },
  )

  it('avisa si la foto no carga', () => {
    render(<VistaFoto url="https://ejemplo.com/rota.jpg" numero={1} portada />)

    fireEvent.error(screen.getByRole('img'))

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(
      screen.getByText('No pudimos cargar esta foto. Revisa la dirección.'),
    ).toBeInTheDocument()
  })

  it('marca la portada', () => {
    render(<VistaFoto url="" numero={1} portada />)

    expect(screen.getByText('Portada')).toBeInTheDocument()
  })
})
