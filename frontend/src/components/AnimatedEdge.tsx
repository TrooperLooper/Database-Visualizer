import React from "react";
import {
  type EdgeProps,
  getSmoothStepPath,
  EdgeLabelRenderer,
  BaseEdge,
} from "@xyflow/react";

const AnimatedEdge: React.FC<EdgeProps> = ({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  label,
}) => {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Determine relationship type based on column naming patterns
  const getRelationshipType = (sourceCol: string, targetCol: string) => {
    const source = sourceCol?.toLowerCase() || '';
    const target = targetCol?.toLowerCase() || '';
    
    // Check for one-to-one patterns (same column names, unique constraints, primary key to primary key)
    if (
      source === target || 
      source.includes('unique') || 
      target.includes('unique') ||
      (source === 'id' && target === 'id')
    ) {
      return 'one-to-one';
    }
    
    // Check for many-to-many patterns (junction tables with multiple foreign keys)
    // This would be more accurate if we had table context, but for now:
    // Look for patterns like user_id -> role_id, product_id -> category_id (different entity types)
    const sourceEntity = source.replace(/_id$|id$/, '');
    const targetEntity = target.replace(/_id$|id$/, '');
    
    // If both are foreign keys but reference different entity types, might be many-to-many
    // This is a simplified heuristic - in practice you'd need schema context
    if (
      source.includes('_id') && 
      target.includes('_id') && 
      sourceEntity !== targetEntity &&
      sourceEntity.length > 0 && 
      targetEntity.length > 0
    ) {
      return 'many-to-many';
    }
    
    // Default to one-to-many (most common foreign key relationship)
    return 'one-to-many';
  };

  // Get relationship symbols
  const getRelationshipSymbols = (relationshipType: string) => {
    switch (relationshipType) {
      case 'one-to-one':
        return { source: '●', target: '●', color: '#000000' }; // Black
      case 'one-to-many':
        return { source: '●', target: '●●●', color: '#000000' }; // Black
      case 'many-to-many':
        return { source: '●●●', target: '●●●', color: '#000000' }; // Black
      default:
        return { source: '●', target: '●●●', color: '#000000' }; // Black
    }
  };

  // Extract column names from label if available
  const extractColumns = (labelText: string) => {
    if (!labelText) return { source: '', target: '' };
    const parts = labelText.split(' → ');
    return {
      source: parts[0] || '',
      target: parts[1] || ''
    };
  };

  const columns = extractColumns(label as string);
  const relationshipType = getRelationshipType(columns.source, columns.target);
  const symbols = getRelationshipSymbols(relationshipType);

  return (
    <>
      <defs>
        <style>
          {`
            @keyframes dash {
              to {
                stroke-dashoffset: -12;
              }
            }
            .animated-edge {
              stroke-dasharray: 8,4;
              animation: dash 2s linear infinite;
              filter: drop-shadow(1px 1px 2px rgba(0,0,0,0.2));
            }
          `}
        </style>
      </defs>

      <BaseEdge
        path={edgePath}
        style={{
          ...style,
          strokeWidth: 3,
          stroke: symbols.color,
        }}
        className="animated-edge"
      />

      {/* Source Symbol */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${sourceX}px,${sourceY}px)`,
            fontSize: 16,
            fontWeight: 'bold',
            color: symbols.color,
            background: 'white',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `2px solid ${symbols.color}`,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          {symbols.source}
        </div>
      </EdgeLabelRenderer>

      {/* Target Symbol */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${targetX}px,${targetY}px)`,
            fontSize: 16,
            fontWeight: 'bold',
            color: symbols.color,
            background: 'white',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `2px solid ${symbols.color}`,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          {symbols.target}
        </div>
      </EdgeLabelRenderer>

      {/* Relationship Label */}
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 11,
              fontWeight: 500,
              background: "rgba(255, 255, 255, 0.95)",
              padding: "4px 8px",
              borderRadius: "6px",
              border: `1px solid ${symbols.color}`,
              boxShadow: "0 2px 6px rgba(0, 0, 0, 0.15)",
              pointerEvents: "all",
              color: "#374151",
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              minWidth: '120px',
            }}
            className="nodrag nopan"
          >
            <div style={{ color: symbols.color, fontWeight: 'bold', fontSize: '10px', marginBottom: '2px' }}>
              {relationshipType.toUpperCase().replace('-', ':')}
            </div>
            <div>{label}</div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

export default AnimatedEdge;
