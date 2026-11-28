# 3D storybook look test

A standalone mock-up of a 3D PixelTown, separate from the game. Open `proto3d/index.html`
directly (it works from `file://`); three.js r160 is vendored as `three.min.js`.

- Shapes are built in code from three.js primitives, so there are no model files.
- Toon shading uses `MeshToonMaterial` with a small gradient ramp; the ink outline is an
  inverted hull pushed out along smoothed normals.
- The camera is orthographic at the game's quarter-view angle and follows the hero.
- A pink silhouette shows the hero when a house hides her.
- URL switches: `?style=storybook|watercolor|night`, `?hero=princess|captain`, `?zoom=2.5`.
