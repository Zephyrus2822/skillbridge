"use client";

import { useMemo } from "react";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeReact from "rehype-react";
import { ReactNode } from "react";
// 👇 these come from the JSX runtime
import { jsx, jsxs, Fragment } from "react/jsx-runtime";

interface UseMarkdownProcessorResult {
  renderMarkdown: (markdown: string) => ReactNode;
}

interface MarkdownLinkProps {
  href?: string;
  children?: ReactNode;
}

export function useMarkdownProcessor(): UseMarkdownProcessorResult {
  const processor = useMemo(
    () =>
      unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkRehype)
        .use(rehypeReact, {
          jsx,   // ✅ required in Next.js 15 production
          jsxs,  // ✅ also required for multiple children
          Fragment,
          components: {
            a: ({ href, children }: MarkdownLinkProps) =>
              typeof href === "string" ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-700 underline"
                >
                  {children}
                </a>
              ) : (
                <a>{children}</a>
              ),
          },
        }),
    []
  );

  const renderMarkdown = (markdown: string): ReactNode =>
    processor.processSync(markdown).result as ReactNode;

  return { renderMarkdown };
}
