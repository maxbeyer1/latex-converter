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
    <CodeMirror
      value={value}
      height="100%"
      extensions={[langs.stex()]}
      onChange={handleChange}
      theme="dark"
      basicSetup={{
        lineNumbers: true,
        foldGutter: true,
        highlightActiveLine: true,
      }}
    />
  );
};

export default CodeEditor;