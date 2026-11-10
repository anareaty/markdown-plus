//@ts-ignore
import { syntaxTree } from '@codemirror/language';
import { RangeSetBuilder } from '@codemirror/state';
import {
Decoration,
DecorationSet,
EditorView,
PluginSpec,
PluginValue,
ViewPlugin,
ViewUpdate
} from '@codemirror/view';
import { editorLivePreviewField } from 'obsidian';
import MdPlus from '../main';


export const registerEmptyLineExtension = (plugin: MdPlus) => {

  class EmptyLinePlugin implements PluginValue {
    decorations: DecorationSet

    constructor(view: EditorView) {
      this.decorations = this.buildDecorations(view);
    }
    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {  
        this.decorations = this.buildDecorations(update.view);
      }
    }
    destroy() {
    }
    buildDecorations(view: EditorView): DecorationSet {
      const builder = new RangeSetBuilder<Decoration>();
      if (!view.state.field(editorLivePreviewField)) {
        return builder.finish();
      }

      for (let { from, to } of view.visibleRanges) {
        syntaxTree(view.state).iterate({
          from,
          to,
          enter(node: any) {



            

            if (node.type.name == "Document") {

              let docText = view.state.doc.sliceString(node.from, node.to)

              let text = docText.replace(/^(---\n.*?\n---\n)(.*)/msgi, "$2")
              let from = node.from + docText.length - text.length

              if (text.startsWith("\n")) {
                builder.add(
                  from,
                  from,
                  Decoration.line({
                    attributes: {
                      class: "first-empty-line"
                    }
                  })
                );
              }
            }
          }
        });
      }
      return builder.finish();
    }
  }

  const pluginSpec: PluginSpec<EmptyLinePlugin> = {
    decorations: (value: EmptyLinePlugin) => value.decorations
  }

  const emptyLinePlugin = ViewPlugin.fromClass(
    EmptyLinePlugin,
    pluginSpec
  );
  plugin.registerEditorExtension([emptyLinePlugin]);
}