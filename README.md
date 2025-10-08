# 🗃️ Database Visualizer

A modern, interactive PostgreSQL database schema visualizer built with React, TypeScript, and Node.js. Transform your database structure into beautiful, interactive diagrams with real-time data exploration.

![Database Visualizer Demo](docs/demo-screenshot.png)

## ✨ Features

### 🎯 **Core Functionality**
- **Real-time Schema Visualization** - Connect to PostgreSQL and visualize your database structure instantly
- **Interactive Table Nodes** - Color-coded tables with detailed column information
- **Data Exploration** - Click any table to view actual database records in a side panel
- **Relationship Mapping** - Automatic detection and visualization of foreign key relationships

### 🎨 **Visual Design**
- **Color-coded Tables** - Automatic table grouping by naming patterns (users, orders, products, etc.)
- **Professional UI** - Clean, modern interface built with Tailwind CSS
- **Custom Node Styling** - Beautiful table cards with primary/foreign key highlighting
- **Responsive Design** - Works perfectly on desktop and tablet devices

### 📊 **Export & Sharing**
- **PDF Export** - Generate high-quality PDF documentation of your schema
- **PNG Export** - Create images for presentations and documentation
- **Interactive Controls** - Zoom, pan, and navigate large database schemas

### 🔧 **Developer Experience**
- **TypeScript** - Full type safety across the entire application
- **Hot Reload** - Instant development feedback with Vite
- **Docker Support** - Easy database setup for testing
- **Comprehensive Error Handling** - Proper error messages and validation

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- PostgreSQL database
- Docker (optional, for test database)

### 1. Clone and Install
```bash
git clone https://github.com/yourusername/database-visualizer.git
cd database-visualizer

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies  
cd ../frontend
npm install
```

### 2. Set Up Database (Optional Test Database)
```bash
# Start the included test PostgreSQL database
docker-compose up -d

# This creates a database with sample blog schema:
# - users, posts, comments, categories, tags, post_tags
# - Sample data with realistic relationships
```

### 3. Configure Environment
```bash
# Create backend/.env
echo "PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=test_db
DB_USER=root
DB_PASSWORD=root" > backend/.env
```

### 4. Start Development Servers
```bash
# Terminal 1: Start backend (from project root)
cd backend && npm run dev

# Terminal 2: Start frontend (from project root)  
cd frontend && npm run dev
```

### 5. Open Application
- Navigate to `http://localhost:5174`
- Use the connection form with your database credentials
- Explore your database schema!

## 🏗️ Architecture

### Backend (Node.js + Express)
```
backend/
├── server.js              # Main Express server
├── routes/
│   └── database.js        # API endpoints
├── services/
│   └── dbService.js       # Database connection & queries
└── package.json
```

### Frontend (React + TypeScript + Vite)
```
frontend/
├── src/
│   ├── components/
│   │   ├── ConnectionForm.tsx    # Database connection UI
│   │   ├── DataPanel.tsx         # Table data viewer
│   │   └── TableNode.tsx         # Custom React Flow nodes
│   ├── services/
│   │   └── api.ts               # Backend API client
│   ├── utils/
│   │   └── exportUtils.ts       # PDF/PNG export logic
│   └── App.tsx                  # Main application
└── package.json
```

## 🔌 Database Connection

The visualizer connects to any PostgreSQL database. Supported connection parameters:

- **Host** - Database server hostname
- **Port** - Database port (typically 5432)
- **Database** - Database name
- **Username** - Database user
- **Password** - User password

### Example Connections
```javascript
// Local development database
{
  host: 'localhost',
  port: 5432,
  database: 'my_app_db',
  username: 'postgres',
  password: 'password'
}

// Production database (use environment variables)
{
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD
}
```

## 🎨 Customization

### Table Colors
Tables are automatically color-coded based on naming patterns:

- **Blue** - User-related tables (`users`, `customers`, `accounts`)
- **Green** - Transaction tables (`orders`, `payments`, `transactions`)
- **Orange** - Product tables (`products`, `items`, `inventory`)
- **Purple** - Category tables (`categories`, `tags`, `groups`)
- **Red** - System tables (`logs`, `sessions`, `configs`)

### Custom Styling
The application uses Tailwind CSS. Customize colors in `tailwind.config.js`:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        'db-blue': '#3B82F6',
        'db-orange': '#F97316',
        'db-green': '#10B981',
        // Add your custom colors
      }
    }
  }
}
```

## 📱 Screenshots

### Connection Form
![Connection Form](docs/connection-form.png)

### Schema Visualization
![Schema Diagram](docs/schema-visualization.png)

### Data Panel
![Data Panel](docs/data-panel.png)

## 🛠️ Development

### Available Scripts

**Backend:**
```bash
npm run dev     # Start development server with nodemon
npm start       # Start production server
```

**Frontend:**
```bash
npm run dev     # Start Vite development server
npm run build   # Build for production
npm run preview # Preview production build
```

### Adding New Features

1. **New API Endpoints** - Add to `backend/routes/database.js`
2. **New Components** - Create in `frontend/src/components/`
3. **New Utilities** - Add to `frontend/src/utils/`

### Database Schema Analysis
The application analyzes PostgreSQL schemas using information_schema tables:

```sql
-- Tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Columns  
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public';

-- Foreign Keys
SELECT tc.table_name, kcu.column_name, ccu.table_name AS foreign_table
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY';
```

## 🚀 Deployment

### Production Deployment

1. **Build Frontend**
```bash
cd frontend && npm run build
```

2. **Environment Variables**
```bash
# Production environment
NODE_ENV=production
PORT=3001
DB_HOST=your-production-db-host
DB_PORT=5432
DB_NAME=production_db
DB_USER=db_user
DB_PASSWORD=secure_password
```

3. **Deploy Backend** 
Deploy the backend to your preferred platform (Heroku, Railway, DigitalOcean, etc.)

4. **Deploy Frontend**
Deploy the built frontend to Vercel, Netlify, or serve from your backend.

### Docker Deployment
```bash
# Build and run with Docker
docker build -t database-visualizer .
docker run -p 3001:3001 database-visualizer
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋‍♂️ Support

- **Issues** - Report bugs or request features via GitHub Issues
- **Discussions** - Ask questions in GitHub Discussions
- **Email** - Contact the maintainers for enterprise support

## 🚀 Roadmap

- [ ] **Multi-Database Support** - MySQL, SQLite, MariaDB
- [ ] **Query Builder** - Visual query construction
- [ ] **Real-time Updates** - WebSocket integration for live schema changes
- [ ] **Team Collaboration** - Share diagrams with team members
- [ ] **Advanced Layouts** - Force-directed and hierarchical layouts
- [ ] **Schema Comparison** - Compare schemas between environments
- [ ] **Data Relationships** - Intelligent relationship suggestions
- [ ] **Performance Analytics** - Query performance insights

---

**Built with ❤️ using React, TypeScript, Node.js, and PostgreSQL**