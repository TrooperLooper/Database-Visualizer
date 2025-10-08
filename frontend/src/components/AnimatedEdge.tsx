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
  markerEnd,
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
            @keyframes flowDot {
              0% { opacity: 0; }
              20% { opacity: 1; }
              80% { opacity: 1; }
              100% { opacity: 0; }
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
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeWidth: 3,
          stroke: "#000000",
        }}
        className="animated-edge"
      />

      {/* Flow direction indicators */}
      <circle
        cx={sourceX + (targetX - sourceX) * 0.3}
        cy={sourceY + (targetY - sourceY) * 0.3}
        r="3"
        fill="#000000"
        style={{
          animation: "flowDot 3s ease-in-out infinite",
        }}
      />

      <circle
        cx={sourceX + (targetX - sourceX) * 0.7}
        cy={sourceY + (targetY - sourceY) * 0.7}
        r="2.5"
        fill="#000000"
        style={{
          animation: "flowDot 3s ease-in-out infinite 1s",
        }}
      />

      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 11,
              fontWeight: 500,
              background: "rgba(255, 255, 255, 0.9)",
              padding: "2px 6px",
              borderRadius: "4px",
              border: "1px solid #e5e7eb",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
              pointerEvents: "all",
              color: "#374151",
            }}
            className="nodrag nopan"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

export default AnimatedEdge;
