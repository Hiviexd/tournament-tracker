import { Children, isValidElement, type HTMLAttributes, type ReactNode } from "react";
import CopyActionIcon from "./buttons/CopyActionIcon";

interface IProps extends HTMLAttributes<HTMLPreElement> {
    children: ReactNode;
}

function extractTextContent(node: ReactNode): string {
    if (node == null || typeof node === "boolean") return "";

    if (typeof node === "string" || typeof node === "number") {
        return String(node);
    }

    if (Array.isArray(node)) {
        return node.map(extractTextContent).join("");
    }

    if (isValidElement<{ children?: ReactNode }>(node)) {
        return extractTextContent(node.props.children);
    }

    return "";
}

export default function CodeBlock({ children, className, ...props }: IProps) {
    const code = extractTextContent(children).trimEnd();

    return (
        <pre className={`code-block ${className || ""}`.trim()} {...props}>
            <span className="code-block-copy">
                <CopyActionIcon value={code} color="primary" variant="light" />
            </span>

            {Children.toArray(children)}
        </pre>
    );
}
