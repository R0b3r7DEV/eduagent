import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { cn } from "@/lib/utils";

interface Props {
  content: string;
  className?: string;
}

export default function MarkdownContent({ content, className }: Props) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight]}
      className={cn("prose prose-sm prose-invert max-w-none", className)}
      components={{
        p:    ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
        ul:   ({ children }) => <ul className="mb-2 ml-4 list-disc space-y-1">{children}</ul>,
        ol:   ({ children }) => <ol className="mb-2 ml-4 list-decimal space-y-1">{children}</ol>,
        li:   ({ children }) => <li className="text-text-primary">{children}</li>,
        h1:   ({ children }) => <h1 className="mb-2 mt-3 text-lg font-bold text-text-primary">{children}</h1>,
        h2:   ({ children }) => <h2 className="mb-2 mt-3 text-base font-semibold text-text-primary">{children}</h2>,
        h3:   ({ children }) => <h3 className="mb-1 mt-2 text-sm font-semibold text-text-primary">{children}</h3>,
        strong: ({ children }) => <strong className="font-semibold text-text-primary">{children}</strong>,
        em:   ({ children }) => <em className="italic text-text-secondary">{children}</em>,
        code: ({ children, className: cls }) => {
          const isBlock = cls?.includes("language-");
          if (isBlock) return (
            <code className={cn("block text-[13px] font-mono", cls)}>{children}</code>
          );
          return (
            <code className="rounded bg-surface-3 px-1.5 py-0.5 text-[12px] font-mono text-violet-300">
              {children}
            </code>
          );
        },
        pre: ({ children }) => (
          <pre className="mb-3 overflow-x-auto rounded-[--radius-md] border border-border bg-surface-2 p-4 text-[13px]">
            {children}
          </pre>
        ),
        blockquote: ({ children }) => (
          <blockquote className="mb-2 border-l-2 border-violet-600 pl-4 text-text-secondary italic">
            {children}
          </blockquote>
        ),
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer"
            className="text-violet-400 underline underline-offset-2 hover:text-violet-300">
            {children}
          </a>
        ),
        table: ({ children }) => (
          <div className="mb-3 overflow-x-auto">
            <table className="w-full border-collapse text-sm">{children}</table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border border-border bg-surface-2 px-3 py-1.5 text-left text-xs font-semibold text-text-secondary">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border border-border px-3 py-1.5 text-text-primary">{children}</td>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
