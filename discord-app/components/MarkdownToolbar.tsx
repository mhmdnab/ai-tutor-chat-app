interface MarkdownToolbarProps {
  onInsert: (before: string, after: string) => void;
}

export default function MarkdownToolbar({ onInsert }: MarkdownToolbarProps) {
  const tools = [
    { label: 'B', title: 'Bold (**text**)', before: '**', after: '**', icon: 'font-bold' },
    { label: 'I', title: 'Italic (*text*)', before: '*', after: '*', icon: 'italic' },
    { label: '<>', title: 'Inline Code (`code`)', before: '`', after: '`', icon: '' },
    { label: '{}', title: 'Code Block (```)', before: '```\n', after: '\n```', icon: '' },
    { label: '🔗', title: 'Link ([text](url))', before: '[', after: '](url)', icon: '' },
    { label: '>', title: 'Quote (> text)', before: '> ', after: '', icon: '' },
  ];

  return (
    <div className="flex gap-1 px-3 sm:px-4 md:px-6 pb-2">
      <div className="flex gap-1 items-center">
        {tools.map(tool => (
          <button
            key={tool.label}
            type="button"
            onClick={() => onInsert(tool.before, tool.after)}
            className="px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-gray-700/60 rounded transition-colors font-mono"
            title={tool.title}
          >
            <span className={tool.icon}>{tool.label}</span>
          </button>
        ))}
        <div className="ml-2 text-xs text-gray-500 hidden sm:block">
          Markdown supported
        </div>
      </div>
    </div>
  );
}
