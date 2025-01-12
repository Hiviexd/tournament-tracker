import { useState } from "react";
import { Card, Stack, Textarea } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import MarkdownText from "../components/common/MarkdownText";

export default function MarkdownPage() {
    const initialText = `# Main Title

## Features
Here's what this Markdown can do:

### Text Formatting
- **Bold text**
- *Italic text*
- ~~Strikethrough~~
- **_Bold and italic_**

### Lists
1. Ordered list
2. With multiple items
   - Nested unordered
   - With another item
     1. Deep nested ordered
     2. Second item

### Links and Images
This is an [external Link](https://github.com). It can also [support **formatting** within it](https://github.com)!

Below is a random image.

![Image Alt Text](https://picsum.photos/200/100)

### Code
Inline \`code\` example

\`\`\`
// Code block
interface User {
    name: string;
    age: number;
}

const user: User = {
    name: "Albion",
    age: 64
};
\`\`\`

### Tables
| Feature | Support | Notes |
|:--|:--|:--|
| Table | ✅ | Via remark-gfm |
| Lists | ✅ | Built-in |
| Code | ✅ | Built-in |

### Blockquotes
> This is a blockquote
> - With a list inside
> - And multiple lines

### Task Lists
- [x] Completed task
- [ ] Pending task
- [ ] Another task
`;

    const [text, setText] = useState(initialText);
    const [debouncedText] = useDebouncedValue(text, 300);

    return (
        <Stack gap="lg">
            <Card shadow="sm" p="lg" bg="primary.11">
                <MarkdownText
                    content="This website supports [Markdown](https://www.markdownguide.org/basic-syntax/) formatting. Here's a playground to test out all available features:"
                />
                <Textarea
                    value={text}
                    onChange={(e) => setText(e.currentTarget.value)}
                    placeholder="Enter markdown text..."
                    minRows={4}
                    maxRows={12}
                    autosize
                    mt="sm"
                />
            </Card>

            <Card shadow="sm" p="lg" bg="primary.11">
                <MarkdownText content={debouncedText} />
            </Card>
        </Stack>
    );
}
