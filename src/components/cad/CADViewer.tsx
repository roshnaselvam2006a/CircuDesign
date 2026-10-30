/**
 * Interactive 3D CAD Viewer component using @react-three/fiber.
 * Ported from rahulworld/3d-cad-models-with-bom BomExplorer.js → TSX.
 *
 * Renders parsed STEP geometry with:
 * - Orbit controls (rotate, zoom, pan)
 * - Click-to-highlight individual parts
 * - Programmatic highlight via prop (for agent result linking)
 * - Show/hide parts via uncheckedParts
 *
 * PERFORMANCE: Renders one merged <mesh> per CADPart (max ~15),
 * NOT one <mesh> per raw triangle surface (which can be 2000+).
 */

import React, { useCallback, useMemo } from 'react';
import { Canvas, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Center, Bounds } from '@react-three/drei';
import * as THREE from 'three';
import type { ParsedCADModel, CADPart } from '../../types';

interface CADViewerProps {
  model: ParsedCADModel;
  /** Index into model.parts (NOT model.meshes) */
  highlightedPartIndex: number;
  onPartClick: (partIndex: number) => void;
  onPartHover: (partIndex: number) => void;
  uncheckedParts: number[];
  className?: string;
}

/** Default part material — clean metallic slate matching CircuDesign theme */
const DEFAULT_COLOR = new THREE.Color(0.55, 0.60, 0.65);
/** Highlighted part color — emerald green matching CircuDesign accent */
const HIGHLIGHT_COLOR = new THREE.Color(0.2, 0.85, 0.5);
/** Hovered part color — subtle cyan glow */
const HOVER_COLOR = new THREE.Color(0.3, 0.7, 0.85);

// ── Merged Part Mesh Component ──

interface PartMeshProps {
  meshes: any[];          // raw occt-import-js meshes for this part
  meshIndices: number[];  // indices into model.meshes
  partIndex: number;
  isHighlighted: boolean;
  isHovered: boolean;
  isVisible: boolean;
  onClick: (partIndex: number) => void;
  onHover: (partIndex: number) => void;
}

/**
 * Renders a SINGLE Three.js <mesh> for an entire CADPart by merging
 * all the part's raw triangle meshes into one BufferGeometry.
 * This is critical for performance: a STEP chair can have 2000+ meshes
 * but only ~12 parts.
 */
const PartMesh: React.FC<PartMeshProps> = React.memo(({
  meshes,
  partIndex,
  isHighlighted,
  isHovered,
  isVisible,
  onClick,
  onHover,
}) => {
  const geometry = useMemo(() => {
    // Accumulate all vertex data from this part's meshes
    const allPositions: number[] = [];
    const allNormals: number[] = [];

    for (const mesh of meshes) {
      if (!mesh?.attributes?.position?.array) continue;

      const positions = mesh.attributes.position.array;
      const normals = mesh.attributes?.normal?.array;
      const indices = mesh.index?.array;

      if (indices && indices.length > 0) {
        // Unroll indexed geometry into non-indexed for easy merging
        for (let i = 0; i < indices.length; i++) {
          const idx = indices[i] * 3;
          allPositions.push(positions[idx], positions[idx + 1], positions[idx + 2]);
          if (normals) {
            allNormals.push(normals[idx], normals[idx + 1], normals[idx + 2]);
          } else {
            allNormals.push(0, 0, 0); // placeholder; will be recomputed
          }
        }
      } else {
        // Non-indexed: directly copy
        for (let i = 0; i < positions.length; i++) {
          allPositions.push(positions[i]);
        }
        if (normals && normals.length === positions.length) {
          for (let i = 0; i < normals.length; i++) {
            allNormals.push(normals[i]);
          }
        }
      }
    }

    const geo = new THREE.BufferGeometry();
    if (allPositions.length === 0) return geo;

    geo.setAttribute('position', new THREE.Float32BufferAttribute(allPositions, 3));

    if (allNormals.length === allPositions.length && allNormals.some(n => n !== 0)) {
      geo.setAttribute('normal', new THREE.Float32BufferAttribute(allNormals, 3));
    } else {
      geo.computeVertexNormals();
    }

    geo.computeBoundingSphere();
    return geo;
  }, [meshes]);

  const color = isHighlighted ? HIGHLIGHT_COLOR : isHovered ? HOVER_COLOR : DEFAULT_COLOR;
  const emissiveIntensity = isHighlighted ? 0.5 : isHovered ? 0.2 : 0.05;

  if (!isVisible) return null;

  return (
    <mesh
      geometry={geometry}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onClick(partIndex);
      }}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        onHover(partIndex);
      }}
      onPointerOut={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        onHover(-1);
      }}
    >
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={emissiveIntensity}
        metalness={0.25}
        roughness={0.4}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
});

