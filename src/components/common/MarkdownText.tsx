import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

interface IProps {
    content: string;
    className?: string;
    allowHtml?: boolean;
}

export default function MarkdownText({ content, className, allowHtml = false }: IProps) {
    return (
        <div className={`markdown-content ${className || ""}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={allowHtml ? [rehypeRaw] : []}
                components={{
                    a: ({ ...props }) => (
                        <a
                            {...props}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="markdown-link"
                        />
                    ),
                }}>
                {content}
            </ReactMarkdown>
        </div>
    );
}
