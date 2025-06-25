interface ResumeEditorProps {
    initialText: string;
    onUpdate: (updatedText: string) => void;
}

export default function ResumeEditor({
  initialText,
  onUpdate
}: ResumeEditorProps) {
  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold">📝 Improve Your Resume</h2>
      <textarea
        className="w-full h-96 border p-4 rounded mt-2 text-sm font-mono"
        defaultValue={initialText}
        onChange={(e) => onUpdate(e.target.value)}
      />
    </div>
  );
}
