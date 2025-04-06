"use client";

import React, { useEffect } from "react";
import CodeMirror from '@uiw/react-codemirror';
import { langs } from '@uiw/codemirror-extensions-langs';
import { EditorView, KeyBinding, keymap } from '@codemirror/view';
import { EditorState } from '@codemirror/state';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ value, onChange }) => {
  const handleChange = React.useCallback((val: string) => {
    onChange(val);
  }, [onChange]);

  // Reference to store the editor view
  const editorRef = React.useRef<EditorView | null>(null);
  
  // Custom keymap to prevent Cmd+Enter from creating a new line
  // const customKeymap = new Compartment();
  
  const preventCtrlEnter: KeyBinding[] = [
    {
      key: "Ctrl-Enter",
      run: () => {
        // Prevent default behavior - the event will be handled by the parent component
        return true;
      }
    }
  ];

  return (
    <div className="h-full transition-all overflow-auto">
      <CodeMirror
        value={value}
        height="100%"
        extensions={[
          langs.stex(),
          keymap.of(preventCtrlEnter)
        ]}
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
        style={{ fontSize: '14px', overflow: 'auto' }}
        onCreateEditor={(view) => {
          editorRef.current = view;
        }}
      />
    </div>
  );
};

export default CodeEditor;