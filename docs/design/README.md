# Design Preview Workspace

This folder contains APEX design explorations as standalone React JSX files. It also includes a small Vite-based preview app so any design file in this folder can be rendered locally without wiring it into the production frontend first.

## What This Supports

- Preview any `*.jsx` design file in `docs/design`
- Auto-discover new JSX mockups without extra registration
- Switch between files from a built-in preview sidebar
- Open a specific design directly with a URL query parameter
- Keep design experiments separate from the shipped product app

## Requirements

- Node.js current LTS
- `npm`

## Install

```bash
cd docs/design
npm install
```

This installs the local preview app dependencies:

- `react`
- `react-dom`
- `vite`
- `@vitejs/plugin-react`
- `recharts`

`recharts` is included because some of the design JSX files use charts directly.

## Run The Preview App

```bash
cd docs/design
npm run dev
```

The preview workspace will start on:

```text
http://localhost:4173
```

## Build Or Preview A Production Bundle

```bash
cd docs/design
npm run build
npm run preview
```

## How File Discovery Works

The preview app automatically picks up any file that:

1. lives directly inside `docs/design`
2. ends with `.jsx`
3. exports a default React component

Current examples:

- `apex-app-v9.jsx`
- `apex-landing.jsx`
- `apex-icon-library.jsx`

## How To Open A Specific Design

The preview UI includes a file picker, but you can also open a design directly with the `file` query param:

```text
http://localhost:4173/?file=apex-app-v9
http://localhost:4173/?file=apex-landing
http://localhost:4173/?file=apex-icon-library
```

You can include or omit the `.jsx` suffix in the query value.

## How To Add New Design Files

1. Create a new file in `docs/design`, for example `apex-training-v2.jsx`
2. Export a default React component from that file
3. Restart the Vite dev server if the new file does not appear immediately

Minimal example:

```jsx
export default function ApexTrainingV2() {
  return <div style={{ color: "white", background: "#0f1012", minHeight: "100vh" }}>Training concept</div>;
}
```

## Design File Guidelines

- Keep each design self-contained
- Prefer local constants and inline styling when the goal is fast exploration
- If a design needs extra dependencies, add them to `docs/design/package.json`
- Avoid importing app production code unless the design truly depends on it
- Treat this folder as a sandbox for visual/product iteration, not production source

## Troubleshooting

### The file does not appear in the preview list

Check that:

- the file is in `docs/design`
- the file ends in `.jsx`
- the file has a default export

### The preview renders blank

This usually means the component threw during render. Open the browser dev tools and check the console.

### A chart or library import fails

Install the missing dependency inside `docs/design`:

```bash
cd docs/design
npm install <package-name>
```

Then rerun:

```bash
npm run dev
```
