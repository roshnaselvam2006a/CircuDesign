/**
 * STEP file parser using occt-import-js (WASM OpenCASCADE build).
 * Ported from rahulworld/3d-cad-models-with-bom StepLoader.js → TypeScript.
 *
 * Loads STEP/STP files client-side, extracts mesh geometry and part tree.
 *
 * IMPORTANT: We load occt-import-js entirely from CDN at runtime.
 * Vite's bundler transforms the JS glue code in ways that break the
 * WASM import contract (causing "function import requires a callable" errors).
 * Loading from CDN keeps JS+WASM perfectly matched and untransformed.
 */

import type { CADPart, ParsedCADModel } from '../types';

// CDN URLs for both the JS glue code and WASM binary
const OCCT_CDN_JS =
  'https://cdn.jsdelivr.net/npm/occt-import-js@0.0.12/dist/occt-import-js.js';
const OCCT_CDN_WASM =
  'https://cdn.jsdelivr.net/npm/occt-import-js@0.0.12/dist/occt-import-js.wasm';

// Cache the loaded module so we only fetch once
let occtModulePromise: Promise<any> | null = null;

/**
 * Load occt-import-js from CDN, bypassing Vite's bundler entirely.
 * Returns the initialized OCCT instance ready to parse STEP files.
 */
async function loadOcctFromCDN(): Promise<any> {
  if (!occtModulePromise) {
    occtModulePromise = (async () => {
      // Fetch the JS glue code as text and evaluate it
      const response = await fetch(OCCT_CDN_JS);
      if (!response.ok) {
        throw new Error(`Failed to fetch occt-import-js from CDN: ${response.status}`);
      }
      const jsCode = await response.text();

      // The module sets module.exports = factory function.
      // We create a minimal CommonJS-like environment to capture it.
      const moduleShim = { exports: {} as any };
      const wrappedCode = `(function(module, exports) { ${jsCode} })`;

      // eslint-disable-next-line no-eval
      const wrapper = (0, eval)(wrappedCode);
      wrapper(moduleShim, moduleShim.exports);

      // The factory function is now on module.exports
      const factory = typeof moduleShim.exports === 'function'
        ? moduleShim.exports
        : moduleShim.exports.default || moduleShim.exports;

      if (typeof factory !== 'function') {
        throw new Error('occt-import-js CDN load failed: factory is not a function');
      }

      // Initialize with WASM from CDN
      const occt = await factory({
        locateFile: () => OCCT_CDN_WASM,
      });

      return occt;
    })();
  }
  return occtModulePromise;
}

/** Maximum number of parts to extract from a STEP file */
const MAX_PARTS = 15;

/**
 * Parse a STEP file from an ArrayBuffer.
 * Returns raw mesh data + part tree from occt-import-js.
 */
export async function parseStepBuffer(buffer: ArrayBuffer): Promise<ParsedCADModel> {
  const occt = await loadOcctFromCDN();

  const fileBuffer = new Uint8Array(buffer);
  const result = occt.ReadStepFile(fileBuffer);

  if (!result || !result.meshes || result.meshes.length === 0) {
    throw new Error('Failed to parse STEP file: no geometry found.');
  }

  const parts = extractPartList(result);

  return {
    meshes: result.meshes,
    root: result.root,
    parts,
  };
}

/**
 * Extract a sensible flat list of parts from the parsed STEP model.
 *
 * STRATEGY:  The occt-import-js output for many STEP files is a flat tree
 * where every surface patch becomes its own mesh (thousands of them).
 * Instead of mapping 1 mesh → 1 part, we group meshes into a small number
 * of logical structural components (max MAX_PARTS).
 *
 * 1.  Try grouping by the ROOT's immediate children (assembly sub-nodes).
 *     Each top-level child collects ALL meshes from its subtree.
 *     This works well for properly structured STEP assemblies.
 *
 * 2.  If step 1 produces too few groups (e.g. a single root child owns
 *     everything) or too many, we fall back to even-chunking the meshes
 *     into ~12 structural groups.
 *
 * 3.  Final cap: if more than MAX_PARTS parts, keep the largest and
 *     consolidate the rest into a single "Hardware & Fasteners" group.
 */
function extractPartList(rawModel: any): CADPart[] {
  const totalMeshes = rawModel.meshes.length;

  // ── Step 1: Try grouping by top-level children ──
  let groups: { name: string; meshIndices: number[] }[] = [];

  if (rawModel.root?.children?.length > 0) {
    for (const child of rawModel.root.children) {
      const meshIndices = collectMeshes(child);
      if (meshIndices.length > 0) {
        const childName = child.name && !isGenericName(child.name)
          ? child.name
          : '';
        groups.push({ name: childName, meshIndices });
      }
    }
  }

  // ── Step 2: If grouping didn't produce a useful number, chunk instead ──
  const groupsUseful = groups.length >= 2 && groups.length <= MAX_PARTS;
  if (!groupsUseful) {
    groups = chunkMeshes(rawModel, totalMeshes);
  }

  // ── Step 3: Build parts with volume estimation ──
  let parts: CADPart[] = groups.map((g, idx) => {
    const volume = g.meshIndices.reduce(
      (sum, meshIdx) => sum + estimateMeshVolume(rawModel.meshes[meshIdx]),
      0
    );
    return {
      name: g.name || assignStructuralName(idx, groups.length),
      meshIndices: g.meshIndices,
      estimatedVolumeCm3: volume,
    };
  });

  // ── Step 4: Cap at MAX_PARTS ──
  if (parts.length > MAX_PARTS) {
    parts.sort((a, b) => b.estimatedVolumeCm3 - a.estimatedVolumeCm3);
    const keep = parts.slice(0, MAX_PARTS - 1);
    const rest = parts.slice(MAX_PARTS - 1);
    const restMeshes = rest.flatMap(p => p.meshIndices);
    const restVol = rest.reduce((s, p) => s + p.estimatedVolumeCm3, 0);
    keep.push({
      name: 'Hardware & Fasteners Assembly',
      meshIndices: restMeshes,
      estimatedVolumeCm3: restVol,
    });
    parts = keep;
  }

  return parts;
}

