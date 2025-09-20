# Healthcare Notes App - Comprehensive Documentation

## Project Overview

The Healthcare Notes App is a full-stack web application for healthcare organizations to manage notes across a hierarchical structure: Organizations → Teams → Clients → Episodes. Built with SolidJS frontend, Express.js backend, and SQLite database.

## Technology Stack

### Frontend
- **SolidJS 1.8.7**: Reactive framework
- **Vite 5.0.0**: Build tool
- **Bootstrap 5.3.8**: UI framework
- **@solidjs/router 0.10.5**: Routing
- **Solid Icons & Font Awesome**: Icons

### Backend
- **Node.js ≥20.0.0**: Runtime
- **Express.js 4.18.2**: Web framework
- **SQLite + better-sqlite3**: Database
- **Drizzle ORM 0.44.5**: Database ORM
- **JWT + bcryptjs**: Authentication
- **CORS**: Cross-origin support

## Architecture

```
Frontend (Port 3000) ←→ Backend (Port 3001) ←→ SQLite Database
    SolidJS                Express.js              File-based
```

## Database Schema

### Tables
1. **users**: Authentication (id, username, password, email, name, role)
2. **hierarchy_nodes**: All hierarchy items (id, type, name, timestamps)
3. **hierarchy_closure**: Relationships (ancestor, descendant, depth)
4. **notes**: Notes (id, content, attached_to_id, attached_to_type, tags)

### Hierarchy Types
- `organisation`: Top level (hospitals, clinics)
- `team`: Departments within organizations
- `client`: Patients/clients within teams
- `episode`: Specific visits/cases for clients
`
## Key Features

### 1. Hierarchical Organization
- Four-level hierarchy with flexible note attachment
- Closure table pattern for efficient querying
- Cascading deletes maintain data integrity

### 2. Authentication System
- JWT-based authentication with 24h expiry
- Secure password hashing (bcryptjs)
- Session persistence via localStorage

### 3. Search & Tags System
- Real-time search across all notes
- Predefined tags: Urgent (red), Follow-up (orange), Medication (purple), Assessment (blue)
- Tag-based filtering with visual indicators

### 4. Responsive UI
- Bootstrap-based responsive design
- Mobile-friendly interface
- Consistent component styling

## API Endpoints

### Authentication
- `POST /api/auth/login`: User login
- `POST /api/auth/signup`: User registration

### Data Management
- `GET /api/data`: Get all hierarchical data
- `POST /api/{type}s`: Create hierarchy items (organisations, teams, clients, episodes)
- `PUT /api/{type}s/:id`: Update items
- `DELETE /api/{type}s/:id`: Delete items (cascading)

### Notes
- `POST /api/notes`: Create note
- `PUT /api/notes/:id`: Update note
- `DELETE /api/notes/:id`: Delete note

## Component Structure

### Core Components
- **App.jsx**: Main application wrapper
- **AuthContainer.jsx**: Authentication flow
- **Sidebar.jsx**: Hierarchical navigation tree
- **MainContent.jsx**: Note display and management
- **SearchBar.jsx**: Search and tag filtering

### Modal Components
- **AddItemModal.jsx**: Add hierarchy items
- **AddNoteModal.jsx**: Add notes with tags
- **EditNoteModal.jsx**: Edit existing notes
- **DeleteConfirmationModal.jsx**: Confirm deletions

### Form Components
- **LoginForm.jsx**: User authentication
- **SignupForm.jsx**: User registration
- **AddNoteForm.jsx**: Quick note creation

## State Management

### Global State (store.js)
```javascript
// Data state
const [data, setData] = createSignal({
  organisations: [], teams: [], clients: [], episodes: [], notes: []
});

// UI state
const [selectedItem, setSelectedItem] = createSignal(null);
const [selectedType, setSelectedType] = createSignal(null);

// Search state
const [searchQuery, setSearchQuery] = createSignal('');
const [selectedTags, setSelectedTags] = createSignal([]);
```

### Authentication State (auth.js)
```javascript
const [isAuthenticated, setIsAuthenticated] = createSignal(false);
const [user, setUser] = createSignal(null);
const [token, setToken] = createSignal(null);
```

## Step-by-Step Build Guide

### 1. Project Setup
```bash
mkdir healthcare-notes-app && cd healthcare-notes-app
npm init -y
```

### 2. Install Dependencies
```bash
# Frontend
npm install @solidjs/router solid-js solid-icons vite vite-plugin-solid bootstrap

# Backend
npm install express cors express-session bcryptjs jsonwebtoken better-sqlite3 drizzle-orm drizzle-kit

# Dev Dependencies
npm install --save-dev @types/better-sqlite3 @types/node concurrently nodemon
```

### 3. Create Directory Structure
```bash
mkdir -p src/components server/db/migrations server/data public
```

### 4. Configuration Files

**package.json scripts:**
```json
{
  "scripts": {
    "dev": "concurrently \"npm run server\" \"npm run client\"",
    "client": "vite",
    "server": "nodemon server/index.js",
    "build": "vite build",
    "start": "npm run build && npm run migrate && node server/index.js"
  }
}
```

**vite.config.js:**
```javascript
import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';

export default defineConfig({
  plugins: [solid()],
  server: { port: 3000, host: true }
});
```

### 5. Database Setup

**server/db/schema.js:**
Define tables using Drizzle ORM schema

**server/db/connection.js:**
Setup SQLite connection with Drizzle

**server/db/hierarchy-utils.js:**
Implement closure table operations for hierarchy management

### 6. Backend Implementation

**server/index.js:**
- Express server setup
- CORS and session middleware
- JWT authentication middleware
- API routes for auth, data, and CRUD operations

### 7. Frontend Implementation

**src/index.jsx:** Application entry point
**src/App.jsx:** Main component with authentication wrapper
**src/auth.js:** Authentication state and API calls
**src/store.js:** Global state management
**src/styles.css:** Custom styles

### 8. Component Development

Create components in order:
1. Authentication components (LoginForm, SignupForm, AuthContainer)
2. Layout components (App, Sidebar, MainContent)
3. Feature components (SearchBar, NotesList, Breadcrumb)
4. Modal components (AddItemModal, AddNoteModal, etc.)

### 9. Testing & Development

```bash
npm run dev  # Start development servers
```

Test features:
- User registration/login
- Hierarchy creation and navigation
- Note creation, editing, deletion
- Search and tag filtering
- Responsive design

### 10. Production Build

```bash
npm run build    # Build for production
npm run preview  # Test production build
npm start        # Run production server
```

## Development Workflow

### 1. Local Development
- Run `npm run dev` to start both client and server
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- Database: SQLite file in server/db/

### 2. Database Management
- `npm run db:generate`: Generate migrations
- `npm run db:migrate`: Run migrations
- `npm run migrate`: Custom migration script

### 3. Code Organization
- Keep components small and focused
- Use SolidJS signals for reactive state
- Implement proper error handling
- Follow Bootstrap conventions for styling

### 4. Security Considerations
- JWT tokens with reasonable expiry
- Password hashing with bcryptjs
- Input validation on both client and server
- CORS configuration for production

## Deployment

### Environment Variables
```bash
NODE_ENV=production
PORT=3001
JWT_SECRET=your-secure-secret
```

### Production Checklist
- [ ] Set secure JWT secret
- [ ] Configure CORS for production domain
- [ ] Set up SSL certificate
- [ ] Configure reverse proxy (nginx)
- [ ] Set up process manager (PM2)
- [ ] Database backup strategy
- [ ] Monitor application logs

This documentation provides a complete guide to understanding, building, and deploying the Healthcare Notes App from scratch.
