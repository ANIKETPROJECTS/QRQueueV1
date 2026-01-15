# Cafe 2020 Queue System

## Overview

A cafe queue management system that allows customers to join a virtual queue by scanning a QR code and entering their details. The application tracks queue positions and enables customers to monitor their status in real-time.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight alternative to React Router)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom cafe-themed color palette (brown/neutral tones)
- **Animations**: Framer Motion for UI transitions
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Vite with custom plugins for Replit integration

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript (ESM modules)
- **Database**: MongoDB with Mongoose ODM
- **API Design**: RESTful endpoints defined in shared routes module
- **Validation**: Zod schemas shared between client and server

### Data Layer
- **Primary Database**: MongoDB (requires MONGODB_URI environment variable)
- **Schema Definition**: Zod schemas in `shared/schema.ts` for type-safe validation
- **Storage Pattern**: Repository pattern via `MongoStorage` class in `server/storage.ts`

### Project Structure
```
├── client/           # React frontend
│   └── src/
│       ├── components/ui/  # shadcn/ui components
│       ├── pages/          # Route components (home, status)
│       ├── hooks/          # Custom React hooks
│       └── lib/            # Utilities and query client
├── server/           # Express backend
│   ├── models/       # Mongoose models
│   ├── routes.ts     # API route handlers
│   └── storage.ts    # Database abstraction layer
├── shared/           # Shared code between client/server
│   ├── schema.ts     # Zod validation schemas
│   └── routes.ts     # API route definitions
└── migrations/       # Drizzle migrations (PostgreSQL config present but MongoDB used)
```

### API Structure
Routes are defined in `shared/routes.ts` with typed inputs and outputs:
- `GET /api/queue` - List all waiting queue entries
- `GET /api/queue/:id` - Get specific queue entry
- `GET /api/queue/phone/:phoneNumber` - Find entry by phone number
- `POST /api/queue` - Create new queue entry
- `PATCH /api/queue/:id/cancel` - Cancel queue entry
- `GET /api/queue/:id/position` - Get current position in queue

### Development vs Production
- **Development**: Vite dev server with HMR, served through Express middleware
- **Production**: Built client served as static files, bundled server with esbuild

## External Dependencies

### Database
- **MongoDB**: Primary data store (connection via MONGODB_URI environment variable)
- Note: Drizzle/PostgreSQL configuration exists but is not actively used; MongoDB is the actual database

### UI Libraries
- **Radix UI**: Accessible component primitives (dialogs, forms, menus, etc.)
- **Framer Motion**: Animation library
- **Lucide React**: Icon library
- **Embla Carousel**: Carousel component
- **Recharts**: Charting library

### Development Tools
- **Replit Plugins**: Error overlay, cartographer, and dev banner for Replit environment
- **ESBuild**: Server bundling for production
- **TypeScript**: Type checking across all code