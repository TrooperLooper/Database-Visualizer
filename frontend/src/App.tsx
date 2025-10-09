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
    <div className="w-screen h-screen relative bg-white">
      {/* Header - Absolute positioned overlay */}
      <div className="absolute top-0 left-0 z-10 p-4">
        <div
          className="bg-white/95 backdrop-blur-sm shadow-lg rounded-xl border border-gray-200 px-6 py-4 w-fit ml-0 origin-top-left transform-gpu"
          style={{
            transform: "scale(0.7)",
          }}
        >
          {/* Three column layout with fixed pixel widths */}
          <div
            className="grid gap-0"
            style={{ gridTemplateColumns: "120px 550px 250px" }}
          >
            {/* Column 1: Database symbol (triple size, 20px padding) */}
            <div className="flex flex-col justify-between h-full px-2">
              <div className="flex items-center pt-4 ml-4">
                <Database className="w-15 h-15 text-blue-600" />
              </div>
              <div></div> {/* Empty bottom */}
            </div>

            {/* Column 2: Header text with line break (top), buttons (bottom) */}
            <div className="flex flex-col gap-4 items-start ml-0">
              <div className="pt-2.5">
                <h1 className="text-lg font-bold text-gray-800">
                  Database
                  <br />
                  Visualizer
                </h1>
              </div>
              <div className="flex items-center gap-4">
                {/* Status Message */}
                {apiTestResult && (
                  <div className="text-xs !px-5 !py-0.5 bg-green-100 rounded border border-green-200 text-green-700">
                    {apiTestResult}
                  </div>
                )}

                {schemaError && (
                  <div className="text-xs !px-1.5 !py-0.5 bg-red-100 rounded border border-red-200 text-red-700">
                    {schemaError}
                  </div>
                )}

                {/* Orange action buttons */}
                <div className="flex items-center gap-2 ml-4">
                  <button className="flex items-center gap-1 !px-1.5 !py-0.5 !bg-orange-500 !text-white rounded hover:!bg-orange-600 transition-colors text-xs font-medium !border-none">
                    <FileDown className="w-3 h-3" />
                    Export
                  </button>

                  <button className="flex items-center gap-1 !px-1.5 !py-0.5 !bg-orange-500 !text-white rounded hover:!bg-orange-600 transition-colors text-xs font-medium !border-none">
                    <Settings className="w-3 h-3" />
                    Settings
                  </button>

                  <button
                    onClick={loadDatabaseSchema}
                    disabled={isLoadingSchema}
                    className="flex items-center gap-1 !px-1.5 !py-0.5 !bg-orange-500 !text-white rounded hover:!bg-orange-600 transition-colors text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed !border-none"
                  >
                    <RefreshCw
                      className={`w-3 h-3 ${
                        isLoadingSchema ? "animate-spin" : ""
                      }`}
                    />
                    {isLoadingSchema ? "Loading..." : "Refresh"}
                  </button>
                </div>
              </div>
            </div>

            {/* Column 3: Connected button (top), Disconnect button (bottom) */}
            <div className="flex flex-col justify-between items-center h-full mt-2 mr-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full border border-green-200 pt-2 mt-5">
                <Wifi className="w-3 h-3 text-green-600" />
                <span className="text-xs font-medium text-green-700">
                  Connected to: {connectionConfig?.database}
                </span>
              </div>

              <button
                onClick={handleDisconnect}
                className="flex items-center justify-center gap-1 !px-1.5 !py-0.5 !bg-red-500 !text-white rounded hover:!bg-red-600 transition-colors text-xs font-medium !border-none self-center mb-3.5"
              >
                <LogOut className="w-3 h-3" />
                Disconnect
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content area - Full screen */}
      <div className="absolute inset-0">
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
          fitViewOptions={{ padding: 0.1, maxZoom: 1.5, minZoom: 0.1 }}
          className="bg-white bg-dot-pattern"
        >
          <Controls className="!bg-white !border-2 !border-gray-300 !shadow-lg [&_svg]:!fill-gray-800 [&_svg]:!stroke-gray-800 !bottom-20" />
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
