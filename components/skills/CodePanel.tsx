"use client";

import { useId, useState } from "react";
import type { Token } from "@/lib/highlight";

export type PanelFile = { name: string; code: string; lines: Token[][] };

/** An editor-looking panel: file tabs, line numbers, highlighted tokens, copy. Read-only by design. */
export function CodePanel({ files }: { files: PanelFile[] }) {
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState(false);
  const id = useId();
  const file = files[active];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(file.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="code-panel">
      <div className="code-bar">
        <span className="code-dots" aria-hidden="true"><i /><i /><i /></span>
        <div className="code-tabs" role="tablist" aria-label="Files">
          {files.map((item, index) => (
            <button
              key={item.name}
              type="button"
              role="tab"
              id={`${id}-tab-${index}`}
              aria-selected={index === active}
              aria-controls={`${id}-panel`}
              tabIndex={index === active ? 0 : -1}
              onClick={() => setActive(index)}
              onKeyDown={(event) => {
                if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
                const nextIndex = (active + (event.key === "ArrowRight" ? 1 : files.length - 1)) % files.length;
                setActive(nextIndex);
                document.getElementById(`${id}-tab-${nextIndex}`)?.focus();
              }}
            >
              {item.name}
            </button>
          ))}
        </div>
        <button type="button" className="code-copy mono" onClick={copy}>{copied ? "copied" : "copy"}</button>
      </div>
      <div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-tab-${active}`} className="code-scroll" tabIndex={0}>
        <pre>
          <code>
            {file.lines.map((line, index) => (
              <span key={index} className="code-line">
                <span className="code-num" aria-hidden="true">{index + 1}</span>
                <span className="code-text">
                  {line.length ? line.map((token, i) => <span key={i} className={token.kind === "plain" ? undefined : `tk-${token.kind}`}>{token.text}</span>) : " "}
                </span>
              </span>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}
