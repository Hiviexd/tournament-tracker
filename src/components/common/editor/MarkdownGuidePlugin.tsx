import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const MarkdownGuidePlugin = () => {
    return (
        <a className="button button-type-markdown-guide" title="Markdown Guide" href="/markdown" target="_blank" rel="noopener noreferrer">
            <FontAwesomeIcon icon={["fab", "markdown"]} />
        </a>
    );
};

MarkdownGuidePlugin.align = "right";
MarkdownGuidePlugin.pluginName = "markdown-guide";

export default MarkdownGuidePlugin;

// ? Initially thought about just having this in the TextEditor component,
// ? but it caused the button to duplicate with every new instance of the editor.
