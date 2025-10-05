# Cafe Sundus - Sales and Inventory Management System

This project is cafesundus and inventory management system for cafes and small retail businesses, with full support for Arabic and English languages.

## Project Structure

The project consists of three main components:

- **Backend**: Node.js API server with Express
- **Frontend**: React application with Material-UI
- **Database**: PostgreSQL database

## Features

- User-friendly and responsive interface
- Multilingual support (Arabic and English) with seamless switching
- Automatic page direction change (RTL/LTR) based on language
- Integrated Point of Sale (POS) system
- Product and category management
- Customer management
- Dashboard with statistics and charts
- Online ordering system
- Inventory tracking
- Sales reporting

## Requirements

- Node.js (version 18.16.0 or later)
- npm or yarn
- MySQL database

## Installation and Setup

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

## Running the Application

### Development Mode

```bash
# Start backend server
cd backend
npm start

# Start frontend development server
cd ../frontend
npm start
```

### Production Mode

```bash
# Build frontend
cd frontend
npm run build

# Start backend server (which will serve the frontend build)
cd ../backend
npm start
```

## Translation System

The project uses i18next for translations with dynamic loading of translation files from the server.

## License

This project is proprietary software owned by Cafe Sundus.

## Update

Minor housekeeping change to trigger CI/deployment.