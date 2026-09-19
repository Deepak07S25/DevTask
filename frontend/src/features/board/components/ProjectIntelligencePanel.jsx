import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Sparkles, Send, Loader2, AlertTriangle, RotateCcw, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { agentApi } from '../../../api/agentApi';
import { IconButton } from '../../../design-system/IconButton';
import { Button } from '../../../design-system/Button';
import { cn } from '../../../design-system/utils';

/* ── Context-aware initial suggestions ────────────────────────────── */
const INITIAL_SUGGESTIONS = {
  project: [
    'Summarize project status',
    'Identify blocked or high-risk tasks',
    'Show team workload distribution',
  ],
  sprint: [
    'Analyze sprint feasibility',
    'Find unassigned or unestimated tasks',
    'Identify delivery risks',
  ],
  task: [
    'What could block or delay this task?',
    'Suggest subtasks or implementation steps',
    'Review acceptance criteria & edge cases',
  ],
};

/* ── Lightweight follow-up continuation prompts (max 1–2) ─────────── */
const FOLLOWUP_PROMPTS = {
  project: [
    'Which tasks are at risk?',
    'What should we focus on next?',
  ],
  sprint: [
    'Which sprint tasks have risks?',
    'Check estimation coverage',
  ],
  task: [
    'What are the edge cases?',
    'Suggest test scenarios',
  ],
};

/* ── Safe error message mapper ──────────────────────────────────────── */
const toUserMessage = (err) => {
  const status = err?.response?.status;
  if (status === 400 || status === 422) return 'Invalid request. Please try a different question.';
  if (status === 401) return 'Please sign in again.';
  return 'Unable to analyze right now. Please try again.';
};

/* ── Object-Aware Link Resolver ──────────────────────────────────────── */
/**
 * Resolves task references (e.g. #102 or ALPHA-14) against authorized frontend tasks.
 * Unresolved references remain plain text strings (zero hallucinated links).
 */
const renderTextWithTaskLinks = (text, tasks = [], onTaskClick) => {
  if (typeof text !== 'string' || !tasks || tasks.length === 0) {
    return text;
  }

  const pattern = /(#\d+|[A-Z]{2,10}-\d+)/g;
  const parts = text.split(pattern);

  if (parts.length === 1) {
    return text;
  }

  return parts.map((part, i) => {
    if (!part) return null;
    const isMatch = pattern.test(part);
    pattern.lastIndex = 0;

    if (isMatch) {
      const numMatch = part.match(/\d+/);
      const num = numMatch ? parseInt(numMatch[0], 10) : null;

      const matchedTask = tasks.find((t) =>
        (num !== null && t.taskNumber === num) ||
        (t.key && t.key.toUpperCase() === part.toUpperCase()) ||
        (t.id && t.id === part)
      );

      if (matchedTask) {
        return (
          <button
            key={i}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onTaskClick?.(matchedTask);
            }}
            className="inline-flex items-center gap-1 mx-0.5 px-1.5 py-0.5 rounded-[var(--radius-xs)] font-medium text-[11px] bg-[var(--ai-accent-muted)]/60 text-[var(--ai-accent-text)] border border-[var(--ai-accent-glow)]/60 hover:bg-[var(--ai-accent-muted)] hover:border-[var(--ai-accent-glow)] transition-colors cursor-pointer align-baseline"
            title={`Open task: ${matchedTask.title || 'Task details'}`}
          >
            <span className="font-semibold">{part}</span>
            {matchedTask.title && (
              <span className="opacity-80 truncate max-w-[130px]">
                {matchedTask.title}
              </span>
            )}
          </button>
        );
      }
    }

    return part;
  });
};

const enhanceChildren = (children, tasks, onTaskClick) => {
  if (!children) return children;
  if (typeof children === 'string') {
    return renderTextWithTaskLinks(children, tasks, onTaskClick);
  }
  if (Array.isArray(children)) {
    return children.map((c, idx) => {
      if (typeof c === 'string') {
        return <span key={idx}>{renderTextWithTaskLinks(c, tasks, onTaskClick)}</span>;
      }
      return c;
    });
  }
  return children;
};

