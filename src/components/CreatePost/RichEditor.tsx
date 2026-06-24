import { useRef, useEffect } from 'react'
import { Bold, Italic, Underline, List, ListOrdered, Link2, Code, Quote, Smile } from 'lucide-react'

interface RichEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function RichEditor({ value, onChange, placeholder }: RichEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)

  // Sync value from parent only if it's external (e.g. initial load or reset)
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || ''
    }
  }, [value])

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  const exec = (command: string, arg: string | undefined = undefined) => {
    document.execCommand(command, false, arg)
    editorRef.current?.focus()
    handleInput()
  }

  const handleLink = () => {
    const url = prompt('Enter link URL:')
    if (url) exec('createLink', url)
  }

  const toolbarButtons = [
    { icon: <Bold size={16} />, label: 'Bold', action: () => exec('bold') },
    { icon: <Italic size={16} />, label: 'Italic', action: () => exec('italic') },
    { icon: <Underline size={16} />, label: 'Underline', action: () => exec('underline') },
    { divider: true },
    { icon: <List size={16} />, label: 'Bullet List', action: () => exec('insertUnorderedList') },
    { icon: <ListOrdered size={16} />, label: 'Numbered List', action: () => exec('insertOrderedList') },
    { divider: true },
    { icon: <Link2 size={16} />, label: 'Link', action: handleLink },
    { icon: <Quote size={16} />, label: 'Quote', action: () => exec('formatBlock', 'BLOCKQUOTE') },
  ]

  return (
    <div className="group relative rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 transition-colors focus-within:border-[#0A66C2]/50 flex flex-col min-h-[160px]">
      <div className="absolute -inset-0.5 bg-[#0A66C2]/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition duration-500 pointer-events-none"></div>
      
      <div className="relative rounded-2xl bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-xl overflow-hidden flex flex-col flex-1">
        {/* Toolbar */}
        <div className="flex items-center gap-1 p-2 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 overflow-x-auto no-scrollbar shrink-0">
          {toolbarButtons.map((btn, idx) => 
            btn.divider ? (
              <div key={idx} className="w-px h-4 bg-slate-200 dark:bg-white/10 mx-1 shrink-0" />
            ) : (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  btn.action()
                }}
                title={btn.label}
                className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200 dark:text-white/50 dark:hover:text-white dark:hover:bg-white/10 transition-colors shrink-0"
              >
                {btn.icon}
              </button>
            )
          )}
        </div>

        {/* Editor Area */}
        <div className="relative flex-1 p-4 cursor-text bg-transparent" onClick={() => editorRef.current?.focus()}>
          {/* Placeholder */}
          {!value && (
            <div className="absolute inset-4 text-slate-400 dark:text-white/30 pointer-events-none font-sans text-base">
              {placeholder || "Share your knowledge..."}
            </div>
          )}
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onBlur={handleInput}
            className="w-full min-h-[120px] outline-none text-slate-900 dark:text-white font-sans text-base leading-relaxed whitespace-pre-wrap [&>blockquote]:border-l-4 [&>blockquote]:border-[#0A66C2] [&>blockquote]:pl-4 [&>blockquote]:text-slate-500 dark:[&>blockquote]:text-white/70 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 [&>a]:text-cyan-600 dark:[&>a]:text-cyan-400 [&>a]:underline"
          />
        </div>
      </div>
    </div>
  )
}
