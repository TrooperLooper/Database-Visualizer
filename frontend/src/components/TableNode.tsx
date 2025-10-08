import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Table, Key, Link } from 'lucide-react';

interface Column {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default?: string;
}

interface TableNodeProps {
  data: {
    tableName: string;
    columns: Column[];
    color: string;
    onClick: (tableName: string) => void;
  };
}

// Color mapping for different table categories
const getColorClasses = (color: string) => {
  const colorMap = {
    'db-blue': {
      border: 'border-blue-500',
      header: 'bg-blue-500',
      hover: 'hover:border-blue-600',
      shadow: 'hover:shadow-blue-200'
    },
    'db-orange': {
      border: 'border-orange-500', 
      header: 'bg-orange-500',
      hover: 'hover:border-orange-600',
      shadow: 'hover:shadow-orange-200'
    },
    'db-green': {
      border: 'border-green-500',
      header: 'bg-green-500', 
      hover: 'hover:border-green-600',
      shadow: 'hover:shadow-green-200'
    },
    'db-purple': {
      border: 'border-purple-500',
      header: 'bg-purple-500',
      hover: 'hover:border-purple-600', 
      shadow: 'hover:shadow-purple-200'
    },
    'db-red': {
      border: 'border-red-500',
      header: 'bg-red-500',
      hover: 'hover:border-red-600',
      shadow: 'hover:shadow-red-200'
    }
  };
  
  return colorMap[color as keyof typeof colorMap] || colorMap['db-blue'];
};

// Get icon for data type
const getDataTypeIcon = (dataType: string) => {
  if (dataType.includes('id') || dataType === 'serial') {
    return <Key className="w-3 h-3 text-yellow-600" />;
  }
  if (dataType.includes('varchar') || dataType.includes('text')) {
    return <span className="text-xs text-blue-600">T</span>;
  }
  if (dataType.includes('int') || dataType.includes('numeric')) {
    return <span className="text-xs text-green-600">#</span>;
  }
  if (dataType.includes('bool')) {
    return <span className="text-xs text-purple-600">B</span>;
  }
  if (dataType.includes('timestamp') || dataType.includes('date')) {
    return <span className="text-xs text-orange-600">D</span>;
  }
  return <span className="text-xs text-gray-600">?</span>;
};

const TableNode: React.FC<TableNodeProps> = ({ data }) => {
  const { tableName, columns, color, onClick } = data;
  const colorClasses = getColorClasses(color);
  
  // Detect primary key columns
  const primaryKeyColumns = columns.filter(col => 
    col.column_name.toLowerCase().includes('id') || 
    col.column_name === 'id' ||
    col.data_type === 'serial'
  );
  
  // Detect foreign key columns
  const foreignKeyColumns = columns.filter(col => 
    col.column_name.endsWith('_id') && col.column_name !== 'id'
  );

  return (
    <div
      className={`
        bg-white border-2 ${colorClasses.border} ${colorClasses.hover} 
        rounded-lg shadow-lg min-w-64 cursor-pointer 
        hover:shadow-xl transition-all duration-200 ${colorClasses.shadow}
        transform hover:scale-105
      `}
      onClick={() => onClick(tableName)}
    >
      {/* Table Header */}
      <div className={`${colorClasses.header} text-white px-4 py-3 rounded-t-lg`}>
        <div className="flex items-center gap-2">
          <Table className="w-4 h-4" />
          <h3 className="font-bold text-sm uppercase tracking-wide">{tableName}</h3>
        </div>
        <div className="text-xs opacity-90 mt-1">
          {columns.length} {columns.length === 1 ? 'column' : 'columns'}
        </div>
      </div>

      {/* Columns List */}
      <div className="p-3 space-y-1">
        {columns.slice(0, 8).map((column, index) => {
          const isPrimaryKey = primaryKeyColumns.includes(column);
          const isForeignKey = foreignKeyColumns.includes(column);
          
          return (
            <div
              key={index}
              className={`
                flex items-center justify-between text-xs py-1.5 px-2 rounded
                border-l-2 transition-colors
                ${isPrimaryKey ? 'border-l-yellow-400 bg-yellow-50' : 
                  isForeignKey ? 'border-l-blue-400 bg-blue-50' : 
                  'border-l-gray-200 hover:bg-gray-50'}
              `}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {getDataTypeIcon(column.data_type)}
                <span className={`font-medium truncate ${
                  isPrimaryKey ? 'text-yellow-800' : 
                  isForeignKey ? 'text-blue-800' : 
                  'text-gray-700'
                }`}>
                  {column.column_name}
                </span>
                {isForeignKey && <Link className="w-3 h-3 text-blue-500" />}
              </div>
              
              <div className="flex items-center gap-1">
                <span className="text-gray-500 text-xs font-mono">
                  {column.data_type}
                </span>
                {column.is_nullable === 'NO' && (
                  <span className="text-red-500 text-xs">*</span>
                )}
              </div>
            </div>
          );
        })}
        
        {columns.length > 8 && (
          <div className="text-xs text-gray-400 text-center py-2 italic">
            +{columns.length - 8} more columns...
          </div>
        )}
      </div>

      {/* Footer with key information */}
      {(primaryKeyColumns.length > 0 || foreignKeyColumns.length > 0) && (
        <div className="px-3 pb-3">
          <div className="border-t pt-2 text-xs text-gray-500 space-y-1">
            {primaryKeyColumns.length > 0 && (
              <div className="flex items-center gap-1">
                <Key className="w-3 h-3 text-yellow-600" />
                <span>Primary: {primaryKeyColumns.map(c => c.column_name).join(', ')}</span>
              </div>
            )}
            {foreignKeyColumns.length > 0 && (
              <div className="flex items-center gap-1">
                <Link className="w-3 h-3 text-blue-600" />
                <span>Foreign: {foreignKeyColumns.length} references</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Connection Handles */}
      <Handle 
        type="target" 
        position={Position.Top} 
        className="w-3 h-3 border-2 border-white bg-gray-400 hover:bg-gray-600" 
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="w-3 h-3 border-2 border-white bg-gray-400 hover:bg-gray-600" 
      />
      <Handle 
        type="target" 
        position={Position.Left} 
        className="w-3 h-3 border-2 border-white bg-gray-400 hover:bg-gray-600" 
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        className="w-3 h-3 border-2 border-white bg-gray-400 hover:bg-gray-600" 
      />
    </div>
  );
};

export default TableNode;