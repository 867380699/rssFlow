<script setup lang="ts">
import {
  acceptCompletion,
  autocompletion,
  closeBrackets,
  completionStatus,
} from '@codemirror/autocomplete';
import { defaultKeymap, indentLess, indentWithTab, insertNewlineKeepIndent, history, historyKeymap } from '@codemirror/commands';
import { css } from '@codemirror/lang-css';
import {
  bracketMatching,
  HighlightStyle,
  syntaxHighlighting,
} from '@codemirror/language';
import {
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
} from '@codemirror/view';
import { tags } from '@lezer/highlight';
import { onMounted, useTemplateRef } from 'vue';

const codeEl = useTemplateRef('code');

const demoCSS = `
/* Comment */
:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.87);
}

body {
  margin: 0;
  min-width: 320px;
  height: 100vh;
  background-image: url(http://some-image?foo=bar);
}

#app {
  width: 100%;
  height: 100%;
  animation-name: slide-in;
}

.editor {
  --border-radius: 8px;
  padding: 0.5em 1em;
  border: 1px solid #ddd;
}

@media (prefers-color-scheme: light) {
  :root {
    color: #213547;
    background-color: #ffffff;
  }
}

@keyframes slide-in {
  from {
    transform: translateX(0%);
  }

  to {
    transform: translateX(100%);
  }
}
`.trim();

onMounted(() => {
  if (!codeEl.value) return;

  const darkTheme = EditorView.theme(
    {
      '&': {
        backgroundColor: '#1e1e2e',
        color: '#cdd6f4',
      },
      '.cm-content': {
        caretColor: '#7f849c',
      },
      '.cm-gutter': {
        backgroundColor: '#181825',
        color: '#7f849c',
      },
      '.cm-activeLine': {
        backgroundColor: '#313244',
      },
      '.cm-activeLineGutter': {
        backgroundColor: '#181825',
        color: '#cba6f7',
      },
    },
    { dark: true }
  );

  new EditorView({
    doc: demoCSS,
    extensions: [
      darkTheme,
      lineNumbers(),
      highlightActiveLine(),
      highlightActiveLineGutter(),
      history(),
      syntaxHighlighting(
        HighlightStyle.define([
          {
            tag: [tags.keyword],
            color: '#f38ba8',
          },
          {
            tag: [tags.atom, tags.url, tags.brace],
            color: '#b4befe',
          },
          {
            tag: [tags.literal],
            color: '#df8e1d',
          },
          {
            tag: [
              tags.string,
              tags.regexp,
              tags.escape,
              tags.special(tags.string),
            ],
            color: '#a6e3a1',
          },
          {
            tag: [
              tags.typeName,
              tags.namespace,
              tags.variableName,
              tags.labelName,
            ],
            color: '#89b4fa',
          },
          {
            tag: [tags.className],
            color: '#f9e2af',
          },
          {
            tag: [tags.definitionKeyword],
            color: '#cba6f7',
          },
          {
            tag: [tags.comment, tags.separator],
            color: '#585b70',
          },
        ]),
        { fallback: true }
      ),
      bracketMatching(),
      autocompletion(),
      closeBrackets(),
      keymap.of([
        ...defaultKeymap,
        ...historyKeymap
      ]),
      keymap.of([
        {
          key: 'Tab',
          preventDefault: true,
          shift: indentLess,
          run: (view) => {
            if (completionStatus(view.state)) {
              return acceptCompletion(view);
            } else {
              const { from, to } = view.state.selection.main;
              const line = view.state.doc.lineAt(from);
              const prefix = line.text.slice(0, from - line.from);
              if (from !== to || prefix.match(/^\s*$/)) {
                return indentWithTab.run!(view);
              } else if (from === line.to) {
                return insertNewlineKeepIndent(view)
              } else {
                view.dispatch({
                  selection: { anchor: line.to },
                });
                return true
              }
            }
          },
        },
      ]),
      css(),
    ],
    parent: codeEl.value,
  });
});
</script>

<template>
  <div ref="code"></div>
</template>
