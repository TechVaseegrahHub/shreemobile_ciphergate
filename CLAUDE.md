# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Backend (server)
- Start development server: `npm run dev` (uses nodemon)
- Start production server: `npm start`
- Install dependencies: `npm install`

### Frontend (client)
- Start development server: `npm start` (uses react-app-rewired)
- Build for production: `npm run build`
- Run tests: `npm test`
- Install dependencies: `npm install`

## Project Architecture

### Backend Structure
- **Entry point**: `server.js` - Express app setup and server listening
- **Database connection**: `config/db.js` - MongoDB connection via Mongoose
- **Models**: `models/` - Mongoose schemas for entities like Admin, Customer, Worker, Job, Transaction, etc.
- **Routes**: `routes/` - REST API controllers organized by resource (auth, customers, workers, jobs, transactions, etc.)
- **Middleware**: `middleware/authMiddleware.js` - Authentication and authorization logic
- **Configuration**: Uses environment variables via dotenv

### Frontend Structure
- **Build tool**: Create React App with react-app-rewired for configuration overrides
- **Styling**: TailwindCSS
- **State management**: React hooks and context (check components for implementation)
- **Routing**: React Router DOM v6
- **Data fetching**: Axios for API calls
- **Charts**: Recharts library for data visualization
- **Face detection**: TensorFlow.js and face-api.js for facial recognition features

## Key Conventions

### API Endpoints
All backend API routes are prefixed with `/api/` and follow REST conventions:
- Authentication: `/api/auth`
- Customers: `/api/customers`
- Workers: `/api/workers`
- Jobs: `/api/jobs`
- Transactions: `/api/transactions`
- Departments: `/api/departments`
- Inventory: `/api/inventory`
- Purchases: `/api/purchases`
- Suppliers: `/api/suppliers`
- Batches: `/api/batches`
- Holidays: `/api/holidays`
- Admin: `/api/admin`
- Dashboard: `/api/dashboard`
- WhatsApp: `/api/whatsapp`

### Environment Variables
Backend requires `.env` file with:
- `PORT` - Server port (default: 5001)
- `MONGO_URI` - MongoDB connection string
- `DEFAULT_ADMIN_USERNAME` - Default admin username
- `DEFAULT_ADMIN_PASSWORD` - Default admin password
- `DEFAULT_ADMIN_EMAIL` - Default admin email
- `JWT_SECRET` - For token signing

### Data Flow
1. Frontend React components make Axios requests to `/api/*` endpoints
2. Express routes validate requests and interact with Mongoose models
3. Mongoose models interact with MongoDB database
4. Responses sent back as JSON to frontend
5. Frontend updates UI based on API responses

## Common Development Tasks

### Backend Development
- To add a new API endpoint: Create a new file in `routes/` and import it in `server.js`
- To create a new data model: Add a schema file in `models/` and export the Mongoose model
- To add middleware: Create a file in `middleware/` and apply it in `server.js` or specific routes
- Environment variables are loaded automatically via `dotenv.config()`

### Frontend Development
- Components are organized in `src/components/`
- Pages are organized in `src/pages/`
- Utility functions are in `src/utils/`
- Styles use TailwindCSS utility classes
- API calls typically use axios instance configured with proxy to backend

## Getting Started
1. Install dependencies for both projects:
   ```bash
   cd server && npm install
   cd ../client && npm install
   ```
2. Set up environment variables in `server/.env` (copy from example if available)
3. Start both servers in separate terminals:
   - Backend: `cd server && npm run dev`
   - Frontend: `cd client && npm start`