/* ── ProjectIntelligencePanel Component ──────────────────────────────── */
/**
 * Contextual AI intelligence panel for Project, Sprint, and Task scopes.
 */
const ProjectIntelligencePanel = ({
  isOpen,
  onClose,
  projectId,
  projectName = 'DevTask',
  context = { type: 'project' },
  onSwitchContext,
  isTaskModalOpen = false,
  tasks = [],
  onTaskClick,
}) => {
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [turns, setTurns]       = useState([]); // Array<{ id, question, answer, contextType }>
  const [error, setError]       = useState(null);
  const [expandedTurns, setExpandedTurns] = useState({});

  const inputRef      = useRef(null);
  const scrollAreaRef = useRef(null);
  const initialQueryRanRef = useRef(false);

  const isTaskContext   = context?.type === 'task' && context?.task;
  const isSprintContext = context?.type === 'sprint' && context?.sprint;

  const currentScopeKey = isTaskContext ? 'task' : isSprintContext ? 'sprint' : 'project';
  const initialSuggestions = INITIAL_SUGGESTIONS[currentScopeKey] || INITIAL_SUGGESTIONS.project;
  const followups = FOLLOWUP_PROMPTS[currentScopeKey] || FOLLOWUP_PROMPTS.project;

  /* Focus input when panel opens */
  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  /* Escape key closes panel */
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  /* Scroll to bottom when new response arrives */
  useEffect(() => {
    if (turns.length > 0) {
      scrollAreaRef.current?.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [turns, loading]);

  const canSubmit = input.trim().length > 0 && !loading;

  const submit = useCallback(async (questionText) => {
    const rawQuestion = (typeof questionText === 'string' ? questionText : input).trim();
    if (!rawQuestion || loading) return;

    setLoading(true);
    setError(null);

    try {
      const data = await agentApi.runAgent(projectId, rawQuestion, context);
      const answer = data?.data?.message;

      if (!answer) {
        setError('No response returned. Please try again.');
      } else {
        const newTurn = {
          id: Date.now().toString(),
          question: rawQuestion,
          answer,
          contextType: context?.type || 'project',
          taskTitle: isTaskContext ? context.task.title : null,
          sprintName: isSprintContext ? context.sprint.name : null,
        };
        setTurns((prev) => [...prev, newTurn]);
      }
    } catch (err) {
      setError(toUserMessage(err));
    } finally {
      setLoading(false);
      setInput('');
    }
  }, [projectId, loading, input, context, isTaskContext, isSprintContext]);

  /* Trigger initialQuery if provided in context (e.g. Blocker Diagnostic) */
  useEffect(() => {
    if (isOpen && context?.initialQuery && !initialQueryRanRef.current) {
      initialQueryRanRef.current = true;
      submit(context.initialQuery);
    }
    if (!isOpen) {
      initialQueryRanRef.current = false;
    }
  }, [isOpen, context?.initialQuery, submit]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const handleSuggestion = (text) => {
    setInput(text);
    submit(text);
  };

  const handleRetry = () => {
    if (turns.length > 0) {
      const last = turns[turns.length - 1];
      submit(last.question);
    } else {
      setError(null);
    }
  };

  const toggleTurnExpand = (id) => {
    setExpandedTurns((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (!isOpen) return null;

  const previousTurns = turns.slice(0, -1);
  const latestTurn = turns.length > 0 ? turns[turns.length - 1] : null;

  // Header Titles
  const headerSubtitle = isTaskContext
    ? '✦ Task Intelligence'
    : isSprintContext
    ? '✦ Sprint Intelligence'
    : '✦ Project Intelligence';

  const headerTitle = isTaskContext
    ? (context.task.title || 'Task Details')
    : isSprintContext
    ? (context.sprint.name || 'Sprint Details')
    : (projectName || 'DevTask');

  return (
    <div
      className={cn(
        'fixed inset-0 z-[120] flex justify-end',
        isTaskModalOpen ? 'pointer-events-none' : 'pointer-events-auto'
      )}
      aria-hidden={!isOpen}
    >
      {/* Backdrop (subtle & clickable to close) */}
      <div
        className={cn(
          'flex-1 transition-opacity',
          isTaskModalOpen
            ? 'hidden md:block bg-black/10 pointer-events-auto'
            : 'bg-black/40 backdrop-blur-sm pointer-events-auto'
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-label="Intelligence Panel"
        aria-modal="true"
        className={cn(
          'w-full sm:w-[420px] bg-[var(--surface-raised)] border-l border-[var(--border)] h-full flex flex-col shadow-2xl pointer-events-auto',
          'transition-transform duration-200 ease-out'
        )}
      >
        {/* ── Minimal Context Header ───────────────────────────────── */}
        <div
          className="flex items-center justify-between px-5 py-3.5 shrink-0 bg-[var(--surface-raised)]"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Mobile back button */}
            <div className="sm:hidden">
              <IconButton
                icon={<ArrowLeft size={16} />}
                label={isTaskModalOpen ? 'Back to task' : 'Close'}
                variant="ghost"
                size="sm"
                onClick={onClose}
              />
            </div>

            <div
              className="w-6 h-6 rounded-[var(--radius-sm)] flex items-center justify-center shrink-0"
              style={{
                background: 'var(--ai-accent-muted)',
                border: '1px solid var(--ai-accent-glow)',
              }}
            >
              <Sparkles
                size={13}
                style={{ color: 'var(--ai-accent-text)' }}
                aria-hidden="true"
              />
            </div>

            <div className="min-w-0">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-[var(--ai-accent-text)] leading-none">
                {headerSubtitle}
              </h2>
              <p className="text-xs font-semibold truncate mt-0.5" style={{ color: 'var(--text-primary)' }}>
                {headerTitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {(isTaskContext || isSprintContext) && onSwitchContext && (
              <button
                type="button"
                onClick={() => onSwitchContext({ type: 'project' })}
                title="Switch to Project Intelligence"
                className="text-[11px] font-medium px-2 py-0.5 rounded-[var(--radius-sm)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-overlay)] transition-colors border border-transparent hover:border-[var(--border)]"
              >
                Project scope
              </button>
            )}
            <IconButton
              icon={<X size={15} />}
              label="Close panel"
              variant="ghost"
              size="sm"
              onClick={onClose}
            />
          </div>
        </div>

        {/* ── Body: Restrained Multi-Turn Feed ──────────────────────── */}
        <div
          ref={scrollAreaRef}
          className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4"
          aria-live="polite"
          aria-busy={loading}
        >
          {/* Empty / Initial State */}
          {turns.length === 0 && !loading && !error && (
            <div className="flex flex-col items-center justify-center text-center gap-3 my-auto py-8">
              <div
                className="w-11 h-11 rounded-[var(--radius-xl)] flex items-center justify-center"
                style={{
                  background: 'var(--ai-accent-muted)',
                  border: '1px solid var(--ai-accent-glow)',
                }}
              >
                <Sparkles size={20} style={{ color: 'var(--ai-accent-text)' }} />
              </div>
              <div className="space-y-1 max-w-[280px]">
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {isTaskContext ? 'Task Intelligence' : isSprintContext ? 'Sprint Intelligence' : 'Project Intelligence'}
                </p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  {isTaskContext
                    ? 'Ask about risks, implementation steps, or edge cases for this task.'
                    : isSprintContext
                    ? 'Ask about sprint feasibility, delivery risks, or estimation gaps.'
                    : 'Ask about blockers, project risks, or team workload distribution.'}
                </p>
              </div>

              {/* Initial Suggestions */}
              <div className="mt-4 w-full flex flex-col gap-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] text-left mb-1">
                  Suggested Queries
                </p>
                {initialSuggestions.map((text) => (
                  <button
                    key={text}
                    disabled={loading}
                    onClick={() => handleSuggestion(text)}
                    className={cn(
                      'text-left text-xs px-3 py-2 rounded-[var(--radius-md)] border transition-all duration-[var(--ease-base)]',
                      'bg-[var(--surface-overlay)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--ai-accent-glow)] hover:bg-[var(--ai-accent-muted)]/20',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ai-accent)]'
                    )}
                  >
                    <span className="text-[var(--ai-accent-text)] mr-1.5">✦</span>
                    {text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 1. Restrained Previous Turns (Compact & Collapsible) */}
          {previousTurns.length > 0 && (
            <div className="space-y-2 border-b border-[var(--border)] pb-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Previous Questions
              </p>
              {previousTurns.map((turn) => {
                const isExpanded = !!expandedTurns[turn.id];
                return (
                  <div
                    key={turn.id}
                    className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-overlay)]/40 p-2.5 text-xs transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => toggleTurnExpand(turn.id)}
                      className="w-full flex items-center justify-between text-left gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    >
                      <span className="font-medium truncate flex-1">
                        <span className="text-[var(--ai-accent-text)] mr-1 font-semibold">Q:</span>
                        {turn.question}
                      </span>
                      {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>

                    {isExpanded && (
                      <div className="mt-2.5 pt-2.5 border-t border-[var(--border)] text-[var(--text-secondary)] prose-ai">
                        <AIMarkdown tasks={tasks} onTaskClick={onTaskClick}>{turn.answer}</AIMarkdown>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* 2. Latest Turn (Visually Dominant Centerpiece) */}
          {latestTurn && (
            <div className="flex flex-col gap-3.5">
              {/* Clean User Query */}
              <div className="flex justify-end">
                <div
                  className="max-w-[85%] rounded-[var(--radius-lg)] rounded-tr-[var(--radius-xs)] px-3.5 py-2 text-xs font-medium leading-relaxed"
                  style={{
                    background: 'var(--ai-accent-muted)',
                    border: '1px solid var(--ai-accent-glow)',
                    color: 'var(--ai-accent-text)',
                  }}
                >
                  {latestTurn.question}
                </div>
              </div>

              {/* Dominant AI Response */}
              <div className="flex gap-3 items-start">
                <div
                  className="w-5 h-5 rounded-full shrink-0 mt-0.5 flex items-center justify-center"
                  style={{
                    background: 'var(--ai-accent-muted)',
                    border: '1px solid var(--ai-accent-glow)',
                  }}
                >
                  <Sparkles size={11} style={{ color: 'var(--ai-accent-text)' }} />
                </div>
                <div
                  className="flex-1 text-xs sm:text-sm leading-relaxed prose-ai min-w-0"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <AIMarkdown tasks={tasks} onTaskClick={onTaskClick}>{latestTurn.answer}</AIMarkdown>
                </div>
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="flex items-center gap-2.5 py-4 px-2">
              <Loader2
                size={14}
                className="animate-spin shrink-0"
                style={{ color: 'var(--ai-accent-text)' }}
              />
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {isTaskContext
                  ? 'Analyzing task context…'
                  : isSprintContext
                  ? 'Analyzing sprint context…'
                  : 'Analyzing project…'}
              </span>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div
              role="alert"
              className="my-2 rounded-[var(--radius-lg)] p-3.5 flex flex-col gap-2.5"
              style={{
                background: 'var(--danger-bg)',
                border: '1px solid var(--danger-border)',
              }}
            >
              <div className="flex items-start gap-2">
                <AlertTriangle
                  size={14}
                  className="shrink-0 mt-0.5"
                  style={{ color: 'var(--danger)' }}
                />
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                  {error}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                icon={<RotateCcw size={12} />}
                onClick={handleRetry}
                className="self-start text-xs py-1 h-auto"
              >
                Try again
              </Button>
            </div>
          )}
        </div>

        {/* ── Lightweight Follow-up Suggestions (After Response) ────── */}
        {latestTurn && !loading && (
          <div
            className="px-5 py-2.5 shrink-0 bg-[var(--surface-raised)]"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 text-[var(--text-muted)]">
              Explore further
            </p>
            <div className="flex flex-wrap gap-1.5">
              {followups.map((text) => (
                <button
                  key={text}
                  disabled={loading}
                  onClick={() => handleSuggestion(text)}
                  className={cn(
                    'text-[11px] px-2.5 py-1 rounded-[var(--radius-full)] border transition-all duration-[var(--ease-base)]',
                    'bg-[var(--surface-overlay)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--ai-accent-glow)] hover:bg-[var(--ai-accent-muted)]/30',
                    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--ai-accent)]',
                    'disabled:opacity-40 disabled:cursor-not-allowed text-left'
                  )}
                >
                  {text}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Input Bar ────────────────────────────────────────────── */}
        <div
          className="px-5 pb-4 pt-2.5 shrink-0 bg-[var(--surface-raised)]"
          style={{ borderTop: latestTurn ? 'none' : '1px solid var(--border)' }}
        >
          <div
            className="flex items-end gap-2 rounded-[var(--radius-lg)] px-3 py-2 transition-all duration-[var(--ease-base)]"
            style={{
              background: 'var(--surface-overlay)',
              border: '1px solid var(--border)',
            }}
            onFocusCapture={(e) => {
              e.currentTarget.style.borderColor = 'var(--ai-accent)';
              e.currentTarget.style.boxShadow = '0 0 0 1px var(--ai-accent-muted)';
            }}
            onBlurCapture={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <textarea
              ref={inputRef}
              id="ai-panel-input"
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              placeholder={
                isTaskContext
                  ? 'Ask about this task…'
                  : isSprintContext
                  ? 'Ask about this sprint…'
                  : 'Ask about this project…'
              }
              aria-label={
                isTaskContext
                  ? 'Ask about this task'
                  : isSprintContext
                  ? 'Ask about this sprint'
                  : 'Ask about this project'
              }
              className="flex-1 bg-transparent border-0 outline-none resize-none text-xs sm:text-sm leading-relaxed placeholder:text-[var(--text-muted)] text-[var(--text-primary)] disabled:opacity-50"
              style={{ minHeight: '20px', maxHeight: '80px' }}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 80) + 'px';
              }}
            />
            <button
              type="button"
              onClick={() => submit()}
              disabled={!canSubmit}
              aria-label="Send message"
              className={cn(
                'shrink-0 w-7 h-7 rounded-[var(--radius-md)] flex items-center justify-center',
                'transition-all duration-[var(--ease-base)]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ai-accent)]',
                'disabled:opacity-30 disabled:cursor-not-allowed'
              )}
              style={{
                background: canSubmit ? 'var(--ai-accent)' : 'var(--surface-subtle)',
                color: 'white',
              }}
            >
              {loading ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Send size={13} />
              )}
            </button>
          </div>
          <p className="mt-1.5 text-[10px] text-center" style={{ color: 'var(--text-muted)' }}>
            Enter to send · Shift+Enter for newline
          </p>
        </div>
      </div>
    </div>
  );
};

/* ── Scoped Markdown Renderer with Object-Aware Task Links ─────────────── */
const AIMarkdown = ({ children, tasks = [], onTaskClick }) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    components={{
      p: ({ children }) => (
        <p className="mb-3 last:mb-0 text-xs sm:text-sm leading-relaxed text-[var(--text-secondary)]">
          {enhanceChildren(children, tasks, onTaskClick)}
        </p>
      ),
      h1: ({ children }) => (
        <h1 className="text-sm sm:text-base font-bold mb-2 mt-4 first:mt-0 tracking-tight text-[var(--text-primary)]">
          {children}
        </h1>
      ),
      h2: ({ children }) => (
        <h2 className="text-xs sm:text-sm font-bold mb-1.5 mt-3.5 first:mt-0 text-[var(--text-primary)]">
          {children}
        </h2>
      ),
      h3: ({ children }) => (
        <h3 className="text-xs sm:text-sm font-semibold mb-1 mt-3 first:mt-0 text-[var(--text-primary)]">
          {children}
        </h3>
      ),
      ul: ({ children }) => (
        <ul className="list-disc pl-5 mb-3 space-y-1.5 text-xs sm:text-sm leading-relaxed text-[var(--text-secondary)] [&>li>ul]:mt-1.5 [&>li>ul]:mb-0 [&>li>ol]:mt-1.5 [&>li>ol]:mb-0">
          {children}
        </ul>
      ),
      ol: ({ children }) => (
        <ol className="list-decimal pl-5 mb-3 space-y-1.5 text-xs sm:text-sm leading-relaxed text-[var(--text-secondary)] [&>li>ul]:mt-1.5 [&>li>ul]:mb-0 [&>li>ol]:mt-1.5 [&>li>ol]:mb-0">
          {children}
        </ol>
      ),
      li: ({ children }) => (
        <li className="text-xs sm:text-sm leading-relaxed text-[var(--text-secondary)]">
          {enhanceChildren(children, tasks, onTaskClick)}
        </li>
      ),
      code: ({ inline, children }) =>
        inline ? (
          <code className="px-1.5 py-0.5 rounded-[var(--radius-xs)] text-[11px] font-mono bg-[var(--surface-overlay)] text-[var(--ai-accent-text)] border border-[var(--border)]">
            {children}
          </code>
        ) : (
          <pre className="p-3 rounded-[var(--radius-md)] text-[11px] font-mono overflow-x-auto my-3 bg-[var(--surface-overlay)] border border-[var(--border)] text-[var(--text-primary)]">
            <code>{children}</code>
          </pre>
        ),
      blockquote: ({ children }) => (
        <blockquote className="border-l-2 border-[var(--ai-accent)] pl-3 py-1 my-3 italic text-xs text-[var(--text-secondary)] bg-[var(--ai-accent-muted)]/20 rounded-r">
          {enhanceChildren(children, tasks, onTaskClick)}
        </blockquote>
      ),
      table: ({ children }) => (
        <div className="w-full overflow-x-auto my-3.5 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-overlay)]/40 shadow-xs">
          <table className="w-full text-left border-collapse text-xs min-w-[340px]">
            {children}
          </table>
        </div>
      ),
      thead: ({ children }) => (
        <thead className="bg-[var(--surface-raised)] border-b border-[var(--border)] text-[var(--text-primary)] font-semibold">
          {children}
        </thead>
      ),
      tbody: ({ children }) => (
        <tbody className="divide-y divide-[var(--border)] text-[var(--text-secondary)]">
          {children}
        </tbody>
      ),
      tr: ({ children }) => (
        <tr className="hover:bg-[var(--surface-overlay)]/60 transition-colors">
          {children}
        </tr>
      ),
      th: ({ children }) => (
        <th className="px-3.5 py-2 text-xs font-semibold whitespace-nowrap text-[var(--text-primary)] bg-[var(--surface-raised)]/90 border-r border-[var(--border)]/40 last:border-r-0">
          {children}
        </th>
      ),
      td: ({ children }) => (
        <td className="px-3.5 py-2 text-xs align-top whitespace-normal min-w-[100px] leading-relaxed border-r border-[var(--border)]/30 last:border-r-0">
          {enhanceChildren(children, tasks, onTaskClick)}
        </td>
      ),
      strong: ({ children }) => <strong className="font-semibold text-[var(--text-primary)]">{children}</strong>,
      em: ({ children }) => <em className="italic text-[var(--text-secondary)]">{children}</em>,
      hr: () => <hr className="my-3.5 border-t border-[var(--border)]" />,
    }}
  >
    {children}
  </ReactMarkdown>
);

export default ProjectIntelligencePanel;




