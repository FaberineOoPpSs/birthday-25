# 3D Model Assets — Birthday Scene

Place your 3D model files in **this folder** (`assets/models/`).

The Three.js scene automatically detects and loads them. If a file is
missing it falls back to a procedural stand-in so the site still works.

---

## ✅ Required File Format: **GLB** (Binary GLTF 2.0)

| Why GLB? | Details |
|----------|---------|
| **Single file** | Textures, materials, and geometry are all embedded in one `.glb` binary — no separate texture folders needed |
| **Industry standard** | Supported natively by Blender, Maya, Cinema 4D, Spline, Sketchfab, and Three.js |
| **Small file size** | Binary packing + optional Draco mesh compression (already enabled in the loader) |
| **PBR materials** | Supports metalness/roughness, normal maps, emissive maps — all used in the scene |

---

## 📂 Expected File Names (exact names required)

| File | Object | Notes |
|------|--------|-------|
| `table.glb` | The round table + pedestal | Scene scale ≈ real world. Table diameter ~3 m recommended |
| `cake.glb` | Full birthday cake (all tiers) | Should sit at Y = 0 (table surface). Include the plaque if desired |
| `candles.glb` | Both candles "2" and "5" | Flame tips exported as empty/helper objects named `flame_2` and `flame_5` so the JS can attach animated sprites |
| `letter.glb` | The closed envelope / letter | This is the **interactive click target** — keep geometry clean for raycasting |

---

## 🎨 Export Settings (Blender as example)

1. **File → Export → glTF 2.0 (.glb/.gltf)**
2. Choose **GLB** (binary)
3. Enable: `Apply Modifiers`, `UVs`, `Normals`, `Tangents`
4. Materials: `Export` → `PBR Extensions`
5. Optional — **Draco compression** for smaller files:
   - Install the Blender Draco add-on
   - Enable `Draco Mesh Compression` in the glTF exporter
   - The loader in `scene.js` already has DRACOLoader configured

---

## 📐 Scale & Orientation

- Use **metric units** (1 Blender unit = 1 metre)
- Forward axis: **-Z**, Up axis: **Y** (GLTF standard)
- The scene places the table at **Y = 0** (world origin)

---

## 🔄 Other Compatible Formats (if you can't export GLB)

Three.js can load these with minimal changes to `scene.js`:

| Format | Extension | Notes |
|--------|-----------|-------|
| Binary GLTF | `.glb` | **Preferred — use this** |
| ASCII GLTF  | `.gltf` + texture folder | Multi-file, less convenient |
| OBJ + MTL   | `.obj` + `.mtl` | Older; no PBR, no animations |
| FBX         | `.fbx` | Needs FBXLoader swap in scene.js |

---

## 🚀 How Integration Works

When you drop a GLB file here and refresh the browser:

```
scene.js calls:
  loadModel('assets/models/table.glb', onSuccess, onFallback)

If file exists  → custom model replaces the procedural stand-in
If file missing → procedural geometry is used automatically
```

No code changes needed — just drop the files in this folder.

