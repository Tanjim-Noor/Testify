# Online Exam Management System — Frontend

React + TypeScript + Vite starter for the Online Exam Management System. This workspace provides the foundations for the Admin and Student portals, powered by Material UI, Zustand, Axios, and React Router.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server (runs on `http://localhost:3000`):
   ```bash
   npm run dev
   ```
3. Create a `.env` file (copy from `.env.example`) so the runtime picks up the expected API settings.

## Environment Variables

| Variable | Description |
| --- | --- |
| `VITE_API_BASE_URL` | Base URL for backend APIs (defaults to `http://localhost:8000`). |
| `VITE_APP_NAME` | Human-readable project name displayed in the UI. |
| `VITE_APP_VERSION` | Frontend version string for telemetry or display. |

Copy `.env.example` into `.env` and adjust the values for your local or deployment environment. The `.env` file is ignored by git.

## Available Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Starts Vite dev server on port `3000` with the configured proxy. |
| `npm run build` | Runs the TypeScript builds and bundles the app for production. |
| `npm run preview` | Serves the production build locally for smoke testing. |
| `npm run lint` | Runs ESLint over the `src` directory. |

## Folder Structure

```
frontend/
├── public/             # Static assets copied to the build output
├── src/
│   ├── api/            # API clients and services
│   ├── components/     # React components organized by domain
│   ├── hooks/          # Custom React hooks
│   ├── store/          # Zustand stores for shared state
│   ├── theme/          # Material UI theme configuration
│   ├── types/          # Shared TypeScript definitions
│   ├── utils/          # Axios/logging utilities and helpers
│   └── main.tsx        # Application entry point
├── .env.example        # Template for environment variables
├── package.json        # Scripts and dependency list
├── tsconfig.*.json     # TypeScript configuration
└── vite.config.ts      # Build tool configuration with aliases and proxy
```

## Development Guidelines

- Use the centralized Material UI `ThemeProvider` in `src/theme/index.ts` and wrap new views with `CssBaseline`.
- Prefer functional components and hooks (Zustand stores for shared data, React Hook Form for forms).
- Keep Axios calls centralized in `src/utils/axios.ts` and surface errors via the logger or UI feedback.
- Use strict TypeScript settings (`tsconfig.app.json`) and path aliases (`@/...`) to keep imports clean.
- Add new pages under `components/admin` or `components/student` as appropriate, and export them through the relevant barrel files.

## Backend Integration

- The dev server proxies `/api` requests to `http://localhost:8000`, matching the FastAPI backend.
- Configure `VITE_API_BASE_URL` to a production endpoint when deploying.
- Keep tokens in a secure store (e.g., `localStorage` or Zustand) before they are attached via the Axios interceptor.

## Next Steps

- Build authentication state in `src/store` and `src/hooks/useAuth.ts`.
- Create API services inside `src/api` that leverage `src/utils/apiClient`.
- Implement navigation, routing, and role-based layouts before adding domain-specific pages.# Online Exam Management System — Frontend

React + TypeScript + Vite starter for the Online Exam Management System. This workspace provides the foundations for the Admin and Student portals, powered by Material UI, Zustand, Axios, and React Router.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server (runs on `http://localhost:3000`):
   ```bash
   npm run dev
   ```
3. Create a `.env` file (copy from `.env.example`) so the runtime picks up the expected API settings.

## Environment Variables

| Variable | Description |
| --- | --- |
| `VITE_API_BASE_URL` | Base URL for backend APIs (defaults to `http://localhost:8000`). |
| `VITE_APP_NAME` | Human-readable project name displayed in the UI. |
| `VITE_APP_VERSION` | Frontend version string for telemetry or display. |

Copy `.env.example` into `.env` and adjust the values for your local or deployment environment. The `.env` file is ignored by git.

## Available Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Starts Vite dev server on port `3000` with the configured proxy. |
| `npm run build` | Runs the TypeScript builds and bundles the app for production. |
| `npm run preview` | Serves the production build locally for smoke testing. |
| `npm run lint` | Runs ESLint over the `src` directory. |

## Folder Structure

```
frontend/
├── public/             # Static assets copied to the build output
├── src/
│   ├── api/            # API clients and services
│   ├── components/     # React components organized by domain
│   ├── hooks/          # Custom React hooks
│   ├── store/          # Zustand stores for shared state
│   ├── theme/          # Material UI theme configuration
   ├── types/          # Shared TypeScript definitions
│   ├── utils/          # Axios/logging utilities and helpers
│   └── main.tsx        # Application entry point
├── .env.example        # Template for environment variables
├── package.json        # Scripts and dependency list
├── tsconfig.*.json     # TypeScript configuration
└── vite.config.ts      # Build tool configuration with aliases and proxy
```

## Development Guidelines

- Use the centralized Material UI `ThemeProvider` in `src/theme/index.ts` and wrap new views with `CssBaseline`.
- Prefer functional components and hooks (Zustand stores for shared data, React Hook Form for forms).
- Keep Axios calls centralized in `src/utils/axios.ts` and surface errors via the logger or UI feedback.
- Use strict TypeScript settings (`tsconfig.app.json`) and path aliases (`@/...`) to keep imports clean.
- Add new pages under `components/admin` or `components/student` as appropriate, and export them through the relevant barrel files.

## Backend Integration

- The dev server proxies `/api` requests to `http://localhost:8000`, matching the FastAPI backend.
- Configure `VITE_API_BASE_URL` to a production endpoint when deploying.
- Keep tokens in a secure store (e.g., `localStorage` or Zustand) before they are attached via the Axios interceptor.

## Next Steps

- Build authentication state in `src/store` and `src/hooks/useAuth.ts`.
- Create API services inside `src/api` that leverage `src/utils/apiClient`.
- Implement navigation, routing, and role-based layouts before adding domain-specific pages.# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is currently not compatible with SWC. See [this issue](https://github.com/vitejs/vite-plugin-react/issues/428) for tracking the progress.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