// ── Helpers ──

/** Recursively collect all mesh indices under a node */
function collectMeshes(node: any): number[] {
  const indices: number[] = [];
  if (node.meshes) {
    for (const idx of node.meshes) {
      indices.push(idx);
    }
  }
  if (node.children) {
    for (const child of node.children) {
      indices.push(...collectMeshes(child));
    }
  }
  return indices;
}

/** Check if a STEP node name is generic / auto-generated */
function isGenericName(name: string): boolean {
  if (!name) return true;
  return /^(Part|Mesh|Component|Shape|Body|Solid|Shell|Face|Surface)\s*\d*$/i.test(name.trim());
}

/**
 * When the tree structure doesn't yield useful groups, split meshes
 * into ~12 even chunks with furniture-aware names.
 */
function chunkMeshes(rawModel: any, totalMeshes: number): { name: string; meshIndices: number[] }[] {
  const targetGroups = Math.min(12, Math.max(3, Math.ceil(totalMeshes / 50)));
  const chunkSize = Math.ceil(totalMeshes / targetGroups);
  const groups: { name: string; meshIndices: number[] }[] = [];

  for (let g = 0; g < targetGroups; g++) {
    const start = g * chunkSize;
    const end = Math.min(start + chunkSize, totalMeshes);
    if (start >= totalMeshes) break;

    const meshIndices: number[] = [];
    for (let i = start; i < end; i++) {
      meshIndices.push(i);
    }

    groups.push({
      name: assignStructuralName(g, targetGroups),
      meshIndices,
    });
  }
  return groups;
}

/**
 * Assign a meaningful furniture/product structural name by position.
 * These names will be matched by materialLookup.ts keyword rules.
 */
function assignStructuralName(index: number, total: number): string {
  // Map positions to typical furniture/product component names
  // so the material agent can infer wood/metal/etc. properly
  const structuralNames = [
    'Seat Panel',
    'Backrest Frame',
    'Front Leg Assembly',
    'Rear Leg Assembly',
    'Side Rail Left',
    'Side Rail Right',
    'Cross Brace Support',
    'Armrest Left',
    'Armrest Right',
    'Seat Support Frame',
    'Foot Rail Stretcher',
    'Joint Hardware & Fasteners',
    'Decorative Trim',
    'Structural Gusset',
    'Back Slat Panel',
  ];

  if (index < structuralNames.length) {
    return structuralNames[index];
  }
  return `Structural Member ${index + 1}`;
}


/**
 * Estimate the volume of a triangulated mesh in cm³ using the divergence theorem
 * (signed tetrahedra method). This assumes the mesh is a closed, watertight surface.
 * For non-watertight meshes, the result is approximate but generally useful for
 * mass estimation.
 *
 * Formula for each triangle (v0, v1, v2):
 *   V_tet = v0 · (v1 × v2) / 6
 *   Total volume = |Σ V_tet|
 *
 * Input positions are assumed to be in mm (standard STEP units).
 * Output is in cm³ (divide mm³ by 1000).
 */
function estimateMeshVolume(mesh: any): number {
  if (!mesh.attributes || !mesh.attributes.position) return 1.0; // fallback 1 cm³

  const positions = mesh.attributes.position.array;
  if (!positions || positions.length < 9) return 1.0;

  let volume = 0;
  const index = mesh.index?.array;

  if (index) {
    // Indexed geometry
    for (let i = 0; i < index.length; i += 3) {
      const i0 = index[i] * 3;
      const i1 = index[i + 1] * 3;
      const i2 = index[i + 2] * 3;

      volume += signedTetraVolume(
        positions[i0], positions[i0 + 1], positions[i0 + 2],
        positions[i1], positions[i1 + 1], positions[i1 + 2],
        positions[i2], positions[i2 + 1], positions[i2 + 2]
      );
    }
  } else {
    // Non-indexed geometry (every 3 vertices = 1 triangle)
    for (let i = 0; i < positions.length; i += 9) {
      volume += signedTetraVolume(
        positions[i], positions[i + 1], positions[i + 2],
        positions[i + 3], positions[i + 4], positions[i + 5],
        positions[i + 6], positions[i + 7], positions[i + 8]
      );
    }
  }

  // Convert from mm³ to cm³ and take absolute value
  return Math.max(Math.abs(volume / 6) / 1000, 0.01);
}

/** Signed volume of tetrahedron formed by triangle + origin */
function signedTetraVolume(
  x0: number, y0: number, z0: number,
  x1: number, y1: number, z1: number,
  x2: number, y2: number, z2: number
): number {
  return (
    x0 * (y1 * z2 - y2 * z1) +
    x1 * (y2 * z0 - y0 * z2) +
    x2 * (y0 * z1 - y1 * z0)
  );
}
