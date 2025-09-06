# Stock Management System

A full-stack stock management application built for small retail stores.

## Tech Stack

### Frontend
- **Next.js 15.5.2** with TypeScript
- **Daisy UI 5.1.7** for component library
- **Tailwind CSS 4** for styling

### Backend
- **Node.js** with Express 5.1.0
- **MariaDB** for database
- **JWT** for authentication
- **bcrypt** for password hashing

## Project Structure

```
├── frontend/          # Next.js frontend application
├── backend/           # Express.js backend API
├── schema.sql         # Database schema
└── tasks.md          # Project planning and tasks
```

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- MariaDB
- npm or yarn

### Backend Setup
1. Navigate to backend directory:
   ```powershell
   cd backend
   ```

2. Install dependencies:
   ```powershell
   npm install
   ```

3. Create `.env` file with your database configuration:
   ```
   PORT=5000
   DB_HOST=localhost
   DB_PORT=3336
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=stock_management
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRES_IN=24h
   ```

4. Set up the database:
   ```powershell
   mariadb -u root -p < schema.sql
   ```

5. Start the development server:
   ```powershell
   npm run dev
   ```

### Frontend Setup
1. Navigate to frontend directory:
   ```powershell
   cd frontend
   ```

2. Install dependencies:
   ```powershell
   npm install
   ```

3. Start the development server:
   ```powershell
   npm run dev
   ```

## Features

### ✅ Completed
- User authentication (register, login, profile)
- Database connection and configuration
- Express server setup with CORS
- JWT middleware for protected routes

### 🚧 In Progress
- Categories API
- Products API
- Stock management API
- Frontend user interface

### 📋 Planned
- Suppliers management
- Sales and invoicing
- Dashboard with analytics
- Inventory reports

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile (protected)

### Users
- `GET /api/users` - Get all users (protected)
- `GET /api/users/:id` - Get user by ID (protected)

## Development

The application is designed to be developed in small incremental chunks:
1. ✅ Backend authentication and database setup
2. 🚧 Core business APIs (categories, products, stock)
3. 📋 Frontend implementation
4. 📋 Advanced features and optimization

## Contributing

This is a learning project focused on building a complete full-stack application with modern web technologies.