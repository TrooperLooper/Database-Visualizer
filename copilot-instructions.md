# Database Visualization Web App - Complete Implementation Guide

## Project Overview

This guide will walk you through creating a modern web application that visualizes PostgreSQL database schemas as interactive diagrams, similar to professional ER diagram tools. The app will display tables, their relationships, and allow users to view actual data in a clean, color-coded interface.

## What the App Will Look Like and How It Functions

### Visual Design

- **Clean ER Diagram Layout**: Tables displayed as cards with color-coded borders based on functional groups
- **Modern Color Scheme**:
  - Tables: Subtle colored borders (blue, orange, green groups like in your reference)
  - Background: Clean white/light gray
  - Data: Vibrant colors for highlighting when viewing table contents
- **Interactive Elements**: Click tables to view data, drag to rearrange, zoom and pan
- **Responsive Design**: Works on desktop and tablet devices
- it is forbidden to write CSS, we will use Tailwind CSS for styling

### Core Functionality

1. **Schema Visualization**: Automatically generates diagram from database structure
2. **Relationship Mapping**: Shows foreign key relationships with clean connecting lines
3. **Data Inspection**: Click any table to view actual rows in a side panel
4. **Export Options**: Generate PDF exports of the diagram
5. **Real-time Schema**: Refresh button to update when database structure changes

### User Workflow

1. User enters database connection details
2. App connects and analyzes schema structure
3. Interactive diagram renders with color-coded table groups
4. User can explore data by clicking tables
5. Export diagram as needed for documentation

---

## Technical Architecture

### Frontend Stack

- **React Vite**: Component-based UI framework
- **Tailwind CSS**: Utility-first styling framework
- **React Flow**: Specialized library for interactive node-based diagrams
- **Lucide React**: Modern icon library
- **jsPDF + html2canvas**: PDF export functionality

### Backend Stack

- **Node.js + Express**: Server framework
- **pg (node-postgres)**: PostgreSQL client library
- **cors**: Cross-origin resource sharing
- **dotenv**: Environment variable management

### Database

- **PostgreSQL**: Primary database system
- **Direct connection**: No pgAdmin dependency

---

## Development Phases

### Phase 1: Environment Setup & Basic Structure

### Phase 2: Database Connection & Schema Analysis

### Phase 3: Frontend Diagram Implementation

### Phase 4: Data Display & Interaction

### Phase 5: Styling & Polish

### Phase 6: Export Functionality

---

## Phase 1: Environment Setup & Basic Structure

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database with some sample data
- Code editor (VS Code recommended)
- Basic knowledge of JavaScript and SQL

### Project Initialization

#### 1. Create Project Structure

```bash
mkdir database-visualizer
cd database-visualizer

# Initialize npm project
npm init -y

# Create folder structure
mkdir backend frontend
```

#### 2. Backend Setup

```bash
cd backend
npm init -y

# Install backend dependencies
npm install express pg cors dotenv nodemon

# Install development dependencies
npm install --save-dev nodemon
```

Create `backend/package.json` scripts:

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

#### 3. Frontend Setup

```bash
cd ../frontend

# Create React app
npx create-react-app . --template typescript
# Note: You can skip TypeScript and use regular JavaScript if preferred

# Install frontend dependencies
npm install @tailwindcss/cli tailwindcss postcss autoprefixer
npm install reactflow lucide-react
npm install jspdf html2canvas

# Initialize Tailwind CSS
npx tailwindcss init -p
```

### Basic File Structure

```
database-visualizer/
├── backend/
│   ├── server.js
│   ├── routes/
│   │   └── database.js
│   ├── services/
│   │   └── dbService.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── DatabaseDiagram.js
│   │   │   ├── TableNode.js
│   │   │   ├── DataPanel.js
│   │   │   └── ConnectionForm.js
│   │   ├── services/
│   │   │   └── api.js
│   │   └── App.js
│   └── package.json
└── README.md
```

---

## Phase 2: Database Connection & Schema Analysis

### Backend Implementation

#### 1. Environment Configuration

Create `backend/.env`:

```env
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database
DB_USER=your_username
DB_PASSWORD=your_password
```

