import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { markdown as markdownLanguage } from "@codemirror/lang-markdown";
import { defaultHighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { EditorState } from "@codemirror/state";
import { drawSelection, dropCursor, EditorView, highlightActiveLine, keymap, lineNumbers } from "@codemirror/view";

export const MarkdownEditor = forwardRef(function MarkdownEditor({ markdown, selectedLine, onChange, onCursorLineChange }, ref) {
  const host = useRef(null);
  const view = useRef(null);
  const onChangeRef = useRef(onChange);
  const onCursorLineChangeRef = useRef(onCursorLineChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onCursorLineChangeRef.current = onCursorLineChange;
  }, [onCursorLineChange]);

  useImperativeHandle(ref, () => ({
    insertText(text) {
      const editor = view.current;
      if (!editor) return;
      const selection = editor.state.selection.main;
      const prefix = selection.from > 0 && !editor.state.doc.sliceString(selection.from - 1, selection.from).match(/\s/) ? "\n\n" : "";
      editor.dispatch({
        changes: { from: selection.from, to: selection.to, insert: `${prefix}${text}` },
        selection: { anchor: selection.from + prefix.length + text.length },
        scrollIntoView: true
      });
      editor.focus();
    },
    getCursorLine() {
      const editor = view.current;
      if (!editor) return 1;
      return editor.state.doc.lineAt(editor.state.selection.main.head).number;
    }
  }), []);

  useEffect(() => {
    if (!host.current) return undefined;

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) onChangeRef.current(update.state.doc.toString());
      if (update.selectionSet || update.docChanged) {
        const line = update.state.doc.lineAt(update.state.selection.main.head).number;
        onCursorLineChangeRef.current?.(line);
      }
    });

    view.current = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: markdown,
        extensions: [
          lineNumbers(),
          history(),
          drawSelection(),
          dropCursor(),
          highlightActiveLine(),
          markdownLanguage(),
          syntaxHighlighting(defaultHighlightStyle),
          keymap.of([indentWithTab, ...defaultKeymap, ...historyKeymap]),
          updateListener,
          EditorView.lineWrapping,
          EditorView.theme({
            "&": { height: "100%" },
            ".cm-scroller": { fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }
          })
        ]
      })
    });

    return () => {
      view.current?.destroy();
      view.current = null;
    };
  }, []);

  useEffect(() => {
    const editor = view.current;
    if (!editor) return;
    const current = editor.state.doc.toString();
    if (current === markdown) return;
    editor.dispatch({
      changes: { from: 0, to: current.length, insert: markdown }
    });
  }, [markdown]);

  useEffect(() => {
    const editor = view.current;
    if (!editor || !selectedLine) return;
    const line = editor.state.doc.line(Math.max(1, Math.min(selectedLine, editor.state.doc.lines)));
    editor.dispatch({
      selection: { anchor: line.from, head: line.to },
      scrollIntoView: true
    });
    editor.focus();
  }, [selectedLine]);

  return (
    <section className="markdown-pane" aria-label="Editor Markdown">
      <div ref={host} className="codemirror-host" />
    </section>
  );
});
