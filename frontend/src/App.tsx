import { useState, useCallback } from "react";
import {
  ReactFlow,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
  type Connection,
  Controls,
  MiniMap,
  Background,
} from "@xyflow/react";
import {
  Database,
  FileDown,
  RefreshCw,
  Settings,
  Wifi,
  LogOut,
} from "lucide-react";
import { api, type DatabaseConfig, type SchemaResponse } from "./services/api";
import { exportDiagramToPDF, exportDiagramToPNG } from "./utils/exportUtils";
import ConnectionForm from "./components/ConnectionForm";
import DataPanel from "./components/DataPanel";
import TableNode from "./components/TableNode";
import "@xyflow/react/dist/style.css";
import "./App.css";

// Register custom node types
const nodeTypes = {
  tableNode: TableNode,
};

// Color assignment logic based on table name patterns
const getTableColor = (tableName: string, index: number): string => {
  const colors = ['db-blue', 'db-orange', 'db-green', 'db-purple', 'db-red'];

  // Group similar tables by name patterns
  if (tableName.includes('user') || tableName.includes('customer') || tableName.includes('account')) {
    return 'db-blue';
  }
  if (tableName.includes('order') || tableName.includes('payment') || tableName.includes('transaction')) {
    return 'db-green';
  }
  if (tableName.includes('product') || tableName.includes('item') || tableName.includes('inventory')) {
    return 'db-orange';
  }
  if (tableName.includes('category') || tableName.includes('tag') || tableName.includes('type')) {
    return 'db-purple';
  }
  if (tableName.includes('log') || tableName.includes('audit') || tableName.includes('error')) {
    return 'db-red';
  }

  // Default to cycling through colors
  return colors[index % colors.length];
};

const initialNodes: Node[] = [
  { id: "n1", position: { x: 0, y: 0 }, data: { label: "Database Table 1" } },
  { id: "n2", position: { x: 0, y: 100 }, data: { label: "Database Table 2" } },
  { id: "n3", position: { x: 200, y: 50 }, data: { label: "Related Table" } },
];

const initialEdges: Edge[] = [
  { id: "n1-n2", source: "n1", target: "n2" },
  { id: "n1-n3", source: "n1", target: "n3" },
];

