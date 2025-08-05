# Overview

This is a full-stack web application for eBay API integration. The application provides a user interface for managing eBay API credentials and authentication, featuring a modern React frontend with Express backend. The system handles OAuth 2.0 authentication with eBay's API, supporting both sandbox and production environments.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript
- **UI Library**: shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack React Query for server state, React Hook Form for form handling
- **Routing**: Wouter for client-side routing
- **Build Tool**: Vite with hot module replacement

## Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Design**: RESTful endpoints under `/api` prefix
- **Data Storage**: In-memory storage with interface for potential database integration
- **Authentication**: OAuth 2.0 client credentials flow with eBay API
- **Environment Support**: Configurable sandbox/production eBay environments

## Data Storage Solutions
- **Current Implementation**: In-memory storage using Map data structure
- **Database Schema**: Drizzle ORM with PostgreSQL schema defined for future database integration
- **Migration Support**: Drizzle Kit for database migrations when database is connected

## Authentication and Authorization
- **eBay OAuth 2.0**: Client credentials flow for application-level access
- **Token Management**: Automatic token storage and expiration tracking
- **Environment Isolation**: Separate credentials handling for sandbox vs production

## External Dependencies
- **UI Components**: Extensive Radix UI component library for accessible interfaces
- **Database**: Neon Database serverless PostgreSQL (configured but not actively used)
- **eBay API**: Integration with eBay's RESTful API for marketplace operations
- **Styling**: Tailwind CSS with PostCSS for advanced styling capabilities
- **Development**: Replit-specific plugins for development environment integration