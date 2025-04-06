"use client";

import React from "react";
import CodeMirror from '@uiw/react-codemirror';
import { langs } from '@uiw/codemirror-extensions-langs';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ value, onChange }) => {
  const handleChange = React.useCallback((val: string) => {
    onChange(val);
  }, [onChange]);

  return (
    <div className="h-full transition-all">
      <CodeMirror
        value={value}
        height="100%"
        extensions={[langs.stex()]}
        onChange={handleChange}
        theme="light"
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          highlightActiveLine: true,
          highlightSelectionMatches: true,
          autocompletion: true,
          indentOnInput: true,
          completionKeymap: true,
        }}
        style={{ fontSize: '14px' }}
      />
    </div>
  );
};

export default CodeEditor;