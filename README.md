# Marketplace de Alojamientos - Front

Aplicación web con React, TypeScript, Vite y React Router.

## Requisitos

- Node.js 22.22 o superior
- npm

## Instalación

```bash
npm install
cp .env.example .env
```

En `.env`, ajusta `VITE_API_URL` con la URL del backend.

## Ejecución

```bash
npm run dev
```

La aplicación queda disponible en <http://localhost:5173>.

## Scripts

| Comando              | Descripción                            |
| -------------------- | -------------------------------------- |
| `npm run dev`        | Servidor de desarrollo                 |
| `npm run build`      | Comprobación de tipos y build          |
| `npm run preview`    | Sirve localmente el build              |
| `npm run lint`       | Revisión con ESLint                    |
| `npm test`           | Pruebas con Vitest (una sola ejecución) |
| `npm run test:watch` | Pruebas en modo observación            |
