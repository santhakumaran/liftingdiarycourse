# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 16 application named "liftingdiarycourse" built with TypeScript, React 19, and Tailwind CSS v4. The project uses the Next.js App Router architecture with a modern setup.

## Development Commands

### Running the Application
- `npm run dev` - Start development server (http://localhost:3000)
- `npm run build` - Build production bundle
- `npm start` - Start production server
- `npm run lint` - Run ESLint for code quality checks

## Tech Stack & Configuration

### Core Framework
- **Next.js 16.0.5** with App Router
- **React 19.2.0** (latest stable)
- **TypeScript 5** with strict mode enabled

### Styling
- **Tailwind CSS v4** with PostCSS plugin (@tailwindcss/postcss)
- Custom CSS variables for theming (light/dark mode support)
- Geist Sans and Geist Mono fonts from next/font/google

### TypeScript Configuration
- Path alias: `@/*` maps to `./src/*`
- Target: ES2017
- Strict mode enabled
- Module resolution: bundler

## Project Structure

```
src/
└── app/              # App Router directory
    ├── layout.tsx    # Root layout with font configuration
    ├── page.tsx      # Home page
    ├── globals.css   # Global styles with Tailwind imports
    └── favicon.ico   # Site favicon
```

## Architecture Notes

### App Router Pattern
This project uses Next.js App Router (not Pages Router). All routes are file-based within `src/app/`:
- `layout.tsx` files define nested layouts
- `page.tsx` files define route pages
- Server Components by default (use 'use client' directive for client components)

### Styling System
- Tailwind CSS v4 with inline theme configuration in globals.css
- CSS variables for background/foreground colors with dark mode support
- Font variables (--font-geist-sans, --font-geist-mono) configured in layout.tsx

### ESLint Setup
Uses Next.js recommended configs:
- eslint-config-next/core-web-vitals
- eslint-config-next/typescript
- Ignores: .next/, out/, build/, next-env.d.ts
