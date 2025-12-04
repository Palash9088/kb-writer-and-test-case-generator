import React from 'react';
import ReactMarkdown from 'react-markdown';

interface Props {
    content: string;
}

const MarkdownViewer: React.FC<Props> = ({ content }) => {
    return (
        <div className="prose prose-slate max-w-none p-6 bg-white rounded-xl shadow-sm border border-slate-200">
            <ReactMarkdown
                components={{
                    h1: ({node, ...props}) => <h1 className="text-3xl font-bold text-slate-900 mb-6 pb-2 border-b border-slate-100" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-4" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-lg font-medium text-slate-800 mt-6 mb-3" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc list-outside ml-6 mb-4 text-slate-600" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal list-outside ml-6 mb-4 text-slate-600" {...props} />,
                    p: ({node, ...props}) => <p className="mb-4 text-slate-600 leading-relaxed" {...props} />,
                    li: ({node, ...props}) => <li className="mb-1" {...props} />,
                    strong: ({node, ...props}) => <strong className="font-semibold text-slate-800" {...props} />,
                    code: ({node, ...props}) => <code className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded text-sm font-mono" {...props} />,
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
};

export default MarkdownViewer;
