# HOSCORE Hospital Management Client

HOSCORE is a premium, multi-tenant hospital network platform that digitalizes clinical operations, multi-role dashboards, and patient medical record histories in real-time.

## Features & Technologies

- **React 19 & Vite 8**: Modern, ultra-fast UI rendering.
- **Tailwind CSS v4**: Utility-first CSS compiling with modern styling rules.
- **TypeScript 5**: Strict types for frontend and database schema model synchronization.
- **Recharts Data Visualization**: Highly responsive graphs for telemetry monitoring.
- **Collapsible Sidebar**: A smooth side navigation menu that saves space for dashboards.
- **Glassmorphic Aesthetics**: Semi-transparent dark styling, soft glowing accents, and premium keyframe reveals.

## Architecture Highlights

1. **Centralized Types (`src/types/index.ts`)**: Structured typings derived directly from the PostgreSQL/SQLite Prisma schema mapping.
2. **Custom Utility Hooks (`src/hooks/`)**:
   - `useApi<T>`: Generic state wrapper for fetching resources from the network base.
   - `useDebounce<T>`: Simple query debounce to throttle client list inputs.
   - `useAnimatedCounter`: Multi-step easing counter to reveal dashboard values elegantly.
3. **Design System (`src/index.css`)**: Dark background tokens (`#060913` to `#0a0f1d`), backdrop filters, staggered animation keyframes, and custom badge elements.

## Running Locally

To start the local development server:

```bash
# Install packages
npm install

# Run Vite in dev mode
npm run dev
```

To compile and check types:

```bash
npm run build
```