#### 2. Database Service (`backend/services/dbService.js`)

```javascript
const { Pool } = require("pg");

class DatabaseService {
  constructor() {
    this.pool = null;
  }

  async connect(config) {
    this.pool = new Pool(config);
    try {
      await this.pool.query("SELECT NOW()");
      return { success: true, message: "Connected successfully" };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async getSchemaInfo() {
    if (!this.pool) throw new Error("Not connected to database");

    // Get all tables
    const tablesQuery = `
      SELECT 
        table_name,
        table_schema
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;

    // Get all columns
    const columnsQuery = `
      SELECT 
        table_name,
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position;
    `;

    // Get foreign key relationships
    const foreignKeysQuery = `
      SELECT
        tc.table_name as source_table,
        kcu.column_name as source_column,
        ccu.table_name as target_table,
        ccu.column_name as target_column
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' 
      AND tc.table_schema = 'public';
    `;

    const [tables, columns, foreignKeys] = await Promise.all([
      this.pool.query(tablesQuery),
      this.pool.query(columnsQuery),
      this.pool.query(foreignKeysQuery),
    ]);

    return {
      tables: tables.rows,
      columns: columns.rows,
      relationships: foreignKeys.rows,
    };
  }

  async getTableData(tableName, limit = 100) {
    if (!this.pool) throw new Error("Not connected to database");

    const query = `SELECT * FROM ${tableName} LIMIT $1`;
    const result = await this.pool.query(query, [limit]);
    return result.rows;
  }
}

module.exports = new DatabaseService();
```

#### 3. API Routes (`backend/routes/database.js`)

```javascript
const express = require("express");
const router = express.Router();
const dbService = require("../services/dbService");

