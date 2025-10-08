# Database Visualizer Backend

A Node.js/Express backend server that provides API endpoints for connecting to PostgreSQL databases and analyzing schema structure.

## Features

- 🔌 **Database Connection**: Connect to PostgreSQL databases with credentials
- 📊 **Schema Analysis**: Extract table structures, columns, and relationships
- 🔍 **Data Inspection**: Retrieve actual data from database tables
- 🛡️ **Security**: Input sanitization and error handling
- 🚀 **Development**: Hot reload with nodemon

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database

### Installation

1. Navigate to backend directory:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Create environment file:

```bash
cp .env.example .env
```

4. Update `.env` with your database credentials (optional for development):

```env
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database_name
DB_USER=your_username
DB_PASSWORD=your_password
```

5. Start development server:

```bash
npm run dev
```

The server will start on `http://localhost:3001`

## API Endpoints

### Health Check

```
GET /api/health
```

Returns server status and timestamp.

### Database Connection

```
POST /api/database/connect
Content-Type: application/json

{
  "host": "localhost",
  "port": "5432",
  "database": "mydb",
  "username": "user",
  "password": "pass"
}
```

### Get Schema Information

```
GET /api/database/schema
```

Returns tables, columns, and relationships.

### Get Table Data

```
GET /api/database/table/:tableName/data?limit=100
```

Returns actual data from specified table.

### Disconnect

```
POST /api/database/disconnect
```

Closes database connection.

## Dependencies

- **express**: Web framework
- **pg**: PostgreSQL client
- **cors**: Cross-origin resource sharing
- **dotenv**: Environment variables
- **nodemon**: Development auto-restart (dev dependency)

## Project Structure

```
backend/
├── server.js              # Main server file
├── routes/
│   └── database.js         # Database API routes
├── services/
│   └── dbService.js        # Database service layer
├── package.json            # Dependencies and scripts
├── .env.example           # Environment template
└── README.md              # This file
```

## Next Steps

1. Test the backend API endpoints
2. Set up the frontend React application
3. Connect frontend to backend APIs
4. Implement the database diagram visualization

## Development Commands

- `npm start` - Production server
- `npm run dev` - Development server with auto-restart
- `npm test` - Run tests (not implemented yet)
