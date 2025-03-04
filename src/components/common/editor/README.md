# Text Editor Components

This directory contains the components for the text editor that provide a rich text editor with markdown support and optional autosave functionality.

## Component Structure

The editor has been organized into three simple components:

- **MarkdownEditor**: The markdown editor with its toolbar
- **RichTextEditor**: The rich text editor with its toolbar
- **SaveIndicator**: Shows a "Saved" indicator when content is saved

## Usage

The main `TextEditor` component in the parent directory contains the core logic and uses these components to render the appropriate editor based on the current mode.

```tsx
import { TextEditor } from '../components/common';

function MyComponent() {
  const [content, setContent] = useState('<p>Hello world</p>');

  return (
    <TextEditor
      value={content}
      onChange={setContent}
      autoSaveKey="my-unique-key" // Optional: Enable autosave
      placeholder="Enter your text here..." // Optional
      minHeight={300} // Optional
      maxHeight={600} // Optional
    />
  );
}
```

## Features

- **Rich Text Editing**: Full-featured rich text editor with formatting controls
- **Markdown Support**: Toggle between rich text and markdown modes
- **Table Support**: Create and edit tables with markdown support
- **Autosave**: Optional autosave to localStorage with visual feedback
- **Customizable**: Configurable height, placeholder, and more

## Dependencies

- @mantine/core and @mantine/tiptap for UI components
- TipTap for the rich text editor functionality
- TipTap table extensions for table support
- FontAwesome for icons
