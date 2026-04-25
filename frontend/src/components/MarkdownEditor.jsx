import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * MarkdownEditor — Write/Preview tab editor.
 * Props: value, onChange, placeholder, minHeight
 */
const MarkdownEditor = ({ value, onChange, placeholder = "Write a description…", minHeight = "160px" }) => {
  const [tab, setTab] = useState("write");

  return (
    <div
      className="rounded-[var(--radius-md)] overflow-hidden transition-all duration-[var(--ease-base)]"
      style={{ border: '1px solid var(--border)', background: 'var(--surface-overlay)' }}
    >
      {/* Tab Bar */}
      <div className="flex items-center px-2 pt-2 gap-1" style={{ borderBottom: '1px solid var(--border)' }}>
        {['write', 'preview'].map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className="px-3 py-1.5 text-xs font-semibold capitalize rounded-t-[var(--radius-sm)] transition-colors duration-[var(--ease-base)]"
            style={{
              color: tab === t ? 'var(--text-primary)' : 'var(--text-muted)',
              background: tab === t ? 'var(--surface-raised)' : 'transparent',
            }}
          >
            {t}
          </button>
        ))}
        <span className="ml-auto text-[10px] pr-2 tracking-wide" style={{ color: 'var(--text-muted)' }}>
          Markdown
        </span>
      </div>

      {/* Write Pane */}
      {tab === "write" && (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          spellCheck={false}
          style={{ minHeight, color: 'var(--text-primary)', background: 'transparent' }}
          className="w-full text-sm p-4 outline-none resize-y font-mono leading-relaxed placeholder-[var(--text-muted)]"
        />
      )}

      {/* Preview Pane */}
      {tab === "preview" && (
        <div className="p-4" style={{ minHeight }}>
          {value?.trim() ? (
            <MarkdownContent content={value} />
          ) : (
            <p className="text-sm italic" style={{ color: 'var(--text-muted)' }}>Nothing to preview.</p>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * MarkdownContent — stateless markdown renderer with design-system typography.
 * Exported separately so it can be used in view mode.
 */
export const MarkdownContent = ({ content }) => {
  if (!content) return null;
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => <h1 className="text-xl font-bold mb-3 mt-4 pb-2" style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' }}>{children}</h1>,
        h2: ({ children }) => <h2 className="text-base font-bold mb-2 mt-4" style={{ color: 'var(--text-primary)' }}>{children}</h2>,
        h3: ({ children }) => <h3 className="text-sm font-semibold mb-1.5 mt-3" style={{ color: 'var(--text-primary)' }}>{children}</h3>,
        p:  ({ children }) => <p className="text-sm mb-3 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{children}</p>,
        ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1 pl-2 text-sm" style={{ color: 'var(--text-secondary)' }}>{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1 pl-2 text-sm" style={{ color: 'var(--text-secondary)' }}>{children}</ol>,
        li: ({ children }) => <li className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{children}</li>,
        strong: ({ children }) => <strong className="font-semibold" style={{ color: 'var(--text-primary)' }}>{children}</strong>,
        em: ({ children }) => <em className="italic" style={{ color: 'var(--text-secondary)' }}>{children}</em>,
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noreferrer" className="underline underline-offset-2 transition-colors" style={{ color: 'var(--accent-text)' }}>
            {children}
          </a>
        ),
        code: ({ inline, children }) =>
          inline ? (
            <code className="text-[12px] px-1.5 py-0.5 rounded-[var(--radius-xs)] font-mono" style={{ background: 'var(--surface-subtle)', color: 'var(--info)' }}>{children}</code>
          ) : (
            <code className="block text-[12px] p-4 rounded-[var(--radius-md)] font-mono whitespace-pre-wrap overflow-x-auto my-3 leading-relaxed" style={{ background: 'var(--surface-subtle)', color: 'var(--success)' }}>{children}</code>
          ),
        pre: ({ children }) => <>{children}</>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 pl-4 my-3 italic text-sm" style={{ borderColor: 'var(--accent)', color: 'var(--text-muted)' }}>{children}</blockquote>
        ),
        hr: () => <hr className="my-4" style={{ borderColor: 'var(--border)' }} />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

export default MarkdownEditor;
