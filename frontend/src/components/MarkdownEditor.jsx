import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * MarkdownEditor
 * A GitHub-style Write / Preview tab editor for task descriptions.
 *
 * Props:
 *   value      string   — current markdown string
 *   onChange   fn       — (newValue: string) => void
 *   placeholder string
 *   minHeight  string   — e.g. "160px"
 */
const MarkdownEditor = ({ value, onChange, placeholder = "Write a description…", minHeight = "160px" }) => {
  const [tab, setTab] = useState("write");

  return (
    <div className="rounded-xl border border-zinc-700 overflow-hidden bg-zinc-900 focus-within:border-sky-600 transition">
      {/* Tab bar */}
      <div className="flex items-center border-b border-zinc-800 px-2 pt-1 gap-1">
        <button
          type="button"
          onClick={() => setTab("write")}
          className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg transition ${
            tab === "write"
              ? "text-white bg-zinc-800 border border-b-zinc-800 border-zinc-700"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Write
        </button>
        <button
          type="button"
          onClick={() => setTab("preview")}
          className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg transition ${
            tab === "preview"
              ? "text-white bg-zinc-800 border border-b-zinc-800 border-zinc-700"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Preview
        </button>
        <span className="ml-auto text-[10px] text-zinc-600 pr-2">Markdown supported</span>
      </div>

      {/* Write pane */}
      {tab === "write" && (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          spellCheck={false}
          style={{ minHeight }}
          className="w-full bg-transparent text-sm text-zinc-200 placeholder-zinc-600 p-3.5 outline-none resize-y font-mono leading-relaxed"
        />
      )}

      {/* Preview pane */}
      {tab === "preview" && (
        <div
          className="p-3.5 text-sm text-zinc-300 leading-relaxed"
          style={{ minHeight }}
        >
          {value?.trim() ? (
            <MarkdownContent content={value} />
          ) : (
            <p className="text-zinc-600 italic">Nothing to preview.</p>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * MarkdownContent — stateless, renders markdown as styled HTML.
 * Exported separately so it can be used in view mode too.
 */
export const MarkdownContent = ({ content }) => {
  if (!content) return null;
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => <h1 className="text-xl font-bold text-white mb-2 mt-3 border-b border-zinc-700 pb-1">{children}</h1>,
        h2: ({ children }) => <h2 className="text-lg font-bold text-white mb-2 mt-3">{children}</h2>,
        h3: ({ children }) => <h3 className="text-base font-semibold text-zinc-200 mb-1.5 mt-2">{children}</h3>,
        p:  ({ children }) => <p className="mb-2 leading-relaxed text-zinc-300">{children}</p>,
        ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-0.5 text-zinc-300 pl-2">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-0.5 text-zinc-300 pl-2">{children}</ol>,
        li: ({ children }) => <li className="text-zinc-300">{children}</li>,
        strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
        em:     ({ children }) => <em className="italic text-zinc-300">{children}</em>,
        a:      ({ href, children }) => (
          <a href={href} target="_blank" rel="noreferrer" className="text-sky-400 hover:text-sky-300 underline underline-offset-2 transition">
            {children}
          </a>
        ),
        code: ({ inline, children }) =>
          inline ? (
            <code className="bg-zinc-800 text-sky-300 text-[13px] px-1.5 py-0.5 rounded font-mono">{children}</code>
          ) : (
            <code className="block bg-zinc-800 text-green-300 text-[13px] p-3 rounded-lg font-mono whitespace-pre-wrap overflow-x-auto my-2">{children}</code>
          ),
        pre: ({ children }) => <>{children}</>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-sky-600 pl-4 my-2 text-zinc-400 italic">{children}</blockquote>
        ),
        hr: () => <hr className="border-zinc-700 my-3" />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

export default MarkdownEditor;
