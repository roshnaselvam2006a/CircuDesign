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
 * Extract a flat list of parts from the parsed STEP model's part tree.
 * Each part corresponds to a child of the root node, containing one or more meshes.
 */
function extractPartList(rawModel: any): CADPart[] {
  const parts: CADPart[] = [];

  if (!rawModel.root || !rawModel.root.children) {
    // Flat model — treat each mesh as a separate part
    for (let i = 0; i < rawModel.meshes.length; i++) {
      const mesh = rawModel.meshes[i];
      parts.push({
        name: mesh.name || `Part ${i + 1}`,
        meshIndices: [i],
        estimatedVolumeCm3: estimateMeshVolume(mesh),
      });
    }
    return parts;
  }

  // Walk the part tree
  const walkNode = (node: any, depth: number) => {
    if (node.meshes && node.meshes.length > 0) {
      // This node has meshes — it's a leaf part
      const volume = node.meshes.reduce(
        (sum: number, meshIdx: number) => sum + estimateMeshVolume(rawModel.meshes[meshIdx]),
        0
      );
      parts.push({
        name: node.name || `Part ${parts.length + 1}`,
        meshIndices: [...node.meshes],
        estimatedVolumeCm3: volume,
      });
    }

    if (node.children) {
      for (const child of node.children) {
        walkNode(child, depth + 1);
      }
    }
  };

  // Start from root children to skip the root assembly node itself
  if (rawModel.root.children.length > 0) {
    for (const child of rawModel.root.children) {
      walkNode(child, 0);
    }
  }

  // If no parts were found from tree walking, fall back to mesh-level parts
  if (parts.length === 0) {
    for (let i = 0; i < rawModel.meshes.length; i++) {
      const mesh = rawModel.meshes[i];
      parts.push({
        name: mesh.name || `Part ${i + 1}`,
        meshIndices: [i],
        estimatedVolumeCm3: estimateMeshVolume(mesh),
      });
    }
  }

  return parts;
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
