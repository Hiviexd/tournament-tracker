import { Anchor, ScrollArea, Table, Text, type MantineSize } from "@mantine/core";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";

interface IProps {
    content: string;
    className?: string;
    allowHtml?: boolean;
    size?: MantineSize;
}

/**
 * Plugins: https://github.com/remarkjs/remark/blob/main/doc/plugins.md#list-of-plugins
 */

export default function MarkdownText({ content, className, allowHtml = false, size }: IProps) {
    return (
        <div className={`markdown-content ${className || ""}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={allowHtml ? [rehypeRaw, rehypeSlug] : [rehypeSlug]}
                components={{
                    p: ({ children }) => (
                        <Text size={size} component="p" style={{ margin: 0 }}>
                            {children}
                        </Text>
                    ),
                    a: ({ href, children }) => (
                        <Anchor
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="markdown-link"
                            size={size}>
                            {children}
                        </Anchor>
                    ),
                    table: ({ children }) => (
                        <ScrollArea>
                            <Table w="fit-content">{children}</Table>
                        </ScrollArea>
                    ),
                    li: ({ children }) => (
                        <Text size={size} component="li" style={{ margin: 0 }}>
                            {children}
                        </Text>
                    ),
                }}>
                {content}
            </ReactMarkdown>
        </div>
    );
}
