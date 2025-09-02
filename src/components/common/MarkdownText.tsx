import { Anchor, ScrollArea, Table } from "@mantine/core";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";

interface IProps {
    content: string;
    className?: string;
    allowHtml?: boolean;
}

/**
 * Plugins: https://github.com/remarkjs/remark/blob/main/doc/plugins.md#list-of-plugins
 */

export default function MarkdownText({ content, className, allowHtml = false }: IProps) {
    return (
        <div className={`markdown-content ${className || ""}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={allowHtml ? [rehypeRaw, rehypeSlug] : [rehypeSlug]}
                components={{
                    a: ({ href, children }) => (
                        <Anchor href={href} target="_blank" rel="noopener noreferrer" className="markdown-link">
                            {children}
                        </Anchor>
                    ),
                    table: ({ children }) => (
                        <ScrollArea>
                            <Table w="fit-content">{children}</Table>
                        </ScrollArea>
                    ),
                }}>
                {content}
            </ReactMarkdown>
        </div>
    );
}
