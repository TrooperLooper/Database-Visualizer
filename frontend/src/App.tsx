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
  Background,
  MarkerType,
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
import ConnectionForm from "./components/ConnectionForm";
import DataPanel from "./components/DataPanel";
import TableNode from "./components/TableNode";
import AnimatedEdge from "./components/AnimatedEdge";
import "@xyflow/react/dist/style.css";
import "./App.css";

// Register custom node and edge types
const nodeTypes = {
  tableNode: TableNode,
};

const edgeTypes = {
  animatedEdge: AnimatedEdge,
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

      // 📐 Improved grid layout for horizontal design
      const cols = Math.ceil(Math.sqrt(tables.length) * 1.5); // More horizontal
      const row = Math.floor(index / cols);
      const col = index % cols;

      return {
        id: table.table_name,
        type: "tableNode", // Use custom node type
        position: {
          x: col * 350 + 50,
          y: row * 300 + 50,
        },
        data: {
          tableName: table.table_name,
          columns: tableColumnList,
          onClick: handleTableClick, // Add click handler
        },
      };
    });

    // 🔗 Create edges for relationships
    const schemaEdges: Edge[] = relationships.map((rel, index: number) => ({
      id: `rel-${index}`,
      source: rel.source_table,
      target: rel.target_table,
      type: "animatedEdge",
      animated: false,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 25,
        height: 25,
        color: "#000000",
      },
      label: `${rel.source_column} → ${rel.target_column}`,
      style: {
        strokeWidth: 3,
        stroke: "#000000",
      },
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
    <div className="w-screen h-screen flex flex-col">
      {/* Header - Compact horizontal layout */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-3 flex-shrink-0">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <Database className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-800">
                Database Visualizer
              </h1>
            </div>

            {/* Connection Info */}
            <div className="flex items-center gap-2 px-3 py-1 bg-green-50 rounded-full border border-green-200">
              <Wifi className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">
                Connected to: {connectionConfig?.database}
              </span>
            </div>
          </div>

          {/* Disconnect Button */}
          <button
            onClick={handleDisconnect}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 hover:scale-105 hover:shadow-lg border-2 border-red-600 hover:border-red-700 transition-all duration-200 text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Disconnect
          </button>
        </div>

        {/* Button Row */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 hover:scale-105 hover:shadow-md border-2 border-green-600 hover:border-green-700 transition-all duration-200 text-xs font-medium">
              <FileDown className="w-3.5 h-3.5" />
              Export
            </button>

            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-600 text-white rounded-md hover:bg-gray-700 hover:scale-105 hover:shadow-md border-2 border-gray-600 hover:border-gray-700 transition-all duration-200 text-xs font-medium">
              <Settings className="w-3.5 h-3.5" />
              Settings
            </button>

            <button
              onClick={loadDatabaseSchema}
              disabled={isLoadingSchema}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 hover:scale-105 hover:shadow-md border-2 border-blue-600 hover:border-blue-700 transition-all duration-200 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${
                  isLoadingSchema ? "animate-spin" : ""
                }`}
              />
              {isLoadingSchema ? "Loading..." : "Refresh Schema"}
            </button>
          </div>

          {/* Status Messages */}
          <div className="flex gap-2">
            {apiTestResult && (
              <div className="text-xs px-2 py-1 bg-green-100 rounded border border-green-200 text-green-700">
                {apiTestResult}
              </div>
            )}

            {schemaError && (
              <div className="text-xs px-2 py-1 bg-red-100 rounded border border-red-200 text-red-700">
                {schemaError}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          className="bg-gray-50"
        >
          <Background color="#e5e7eb" gap={20} />
          <Controls className="!bg-white !border-2 !border-gray-300 !shadow-lg" />
        </ReactFlow>

        {/* 🎯 Data Panel - shows when table is selected */}
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
