<script setup lang="ts">
import {
  acceptCompletion,
  autocompletion,
  closeBrackets,
  completionStatus,
} from '@codemirror/autocomplete';
import { defaultKeymap, indentLess, indentWithTab, insertNewlineKeepIndent, history, historyKeymap, cursorLineUp, cursorLineDown, undo, redo } from '@codemirror/commands';
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
  showPanel
} from '@codemirror/view';
import type {
  Command
} from '@codemirror/view';
import { tags } from '@lezer/highlight';
import { onMounted, useTemplateRef, h, render } from 'vue';
import ToolBar from './ToolBar.vue';

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
        height: "100%",
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

  const syntaxDarkTheme = HighlightStyle.define([
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
  ])

  /**
   * - Indent if cursor is at start of line
   * - Insert new line if cursor is at end of line
   * - Move cursor to end of line if cursor is in middle of line
   */
  const superTabCommand: Command = (view) => {
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
  }

  new EditorView({
    doc: demoCSS,
    extensions: [
      darkTheme,
      lineNumbers(),
      highlightActiveLine(),
      highlightActiveLineGutter(),
      history(),
      syntaxHighlighting(syntaxDarkTheme, { fallback: true }),
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
          run: superTabCommand
        },
      ]),
      css(),
      showPanel.of((view) => {
        const container = document.createElement('div');
        const toolBar = h(ToolBar, {
          onBtnClick: ({ id, value }) => {
            switch (id) {
              case 'esc':
                break;
              case 'tab':
                superTabCommand(view)
                break;
              case 'up':
                cursorLineUp(view)
                break;
              case 'down':
                cursorLineDown(view)
                break;
              case 'back':
                undo(view)
                break;
              case 'forward':
                redo(view)
                break;
              case 'brace':
              case 'bracket':
              case 'parenthesis':
              case 'quote':
              case 'asterisk':
              case 'tilde':
              case 'at':
              case 'plus':
              case 'hyphen':
              case 'hash':
              case 'dot':
              case 'comma':
              case 'colon':
              case 'percent':
              case 'greater-than':
              case 'slash':
              case 'exclamation':
              case 'semicolon':
                view.dispatch({
                  changes: { from: view.state.selection.main.head, insert: value },
                  selection: { anchor: view.state.selection.main.head + 1 }
                })
                break;
              default:
                break;
            }
            view.focus()
          }
        })
        render(toolBar, container)
        return {
          dom: container,
          bottom: true
        }
      })
    ],
    parent: codeEl.value,
  });
});
</script>

<template>
  <div ref="code" style="height: 100%;"></div>
</template>