function App() {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);

  // 🔌 Connection state management
  const [isConnected, setIsConnected] = useState(false);
  const [connectionConfig, setConnectionConfig] =
    useState<DatabaseConfig | null>(null);
  const [apiTestResult, setApiTestResult] = useState<string>("");

  // 📊 Schema state management
  const [isLoadingSchema, setIsLoadingSchema] = useState(false);
  const [schemaError, setSchemaError] = useState<string>("");

  // 🎯 Data panel state management
  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  // 🎯 Handle table node click to show data panel
  const handleTableClick = useCallback((tableName: string) => {
    console.log("🎯 Table clicked:", tableName);
    setSelectedTable(tableName);
  }, []);

  // 📄 Handle PDF export
  const handleExportPDF = useCallback(async () => {
    console.log("📄 Exporting diagram to PDF...");
    const result = await exportDiagramToPDF();
    
    if (result.success) {
      setApiTestResult("PDF exported successfully! ✅");
    } else {
      setSchemaError(`Export failed: ${result.error}`);
    }
  }, []);

  // 🖼️ Handle PNG export  
  const handleExportPNG = useCallback(async () => {
    console.log("🖼️ Exporting diagram to PNG...");
    const result = await exportDiagramToPNG();
    
    if (result.success) {
      setApiTestResult("PNG exported successfully! ✅");
    } else {
      setSchemaError(`Export failed: ${result.error}`);
    }
  }, []);

  // 🎯 Handle successful database connection
  const handleConnectionSuccess = async (config: DatabaseConfig) => {
    console.log("✅ Database connected successfully!");
    setConnectionConfig(config);
    setIsConnected(true);
    setApiTestResult("Connected to database successfully!");

    // 📊 Immediately load schema after connection
    await loadDatabaseSchema();
  };

  // 📊 Load and visualize database schema
  const loadDatabaseSchema = async () => {
    console.log("🔄 Loading database schema...");
    setIsLoadingSchema(true);
    setSchemaError("");

    try {
      const schemaData = await api.getSchema();

      if (!schemaData) {
        throw new Error("Failed to fetch schema data");
      }

      console.log("✅ Schema loaded:", schemaData);

      // 🎨 Transform schema data into React Flow nodes and edges
      const { schemaNodes, schemaEdges } = transformSchemaToFlow(schemaData);

      setNodes(schemaNodes);
      setEdges(schemaEdges);
      setApiTestResult(
        `Loaded ${schemaData.tables.length} tables successfully!`
      );
    } catch (error) {
      console.error("❌ Schema loading error:", error);
      setSchemaError(
        "Failed to load database schema: " + (error as Error).message
      );
    } finally {
      setIsLoadingSchema(false);
    }
  };

  // 🎨 Transform schema data into React Flow format
  const transformSchemaToFlow = (schemaData: SchemaResponse) => {
    const tables = schemaData.tables;
    const columns = schemaData.columns;
    const relationships = schemaData.relationships;

    // Group columns by table
    const tableColumns: Record<string, SchemaResponse["columns"]> = {};
    columns.forEach((column) => {
      if (!tableColumns[column.table_name]) {
        tableColumns[column.table_name] = [];
      }
      tableColumns[column.table_name].push(column);
    });

    // 🎨 Create nodes for each table
    const schemaNodes: Node[] = tables.map((table, index: number) => {
      const tableColumnList = tableColumns[table.table_name] || [];
      const tableColor = getTableColor(table.table_name, index);

      // 📐 Improved layout - organic positioning for better visualization
      const cols = Math.ceil(Math.sqrt(tables.length));
      const row = Math.floor(index / cols);
      const col = index % cols;

      // Add some randomness for a more organic feel
      const offsetX = (Math.random() - 0.5) * 100;
      const offsetY = (Math.random() - 0.5) * 100;

      return {
        id: table.table_name,
        type: 'tableNode', // Use our custom node type
        position: {
          x: col * 350 + 50 + offsetX,
          y: row * 250 + 50 + offsetY,
        },
        data: {
          tableName: table.table_name,
          columns: tableColumnList,
          color: tableColor,
          onClick: handleTableClick, // Add click handler
        },
      };
    });

    // 🔗 Create edges for relationships
    const schemaEdges: Edge[] = relationships.map((rel, index: number) => ({
      id: `rel-${index}`,
      source: rel.source_table,
      target: rel.target_table,
      type: "smoothstep",
      animated: false,
      style: {
        strokeWidth: 2,
        stroke: "#6b7280",
      },
      label: `${rel.source_column} → ${rel.target_column}`,
      labelStyle: { fontSize: 10, fill: "#374151" },
    }));

    return { schemaNodes, schemaEdges };
  };

  // 🚪 Handle disconnect
  const handleDisconnect = async () => {
    try {
      await api.disconnect();
      setIsConnected(false);
      setConnectionConfig(null);
      setApiTestResult("Disconnected from database");
      console.log("👋 Disconnected from database");
    } catch (error) {
      console.error("❌ Disconnect error:", error);
    }
  };
  const onNodesChange = useCallback(
    (changes: NodeChange[]) =>
      setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
    []
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) =>
      setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
    []
  );
  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot)),
    []
  );

  // 🎯 Handle node clicks (for table selection)
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const tableName = node.data.tableName as string;
      if (tableName) {
        handleTableClick(tableName);
      }
    },
    [handleTableClick]
  );

  // 🎯 Show connection form if not connected
  if (!isConnected) {
    return <ConnectionForm onConnected={handleConnectionSuccess} />;
  }

  // 🎨 Main application view (when connected)
  return (
    <div className="w-screen h-screen">
      <div className="absolute top-4 left-4 z-10 bg-white p-4 rounded-lg shadow-lg max-w-sm">
        <div className="flex items-center gap-2 mb-2">
          <Database className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-800">
            Database Visualizer
          </h1>
        </div>

        {/* 🔌 Connection Info */}
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-2">
            <Wifi className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-gray-700">
              Connected to: {connectionConfig?.database}
            </span>
          </div>

          {/* Disconnect Button */}
          <button
            onClick={handleDisconnect}
            className="w-full mb-2 flex items-center justify-center gap-1 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" />
            Disconnect
          </button>

          {/* Status Message */}
          {apiTestResult && (
            <div className="text-xs p-2 bg-green-100 rounded border border-green-200 text-green-700">
              {apiTestResult}
            </div>
          )}

          {/* Schema Error */}
          {schemaError && (
            <div className="text-xs p-2 bg-red-100 rounded border border-red-200 text-red-700">
              {schemaError}
            </div>
          )}
        </div>

        <p className="text-sm text-gray-600 mb-3">
          Real Database Connection Active! 🎉
        </p>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={loadDatabaseSchema}
            disabled={isLoadingSchema}
            className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoadingSchema ? "animate-spin" : ""}`}
            />
            {isLoadingSchema ? "Loading..." : "Refresh Schema"}
          </button>
          
          <button 
            onClick={handleExportPDF}
            className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
          >
            <FileDown className="w-4 h-4" />
            Export PDF
          </button>
          
          <button 
            onClick={handleExportPNG}
            className="flex items-center gap-1 px-3 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm"
          >
            <FileDown className="w-4 h-4" />
            Export PNG
          </button>
          
          <button className="flex items-center gap-1 px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm">
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </div>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        className="bg-gray-50"
      >
        <Background color="#aaa" gap={16} />
        <Controls />
        <MiniMap 
          nodeColor={(node) => {
            const color = node.data.color;
            const colorMap = {
              'db-blue': '#3b82f6',
              'db-orange': '#f97316', 
              'db-green': '#22c55e',
              'db-purple': '#a855f7',
              'db-red': '#ef4444'
            };
            return colorMap[color as keyof typeof colorMap] || '#3b82f6';
          }}
          className="!bg-white !border-2 !border-gray-300"
        />
      </ReactFlow>

      {/* 🎯 Data Panel - shows when table is selected */}
      {selectedTable && (
        <DataPanel
          tableName={selectedTable}
          onClose={() => setSelectedTable(null)}
        />
      )}
    </div>
  );
}

export default App;
