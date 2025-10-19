import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { linkifyReact } from '../utils/linkify';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  isPreview?: boolean;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ 
  content, 
  className = "",
  isPreview = false 
}) => {
  if (!content) return null;

  // For preview mode, limit content length
  const displayContent = isPreview && content.length > 300 
    ? content.substring(0, 300) + '...'
    : content;

  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headings
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold text-emerald-400 mb-4 mt-6 first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-bold text-emerald-400 mb-3 mt-5 first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold text-emerald-400 mb-2 mt-4 first:mt-0">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-base font-semibold text-emerald-400 mb-2 mt-3 first:mt-0">
              {children}
            </h4>
          ),
          
          // Paragraphs
          p: ({ children }) => (
            <p className="text-gray-100 mb-4 last:mb-0 leading-relaxed">
              {children}
            </p>
          ),
          
          // Emphasis
          strong: ({ children }) => (
            <strong className="font-bold text-gray-50">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-gray-200">
              {children}
            </em>
          ),
          
          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-emerald-500 pl-6 pr-4 py-5 my-6 bg-gray-800/70 rounded-lg text-gray-100 leading-relaxed space-y-3 shadow-lg">
              <div>
                {children}
              </div>
            </blockquote>
          ),
          
          // Lists
          ul: ({ children }) => (
            <ul className="list-disc list-inside mb-4 space-y-1 text-gray-100">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside mb-4 space-y-1 text-gray-100">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-gray-100">
              {children}
            </li>
          ),
          
          // Links - integrate with existing linkify logic
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300 underline transition-colors"
            >
              {children}
            </a>
          ),
          
          // Code
          code: ({ children, className }) => {
            const isInline = !className;
            
            if (isInline) {
              return (
                <code className="bg-gray-800 text-emerald-400 px-1 py-0.5 rounded text-sm font-mono">
                  {children}
                </code>
              );
            }
            
            return (
              <pre className="bg-gray-800 rounded-lg p-4 overflow-x-auto mb-4">
                <code className="text-emerald-400 text-sm font-mono">
                  {children}
                </code>
              </pre>
            );
          },
          
          // Horizontal rule
          hr: () => (
            <hr className="border-gray-700 my-6" />
          ),
          
          // Tables (from remark-gfm)
          table: ({ children }) => (
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full border border-gray-700 rounded-lg">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-gray-800">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="bg-gray-900">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="border-b border-gray-700">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="px-4 py-2 text-left text-emerald-400 font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-2 text-gray-100">
              {children}
            </td>
          ),
        }}
      >
        {displayContent}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;