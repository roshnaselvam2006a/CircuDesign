/**
 * Interactive 3D CAD Viewer component using @react-three/fiber.
 * Ported from rahulworld/3d-cad-models-with-bom BomExplorer.js → TSX.
 *
 * Renders parsed STEP geometry with:
 * - Orbit controls (rotate, zoom, pan)
 * - Click-to-highlight individual parts
 * - Programmatic highlight via prop (for agent result linking)
 * - Show/hide parts via uncheckedMeshes
 */

import React, { useCallback, useMemo, useRef } from 'react';
import { Canvas, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Center } from '@react-three/drei';
import * as THREE from 'three';
import type { ParsedCADModel } from '../../types';

interface CADViewerProps {
  model: ParsedCADModel;
  highlightedMeshIndex: number;
  onMeshClick: (meshIndex: number) => void;
  onMeshHover: (meshIndex: number) => void;
  uncheckedMeshes: number[];
  className?: string;
}

/** Default part material — dark metallic gray matching CircuDesign theme */
const DEFAULT_COLOR = new THREE.Color(0.35, 0.40, 0.45);
/** Highlighted part color — emerald green matching CircuDesign accent */
const HIGHLIGHT_COLOR = new THREE.Color(0.2, 0.85, 0.5);
/** Hovered part color — subtle cyan glow */
const HOVER_COLOR = new THREE.Color(0.3, 0.7, 0.85);

// ── Individual Mesh Component ──

interface MeshPartProps {
  mesh: any;
  meshIndex: number;
  isHighlighted: boolean;
  isHovered: boolean;
  isVisible: boolean;
  onClick: (meshIndex: number) => void;
  onHover: (meshIndex: number) => void;
}

const MeshPart: React.FC<MeshPartProps> = React.memo(({
  mesh,
  meshIndex,
  isHighlighted,
  isHovered,
  isVisible,
  onClick,
  onHover,
}) => {
  const geometryRef = useRef<THREE.BufferGeometry>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();

    if (mesh.attributes?.position?.array) {
      geo.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(mesh.attributes.position.array, 3)
      );
    }

    if (mesh.attributes?.normal?.array) {
      geo.setAttribute(
        'normal',
        new THREE.Float32BufferAttribute(mesh.attributes.normal.array, 3)
      );
    }

    if (mesh.index?.array) {
      geo.setIndex(new THREE.BufferAttribute(new Uint32Array(mesh.index.array), 1));
    }

    geo.computeBoundingSphere();
    return geo;
  }, [mesh]);

  const color = isHighlighted ? HIGHLIGHT_COLOR : isHovered ? HOVER_COLOR : DEFAULT_COLOR;
  const emissiveIntensity = isHighlighted ? 0.4 : isHovered ? 0.15 : 0;

  if (!isVisible) return null;

  return (
    <mesh
      geometry={geometry}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onClick(meshIndex);
      }}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        onHover(meshIndex);
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
        metalness={0.3}
        roughness={0.6}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
});

MeshPart.displayName = 'MeshPart';

// ── Scene Contents ──

interface SceneProps {
  model: ParsedCADModel;
  highlightedMeshIndex: number;
  hoveredMeshIndex: number;
  onMeshClick: (meshIndex: number) => void;
  onMeshHover: (meshIndex: number) => void;
  uncheckedMeshes: number[];
}

const Scene: React.FC<SceneProps> = ({
  model,
  highlightedMeshIndex,
  hoveredMeshIndex,
  onMeshClick,
  onMeshHover,
  uncheckedMeshes,
}) => {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 8, 5]} intensity={1.0} castShadow />
      <directionalLight position={[-3, -5, -4]} intensity={0.3} />
      <pointLight position={[0, 10, 0]} intensity={0.4} />

      {/* Model */}
      <Center>
        <group scale={[0.1, 0.1, 0.1]}>
          {model.meshes.map((mesh: any, index: number) => (
            <MeshPart
              key={index}
              mesh={mesh}
              meshIndex={index}
              isHighlighted={highlightedMeshIndex === index}
              isHovered={hoveredMeshIndex === index}
              isVisible={!uncheckedMeshes.includes(index)}
              onClick={onMeshClick}
              onHover={onMeshHover}
            />
          ))}
        </group>
      </Center>

      {/* Controls */}
      <OrbitControls
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
  highlightedMeshIndex,
  onMeshClick,
  onMeshHover,
  uncheckedMeshes,
  className = '',
}) => {
  const [hoveredMeshIndex, setHoveredMeshIndex] = React.useState(-1);

  const handleHover = useCallback((index: number) => {
    setHoveredMeshIndex(index);
    onMeshHover(index);
  }, [onMeshHover]);

  return (
    <div className={`relative w-full h-full min-h-[300px] rounded-2xl overflow-hidden bg-[#080E1A] ${className}`}>
      {/* Subtle grid floor overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: 'radial-gradient(circle at center, rgba(110, 231, 183, 0.15) 0%, transparent 70%)',
        }}
      />

      <Canvas
        camera={{ position: [6, 4, 6], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Scene
          model={model}
          highlightedMeshIndex={highlightedMeshIndex}
          hoveredMeshIndex={hoveredMeshIndex}
          onMeshClick={onMeshClick}
          onMeshHover={handleHover}
          uncheckedMeshes={uncheckedMeshes}
        />
      </Canvas>

      {/* Viewer badge */}
      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-lg bg-black/60 backdrop-blur-sm px-2.5 py-1 border border-white/10">
        <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[9px] font-semibold text-slate-300 uppercase tracking-wider">
          3D CAD Viewer • occt-import-js
        </span>
      </div>
    </div>
  );
};
