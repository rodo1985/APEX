import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

const designModules = import.meta.glob("../*.jsx", { eager: true });

const previews = Object.entries(designModules)
  .map(([filePath, module]) => {
    const fileName = filePath.split("/").pop() ?? filePath;
    const fileKey = fileName.replace(/\.jsx$/, "");

    return {
      fileKey,
      fileName,
      Component: module.default,
    };
  })
  .filter((entry) => typeof entry.Component === "function")
  .sort((left, right) => left.fileName.localeCompare(right.fileName));

function getInitialSelection() {
  const params = new URLSearchParams(window.location.search);
  const requested = params.get("file");

  if (!requested) {
    return previews[0]?.fileKey ?? "";
  }

  const normalized = requested.replace(/\.jsx$/, "");
  const match = previews.find((entry) => entry.fileKey === normalized);
  return match?.fileKey ?? previews[0]?.fileKey ?? "";
}

function updateUrl(fileKey) {
  const params = new URLSearchParams(window.location.search);
  params.set("file", fileKey);
  window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
}

function PreviewFrame({ Component, frameKey }) {
  const iframeRef = useRef(null);
  const [mountNode, setMountNode] = useState(null);

  return (
    <>
      <iframe
        key={frameKey}
        ref={iframeRef}
        title={`${frameKey} preview`}
        className="design-frame"
        srcDoc={frameDocument}
        onLoad={() => {
          const doc = iframeRef.current?.contentDocument;
          const nextMountNode = doc?.getElementById("design-root") ?? null;
          setMountNode(nextMountNode);
        }}
      />
      {mountNode ? createPortal(<Component />, mountNode) : null}
    </>
  );
}

export function DesignPreviewApp() {
  const [selectedFile, setSelectedFile] = useState(getInitialSelection);

  const activePreview = useMemo(
    () => previews.find((entry) => entry.fileKey === selectedFile) ?? previews[0] ?? null,
    [selectedFile],
  );

  useEffect(() => {
    if (activePreview) {
      updateUrl(activePreview.fileKey);
      document.title = `${activePreview.fileName} · APEX Design Preview`;
    }
  }, [activePreview]);

  if (!activePreview) {
    return (
      <main className="design-shell">
        <section className="design-empty">
          <h1>No design previews found</h1>
          <p>Add one or more `*.jsx` files to this folder with a default React export.</p>
        </section>
      </main>
    );
  }

  return (
    <>
      <style>{shellCss}</style>
      <main className="design-shell">
        <aside className="design-sidebar">
          <div className="design-sidebar-header">
            <p>APEX Design</p>
            <h1>Preview workspace</h1>
            <span>{previews.length} JSX file{previews.length === 1 ? "" : "s"}</span>
          </div>

          <div className="design-sidebar-list">
            {previews.map((entry) => (
              <button
                key={entry.fileKey}
                type="button"
                className={`design-file-button${entry.fileKey === activePreview.fileKey ? " active" : ""}`}
                onClick={() => setSelectedFile(entry.fileKey)}
              >
                <strong>{entry.fileKey}</strong>
                <span>{entry.fileName}</span>
              </button>
            ))}
          </div>

          <div className="design-sidebar-note">
            New files appear automatically if they:
            <br />
            1. live in `docs/design`
            <br />
            2. end in `.jsx`
            <br />
            3. export a default React component
          </div>
        </aside>

        <section className="design-stage">
          <header className="design-toolbar">
            <div>
              <p>Selected preview</p>
              <h2>{activePreview.fileName}</h2>
            </div>
            <a className="design-open-link" href={`?file=${activePreview.fileKey}`} target="_blank" rel="noreferrer">
              Open selected view
            </a>
          </header>

          <PreviewFrame Component={activePreview.Component} frameKey={activePreview.fileKey} />
        </section>
      </main>
    </>
  );
}

const shellCss = `
  :root {
    color-scheme: dark;
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    background: #090a0d;
    color: #f5f7fb;
  }

  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    min-height: 100vh;
    background:
      radial-gradient(circle at top left, rgba(45, 212, 191, 0.15), transparent 26%),
      linear-gradient(180deg, #0b0d10 0%, #090a0d 100%);
  }

  button,
  a {
    font: inherit;
  }

  .design-shell {
    min-height: 100vh;
    display: grid;
    grid-template-columns: 320px minmax(0, 1fr);
  }

  .design-sidebar {
    border-right: 1px solid rgba(255, 255, 255, 0.08);
    padding: 28px 20px;
    background: rgba(11, 13, 16, 0.92);
    backdrop-filter: blur(18px);
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .design-sidebar-header p,
  .design-toolbar p {
    margin: 0 0 8px;
    font-size: 12px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #2dd4bf;
    font-weight: 700;
  }

  .design-sidebar-header h1,
  .design-toolbar h2 {
    margin: 0;
    font-size: 24px;
    line-height: 1.1;
  }

  .design-sidebar-header span {
    display: block;
    margin-top: 10px;
    color: #98a0b3;
    font-size: 14px;
  }

  .design-sidebar-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    overflow: auto;
  }

  .design-file-button {
    width: 100%;
    text-align: left;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: #13161c;
    color: #f5f7fb;
    border-radius: 16px;
    padding: 14px 16px;
    transition: border-color 0.18s ease, transform 0.18s ease, background 0.18s ease;
  }

  .design-file-button:hover {
    border-color: rgba(45, 212, 191, 0.4);
    transform: translateY(-1px);
  }

  .design-file-button.active {
    background: rgba(45, 212, 191, 0.1);
    border-color: rgba(45, 212, 191, 0.5);
  }

  .design-file-button strong {
    display: block;
    font-size: 15px;
    margin-bottom: 6px;
  }

  .design-file-button span {
    font-size: 12px;
    color: #98a0b3;
  }

  .design-sidebar-note {
    margin-top: auto;
    padding: 14px 16px;
    border-radius: 16px;
    background: #11141a;
    border: 1px solid rgba(255, 255, 255, 0.06);
    color: #98a0b3;
    font-size: 13px;
    line-height: 1.65;
  }

  .design-stage {
    min-width: 0;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .design-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .design-open-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    padding: 10px 16px;
    background: rgba(45, 212, 191, 0.1);
    border: 1px solid rgba(45, 212, 191, 0.35);
    color: #8ef0e0;
    text-decoration: none;
    font-weight: 600;
  }

  .design-frame {
    flex: 1;
    width: 100%;
    min-height: calc(100vh - 120px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 24px;
    background: #0f1012;
    box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
  }

  .design-empty {
    margin: auto;
    padding: 32px;
    text-align: center;
  }

  @media (max-width: 960px) {
    .design-shell {
      grid-template-columns: 1fr;
    }

    .design-sidebar {
      border-right: none;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    .design-frame {
      min-height: 75vh;
    }

    .design-toolbar {
      flex-direction: column;
      align-items: flex-start;
    }
  }
`;

const frameDocument = `
  <!doctype html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <style>
        html, body, #design-root {
          margin: 0;
          min-height: 100%;
          width: 100%;
          background: #0f1012;
        }
      </style>
    </head>
    <body>
      <div id="design-root"></div>
    </body>
  </html>
`;
