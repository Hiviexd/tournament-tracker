import { Anchor, ScrollArea, Table, Text, type MantineSize } from "@mantine/core";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import rehypeSlug from "rehype-slug";
import utils from "@tc/utils/client";
import CodeBlock from "./CodeBlock";
// import { visit } from "unist-util-visit";

interface IProps {
    content: string;
    className?: string;
    allowHtml?: boolean;
    size?: MantineSize;
}

// ? Plugins: https://github.com/remarkjs/remark/blob/main/doc/plugins.md#list-of-plugins

// Custom plugin to disable setext headings (--- immediately after text)
// TODO: move this to a separate file
// ! FIXME: current implementation breaks all `h2` headings — disabled for now
/*
function remarkDisableSetextHeadings() {
    return (tree: any) => {
        visit(tree, "heading", (node: any, index: number | undefined, parent: any) => {
            // Convert setext headings (h2) to paragraph + horizontal rule
            if (node.depth === 2) {
                // Convert heading to paragraph followed by horizontal rule
                if (index !== undefined && parent) {
                    parent.children[index] = {
                        type: "paragraph",
                        children: node.children,
                    };
                    // Insert horizontal rule after the paragraph
                    parent.children.splice(index + 1, 0, {
                        type: "thematicBreak",
                    });
                }
            }
        });
    };
}
*/

function proxyImageUrl(src: string | undefined): string | undefined {
    if (!src || !utils.isValidUrl(src)) return undefined;
    return `https://wsrv.nl/?url=${encodeURIComponent(src.trim())}`;
}

export default function MarkdownText({ content, className, allowHtml = false, size }: IProps) {
    return (
        <div className={`markdown-content ${className || ""}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkBreaks]}
                rehypePlugins={allowHtml ? [rehypeRaw, rehypeSanitize, rehypeSlug] : [rehypeSlug]}
                components={{
                    p: ({ children }) => (
                        <Text size={size} component="p">
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
                    img: ({ src, alt }) => (
                        <img src={proxyImageUrl(src)} alt={alt ?? ""} loading="lazy" referrerPolicy="no-referrer" />
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
                    pre: (props) => {
                        const codeBlockProps = { ...props };
                        delete (codeBlockProps as { node?: unknown }).node;
                        return <CodeBlock {...codeBlockProps}>{props.children}</CodeBlock>;
                    },
                }}>
                {content}
            </ReactMarkdown>
        </div>
    );
}