PartMesh.displayName = 'PartMesh';

// ── Scene Contents ──

interface SceneProps {
  model: ParsedCADModel;
  highlightedPartIndex: number;
  hoveredPartIndex: number;
  onPartClick: (partIndex: number) => void;
  onPartHover: (partIndex: number) => void;
  uncheckedParts: number[];
}

const Scene: React.FC<SceneProps> = ({
  model,
  highlightedPartIndex,
  hoveredPartIndex,
  onPartClick,
  onPartHover,
  uncheckedParts,
}) => {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.8} />
      <directionalLight position={[10, 20, 15]} intensity={1.2} />
      <directionalLight position={[-10, -15, -10]} intensity={0.6} />
      <pointLight position={[0, 15, 0]} intensity={0.5} />

      {/* Auto-fit model using Bounds and Center */}
      <Bounds fit clip observe margin={1.25}>
        <Center>
          <group>
            {model.parts.map((part: CADPart, partIndex: number) => {
              // Collect the actual mesh objects for this part
              const partMeshes = part.meshIndices
                .filter(idx => idx >= 0 && idx < model.meshes.length)
                .map(idx => model.meshes[idx]);

              if (partMeshes.length === 0) return null;

              return (
                <PartMesh
                  key={partIndex}
                  meshes={partMeshes}
                  meshIndices={part.meshIndices}
                  partIndex={partIndex}
                  isHighlighted={highlightedPartIndex === partIndex}
                  isHovered={hoveredPartIndex === partIndex}
                  isVisible={!uncheckedParts.includes(partIndex)}
                  onClick={onPartClick}
                  onHover={onPartHover}
                />
              );
            })}
          </group>
        </Center>
      </Bounds>

      {/* Controls */}
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.1}
        rotateSpeed={0.8}
        zoomSpeed={1.2}
        panSpeed={0.8}
      />
    </>
  );
};

// ── Main Viewer Component ──

export const CADViewer: React.FC<CADViewerProps> = ({
  model,
  highlightedPartIndex,
  onPartClick,
  onPartHover,
  uncheckedParts,
  className = '',
}) => {
  const [hoveredPartIndex, setHoveredPartIndex] = React.useState(-1);

  const handleHover = useCallback((index: number) => {
    setHoveredPartIndex(index);
    onPartHover(index);
  }, [onPartHover]);

  return (
    <div className={`relative w-full h-full min-h-[300px] rounded-2xl overflow-hidden bg-[#080E1A] ${className}`}>
      {/* Subtle grid floor overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: 'radial-gradient(circle at center, rgba(110, 231, 183, 0.15) 0%, transparent 70%)',
        }}
      />

      <Canvas
        camera={{ position: [50, 40, 50], fov: 45, near: 0.1, far: 20000 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Scene
          model={model}
          highlightedPartIndex={highlightedPartIndex}
          hoveredPartIndex={hoveredPartIndex}
          onPartClick={onPartClick}
          onPartHover={handleHover}
          uncheckedParts={uncheckedParts}
        />
      </Canvas>

      {/* Viewer badge */}
      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-lg bg-black/60 backdrop-blur-sm px-2.5 py-1 border border-white/10">
        <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[9px] font-semibold text-slate-300 uppercase tracking-wider">
          3D CAD Viewer • {model.parts.length} parts
        </span>
      </div>
    </div>
  );
};
