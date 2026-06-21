'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { Bold, Italic, List, ListOrdered, Link as LinkIcon } from 'lucide-react';

interface EmailEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null;
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL', previousUrl)

    if (url === null) {
      return
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 rounded-t-md">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800 ${editor.isActive('bold') ? 'bg-gray-200 dark:bg-gray-800' : ''}`}
        type="button"
      >
        <Bold className="h-4 w-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={`p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800 ${editor.isActive('italic') ? 'bg-gray-200 dark:bg-gray-800' : ''}`}
        type="button"
      >
        <Italic className="h-4 w-4" />
      </button>
      <div className="w-[1px] h-6 bg-gray-300 dark:bg-gray-700 mx-1" />
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800 ${editor.isActive('bulletList') ? 'bg-gray-200 dark:bg-gray-800' : ''}`}
        type="button"
      >
        <List className="h-4 w-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800 ${editor.isActive('orderedList') ? 'bg-gray-200 dark:bg-gray-800' : ''}`}
        type="button"
      >
        <ListOrdered className="h-4 w-4" />
      </button>
      <div className="w-[1px] h-6 bg-gray-300 dark:bg-gray-700 mx-1" />
      <button
        onClick={setLink}
        className={`p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800 ${editor.isActive('link') ? 'bg-gray-200 dark:bg-gray-800' : ''}`}
        type="button"
      >
        <LinkIcon className="h-4 w-4" />
      </button>
    </div>
  );
};

export function EmailEditor({ value, onChange }: EmailEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert prose-sm sm:prose-base focus:outline-none min-h-[300px] max-w-none p-4',
      },
    },
  });

  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-md overflow-hidden bg-white dark:bg-black">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