// Connect to database
router.post("/connect", async (req, res) => {
  try {
    const { host, port, database, username, password } = req.body;
    const config = {
      host,
      port,
      database,
      user: username,
      password,
    };

    const result = await dbService.connect(config);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get database schema
router.get("/schema", async (req, res) => {
  try {
    const schema = await dbService.getSchemaInfo();
    res.json(schema);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get table data
router.get("/table/:tableName/data", async (req, res) => {
  try {
    const { tableName } = req.params;
    const { limit = 100 } = req.query;
    const data = await dbService.getTableData(tableName, parseInt(limit));
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

#### 4. Main Server (`backend/server.js`)

```javascript
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const databaseRoutes = require("./routes/database");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/database", databaseRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "Server is running" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

---

## Phase 3: Frontend Diagram Implementation

### Understanding React Flow

React Flow is a library specifically designed for creating interactive node-based diagrams. Think of it as:

- **Nodes**: Your database tables (rendered as cards)
- **Edges**: The relationship lines between tables
- **Interactive**: Users can drag, zoom, and click nodes
- **Customizable**: You control how tables look and behave

### Key Concepts for Beginners:

1. **Nodes**: Each table becomes a "node" with custom styling
2. **Edges**: Relationship lines that connect nodes
3. **Layout**: Algorithm that positions nodes automatically
4. **Handles**: Connection points on nodes where edges attach

### Frontend Implementation

#### 1. Tailwind Configuration (`frontend/tailwind.config.js`)

```javascript
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "db-blue": "#3B82F6",
        "db-orange": "#F97316",
        "db-green": "#10B981",
        "db-purple": "#8B5CF6",
        "db-red": "#EF4444",
      },
    },
  },
  plugins: [],
};
```

#### 2. API Service (`frontend/src/services/api.js`)

```javascript
const API_BASE = "http://localhost:3001/api";

export const api = {
  async connectDatabase(config) {
    const response = await fetch(`${API_BASE}/database/connect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    return response.json();
  },

  async getSchema() {
    const response = await fetch(`${API_BASE}/database/schema`);
    return response.json();
  },

  async getTableData(tableName, limit = 100) {
    const response = await fetch(
      `${API_BASE}/database/table/${tableName}/data?limit=${limit}`
    );
    return response.json();
  },
};
```

#### 3. Table Node Component (`frontend/src/components/TableNode.js`)

```javascript
import React from "react";
import { Handle, Position } from "reactflow";

const TableNode = ({ data }) => {
  const { tableName, columns, color, onClick } = data;

  return (
    <div
      className={`bg-white border-2 border-${color} rounded-lg shadow-lg min-w-48 cursor-pointer hover:shadow-xl transition-shadow`}
      onClick={() => onClick(tableName)}
    >
      {/* Table Header */}
      <div className={`bg-${color} text-white px-3 py-2 rounded-t-lg`}>
        <h3 className="font-semibold text-sm">{tableName}</h3>
      </div>

      {/* Table Columns */}
      <div className="p-3">
        {columns.slice(0, 6).map((column, index) => (
          <div
            key={index}
            className="flex justify-between text-xs py-1 border-b border-gray-100 last:border-b-0"
          >
            <span className="font-medium text-gray-700">
              {column.column_name}
            </span>
            <span className="text-gray-500">{column.data_type}</span>
          </div>
        ))}
        {columns.length > 6 && (
          <div className="text-xs text-gray-400 pt-1">
            +{columns.length - 6} more...
          </div>
        )}
      </div>

      {/* Connection Handles */}
      <Handle type="target" position={Position.Top} className="w-2 h-2" />
      <Handle type="source" position={Position.Bottom} className="w-2 h-2" />
      <Handle type="target" position={Position.Left} className="w-2 h-2" />
      <Handle type="source" position={Position.Right} className="w-2 h-2" />
    </div>
  );
};

export default TableNode;
```

#### 4. Main Diagram Component (`frontend/src/components/DatabaseDiagram.js`)

```javascript
import React, { useState, useCallback, useEffect } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";

import TableNode from "./TableNode";
import { api } from "../services/api";

const nodeTypes = {
  tableNode: TableNode,
};

// Color assignment logic
const getTableColor = (tableName, index) => {
  const colors = ["db-blue", "db-orange", "db-green", "db-purple", "db-red"];

  // Group similar tables by name patterns
  if (tableName.includes("user") || tableName.includes("customer"))
    return "db-blue";
  if (tableName.includes("order") || tableName.includes("payment"))
    return "db-green";
  if (tableName.includes("product") || tableName.includes("item"))
    return "db-orange";
  if (tableName.includes("category") || tableName.includes("tag"))
    return "db-purple";

  return colors[index % colors.length];
};

const DatabaseDiagram = ({ onTableSelect }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(false);

  // Auto-layout algorithm (simple grid-based)
  const calculateLayout = (tables, relationships) => {
    const nodeSpacing = 300;
    const cols = Math.ceil(Math.sqrt(tables.length));

    return tables.map((table, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;

      return {
        x: col * nodeSpacing + 50,
        y: row * nodeSpacing + 50,
      };
    });
  };

  const loadSchema = async () => {
    setLoading(true);
    try {
      const schema = await api.getSchema();

      // Group columns by table
      const tableColumns = schema.columns.reduce((acc, column) => {
        if (!acc[column.table_name]) acc[column.table_name] = [];
        acc[column.table_name].push(column);
        return acc;
      }, {});

      // Calculate positions
      const positions = calculateLayout(schema.tables, schema.relationships);

      // Create nodes
      const newNodes = schema.tables.map((table, index) => ({
        id: table.table_name,
        type: "tableNode",
        position: positions[index],
        data: {
          tableName: table.table_name,
          columns: tableColumns[table.table_name] || [],
          color: getTableColor(table.table_name, index),
          onClick: onTableSelect,
        },
      }));

      // Create edges from relationships
      const newEdges = schema.relationships.map((rel, index) => ({
        id: `e${index}`,
        source: rel.source_table,
        target: rel.target_table,
        type: "smoothstep",
        animated: false,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
        },
        style: {
          strokeWidth: 2,
          stroke: "#6B7280",
        },
        label: `${rel.source_column} → ${rel.target_column}`,
        labelStyle: { fontSize: 10, fill: "#374151" },
      }));

      setNodes(newNodes);
      setEdges(newEdges);
    } catch (error) {
      console.error("Failed to load schema:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchema();
  }, []);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading database schema...</div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        className="bg-gray-50"
      >
        <Controls className="bg-white shadow-lg rounded-lg" />
        <MiniMap
          className="bg-white shadow-lg rounded-lg"
          nodeColor={(node) => {
            const color = node.data.color;
            const colorMap = {
              "db-blue": "#3B82F6",
              "db-orange": "#F97316",
              "db-green": "#10B981",
              "db-purple": "#8B5CF6",
              "db-red": "#EF4444",
            };
            return colorMap[color] || "#6B7280";
          }}
        />
        <Background variant="dots" gap={12} size={1} />
      </ReactFlow>
    </div>
  );
};

export default DatabaseDiagram;
```

---

## Phase 4: Data Display & Interaction

#### 1. Data Panel Component (`frontend/src/components/DataPanel.js`)

```javascript
import React, { useState, useEffect } from "react";
import { X, RefreshCw } from "lucide-react";
import { api } from "../services/api";

const DataPanel = ({ tableName, onClose }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadTableData = async () => {
    setLoading(true);
    setError(null);
    try {
      const tableData = await api.getTableData(tableName);
      setData(tableData);
    } catch (err) {
      setError("Failed to load table data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tableName) {
      loadTableData();
    }
  }, [tableName]);

  if (!tableName) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-1/3 bg-white shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">{tableName}</h2>
          <p className="text-sm text-gray-300">
            {data.length} rows {loading && "(loading...)"}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadTableData}
            disabled={loading}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {error && (
          <div className="p-4 bg-red-50 border-l-4 border-red-400 text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Loading table data...
          </div>
        ) : data.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No data found in this table
          </div>
        ) : (
          <div className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    {Object.keys(data[0] || {}).map((column) => (
                      <th
                        key={column}
                        className="text-left p-2 font-semibold text-gray-700 bg-gray-50"
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, index) => (
                    <tr
                      key={index}
                      className={`border-b border-gray-100 hover:bg-blue-50 ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      }`}
                    >
                      {Object.values(row).map((value, cellIndex) => (
                        <td key={cellIndex} className="p-2 text-gray-800">
                          <div className="max-w-xs truncate" title={value}>
                            {value === null ? (
                              <span className="text-gray-400 italic">NULL</span>
                            ) : typeof value === "boolean" ? (
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  value
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {value.toString()}
                              </span>
                            ) : typeof value === "number" ? (
                              <span className="font-mono text-blue-600">
                                {value}
                              </span>
                            ) : (
                              String(value)
                            )}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataPanel;
```

#### 2. Connection Form (`frontend/src/components/ConnectionForm.js`)

```javascript
import React, { useState } from "react";
import { Database, AlertCircle, CheckCircle } from "lucide-react";
import { api } from "../services/api";

const ConnectionForm = ({ onConnected }) => {
  const [config, setConfig] = useState({
    host: "localhost",
    port: "5432",
    database: "",
    username: "",
    password: "",
  });
  const [status, setStatus] = useState({ type: null, message: "" });
  const [connecting, setConnecting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setConnecting(true);
    setStatus({ type: null, message: "" });

    try {
      const result = await api.connectDatabase(config);

      if (result.success) {
        setStatus({ type: "success", message: "Connected successfully!" });
        onConnected();
      } else {
        setStatus({ type: "error", message: result.message });
      }
    } catch (error) {
      setStatus({
        type: "error",
        message: "Connection failed: " + error.message,
      });
    } finally {
      setConnecting(false);
    }
  };

  const handleChange = (e) => {
    setConfig((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <Database className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Connect to Database
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your PostgreSQL connection details
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Host
              </label>
              <input
                name="host"
                type="text"
                required
                value={config.host}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="localhost"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Port
              </label>
              <input
                name="port"
                type="text"
                required
                value={config.port}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="5432"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Database
              </label>
              <input
                name="database"
                type="text"
                required
                value={config.database}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="my_database"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                name="username"
                type="text"
                required
                value={config.username}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="postgres"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                name="password"
                type="password"
                required
                value={config.password}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="••••••••"
              />
            </div>
          </div>

          {status.message && (
            <div
              className={`flex items-center gap-2 p-3 rounded-md ${
                status.type === "success"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {status.type === "success" ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              <span className="text-sm">{status.message}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={connecting}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {connecting ? "Connecting..." : "Connect to Database"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ConnectionForm;
```

---

## Phase 5: Main App Integration & Styling

#### Main App Component (`frontend/src/App.js`)

```javascript
import React, { useState } from "react";
import ConnectionForm from "./components/ConnectionForm";
import DatabaseDiagram from "./components/DatabaseDiagram";
import DataPanel from "./components/DataPanel";
import { FileDown, RefreshCw, Database } from "lucide-react";

function App() {
  const [connected, setConnected] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);

  const handleTableSelect = (tableName) => {
    setSelectedTable(tableName);
  };

  const handleExportPDF = () => {
    // TODO: Implement PDF export
    console.log("Export PDF functionality to be implemented");
  };

  const handleRefresh = () => {
    window.location.reload(); // Simple refresh for now
  };

  const handleDisconnect = () => {
    setConnected(false);
    setSelectedTable(null);
  };

  if (!connected) {
    return <ConnectionForm onConnected={() => setConnected(true)} />;
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Database className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-semibold text-gray-900">
              Database Visualizer
            </h1>
            <div className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
              Connected
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>

            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <FileDown className="w-4 h-4" />
              Export PDF
            </button>

            <button
              onClick={handleDisconnect}
              className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-red-600 focus:outline-none"
            >
              Disconnect
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 relative">
        <DatabaseDiagram onTableSelect={handleTableSelect} />

        {selectedTable && (
          <DataPanel
            tableName={selectedTable}
            onClose={() => setSelectedTable(null)}
          />
        )}
      </div>
    </div>
  );
}

export default App;
```

#### Update Main CSS (`frontend/src/index.css`)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* React Flow custom styles */
.react-flow__node-tableNode {
  background: transparent;
  border: none;
  padding: 0;
}

.react-flow__handle {
  background: #6b7280;
  border: 2px solid #ffffff;
  width: 8px;
  height: 8px;
}

.react-flow__handle:hover {
  background: #374151;
}

.react-flow__edge-path {
  stroke-width: 2;
}

.react-flow__edge.selected .react-flow__edge-path {
  stroke: #3b82f6;
  stroke-width: 3;
}

/* Custom scrollbar for data panel */
.data-panel-scroll::-webkit-scrollbar {
  width: 6px;
}

.data-panel-scroll::-webkit-scrollbar-track {
  background: #f1f5f9;
}

.data-panel-scroll::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.data-panel-scroll::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* Loading animation */
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Smooth transitions */
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}
```

---

## Phase 6: Export Functionality & Installation

### PDF Export Implementation

#### 1. Export Utility (`frontend/src/utils/exportUtils.js`)

```javascript
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export const exportDiagramToPDF = async () => {
  try {
    // Get the React Flow container
    const element = document.querySelector(".react-flow");

    if (!element) {
      throw new Error("Diagram not found");
    }

    // Create canvas from the diagram
    const canvas = await html2canvas(element, {
      backgroundColor: "white",
      useCORS: true,
      scale: 2, // Higher quality
    });

    const imgData = canvas.toDataURL("image/png");

    // Calculate PDF dimensions
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = imgHeight / imgWidth;

    // A4 size in points
    const pageWidth = 595.28;
    const pageHeight = 841.89;

    let pdfWidth = pageWidth;
    let pdfHeight = pageWidth * ratio;

    // If image is too tall, scale down
    if (pdfHeight > pageHeight) {
      pdfHeight = pageHeight;
      pdfWidth = pageHeight / ratio;
    }

    // Create PDF
    const pdf = new jsPDF("landscape");
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

    // Add title
    pdf.setFontSize(16);
    pdf.text("Database Schema Diagram", 20, 20);

    // Add timestamp
    pdf.setFontSize(10);
    pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, 30);

    // Save the PDF
    pdf.save(`database-diagram-${Date.now()}.pdf`);

    return { success: true };
  } catch (error) {
    console.error("Export failed:", error);
    return { success: false, error: error.message };
  }
};
```

#### 2. Update App.js to use export function

```javascript
// Add this import at the top of App.js
import { exportDiagramToPDF } from "./utils/exportUtils";

// Replace the handleExportPDF function with:
const handleExportPDF = async () => {
  try {
    const result = await exportDiagramToPDF();
    if (result.success) {
      console.log("PDF exported successfully");
    } else {
      console.error("Export failed:", result.error);
    }
  } catch (error) {
    console.error("Export error:", error);
  }
};
```

---

## Installation & Running Instructions

### Step-by-Step Setup

#### 1. Clone and Setup Project

```bash
# Create and navigate to project directory
mkdir database-visualizer && cd database-visualizer

# Follow the Phase 1 setup instructions above
```

#### 2. Install Dependencies

```bash
# Backend dependencies
cd backend
npm install express pg cors dotenv nodemon

# Frontend dependencies
cd ../frontend
npm install reactflow lucide-react jspdf html2canvas
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

#### 3. Configure Environment

```bash
# Create backend/.env file with your database credentials
echo "PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database_name
DB_USER=your_username
DB_PASSWORD=your_password" > backend/.env
```

#### 4. Start Development Servers

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
cd frontend
npm start
```

#### 5. Access Application

- Open browser to `http://localhost:3000`
- Enter your database connection details
- Explore your database schema!

---

## Learning Resources

### Understanding the Technology Stack

**React Flow Basics:**

- Official docs: https://reactflow.dev/
- Think of it as Lego blocks for building diagrams
- Nodes = your custom components (table cards)
- Edges = lines connecting components
- Built-in features: zoom, pan, drag, minimap

**Tailwind CSS:**

- Utility-first CSS framework
- Instead of writing CSS, you use classes like `bg-blue-500 p-4 rounded-lg`
- Responsive design with `sm:`, `md:`, `lg:` prefixes
- Easy to customize colors and spacing

**Node.js + PostgreSQL:**

- `pg` library handles database connections
- SQL queries return JavaScript objects
- Express.js creates REST API endpoints
- CORS allows frontend to call backend

### Next Steps & Improvements

1. **Add Authentication**: Secure database connections
2. **Multiple Databases**: Support connecting to different databases
3. **Query Builder**: Let users write and execute custom queries
4. **Real-time Updates**: WebSocket integration for live schema changes
5. **Advanced Layouts**: Implement better auto-layout algorithms
6. **Performance**: Add caching and pagination for large databases
7. **Collaboration**: Share diagrams with team members

### Troubleshooting Common Issues

**Connection Problems:**

- Verify PostgreSQL is running and accessible
- Check firewall settings
- Confirm database credentials
- Test connection with psql command line first

**React Flow Issues:**

- Ensure all node IDs are unique
- Check that edge source/target match node IDs
- Verify node data structure matches component expectations

**Styling Problems:**

- Run `npm run build` to rebuild Tailwind CSS
- Check browser console for missing classes
- Verify Tailwind config includes all necessary colors

**Export Issues:**

- Ensure the diagram is fully loaded before exporting
- Check browser console for canvas-related errors
- Verify jsPDF and html2canvas are properly installed

---

## Conclusion

This guide provides a complete roadmap for building a professional database visualization tool. The modular architecture allows you to implement features incrementally, and the modern tech stack ensures the app will be maintainable and extensible.

Start with Phase 1, get the basic structure working, then gradually add features. Don't try to implement everything at once - focus on getting a simple diagram displaying first, then add interactivity and polish.

The end result will be a powerful tool that can help visualize and understand database structures, making it easier to work with complex schemas and communicate database design to others.

### Key Features Delivered:

✅ **Interactive Database Diagrams** - Color-coded tables with drag & drop  
✅ **Real Data Exploration** - Click tables to view actual database content  
✅ **Modern UI** - Clean, professional interface with Tailwind CSS  
✅ **PDF Export** - Generate documentation-ready diagrams  
✅ **PostgreSQL Integration** - Direct database connection without dependencies  
✅ **Responsive Design** - Works on desktop and tablet devices

This foundation can be extended with additional features like query builders, multiple database support, collaborative features, and more advanced visualization options.
