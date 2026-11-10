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
ViewUpdate,
WidgetType
} from '@codemirror/view';
import { setIcon, editorLivePreviewField, Menu, requireApiVersion } from 'obsidian';
import MdPlus from "../main";




export const registerHighlightsExtension = (plugin: MdPlus) => {

  class HighlightsPlugin implements PluginValue {
    decorations: DecorationSet

    constructor(view: EditorView) {
      this.decorations = this.buildDecorations(view);
    }
    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged || update.selectionSet) {
        //@ts-ignore
        let isSelecting = update.transactions?.[0]?.annotations?.find(a => a.value == "select.pointer")
        let selectionEmpty = update.state.selection.main.empty

        if (!isSelecting || selectionEmpty) {
          this.decorations = this.buildDecorations(update.view);
        } 
        
      }
    }
    destroy() {
    }
    buildDecorations(view: EditorView): DecorationSet {
      const builder = new RangeSetBuilder<Decoration>();
      if (!view.state.field(editorLivePreviewField)) {
        return builder.finish();
      }

      const ranges = view.state.selection.ranges
      let hlStart = 0
      let hlEnd = 0
      let formatting: any = null
      let hlNodes: any[] = []

      for (let { from, to } of view.visibleRanges) {
        syntaxTree(view.state).iterate({
          from,
          to,
          enter(node: any) {

            let type = node.type.name



            // Новая версия (в ней уже есть цветные хайлайты, нам нужно только добавить отступы)

            if (requireApiVersion("1.14.0")) {

              if (type.includes("highlight") && type.startsWith("formatting")) {

                let nodeText = view.state.doc.sliceString(node.from, node.to)
                let text = view.state.doc.sliceString(hlStart, node.to)

                if (nodeText.startsWith("==") && !type.includes("highlight-end")) {
                  hlStart = node.from
                  hlEnd = node.to
                }

                if (text.match(/^==.*==$/)) {
                  hlEnd = node.to

                  let firstNode = hlNodes[0]
                  let lastNode = hlNodes[hlNodes.length - 1]

                  for (let range of ranges) {
                    let notSelected = hlStart > range.to || hlEnd < range.from

                    if (notSelected) {

                      if (firstNode && lastNode) {
                        if (firstNode.from == lastNode.from) {
                          builder.add(
                            firstNode.from,
                            firstNode.to,
                            Decoration.mark({
                              class: "hl-first hl-last"
                            })
                          );
        
                        } else {
                          builder.add(
                            firstNode.from,
                            firstNode.to,
                            Decoration.mark({
                              class: "hl-first"
                            })
                          );
        
                          builder.add(
                            lastNode.from,
                            lastNode.to,
                            Decoration.mark({
                              class: "hl-last"
                            })
                          );
                        }
                      }
                    } 
                  }

                  hlNodes = []
                }

              } else if (type.includes("highlight")) {
                let nodeText = view.state.doc.sliceString(node.from, node.to)
                hlNodes.push({from: node.from, to: node.to, text: nodeText})
              }


            } else {
              
              // Старая версия - нужно добавить цвета

              if (type.includes("highlight") && type.startsWith("formatting")) {

                if (formatting == null) {
                  hlStart = node.from
                  formatting = type

                } else if (formatting == type) {

                  hlEnd = node.to
                  formatting = null
                  let text = view.state.doc.sliceString(hlStart, hlEnd)
                  let hlType


                  let hlSymbol = ""

                  if (text.match(/^==🔴.*==$/)) {
                    hlType = "hl-red"
                    hlSymbol = "🔴"
                  } else if (text.match(/^==🟠.*==$/)) {
                    hlType = "hl-orange"
                    hlSymbol = "🟠"
                  } else if (text.match(/^==🟡.*==$/)) {
                    hlType = "hl-yellow"
                    hlSymbol = "🟡"
                  } else if (text.match(/^==🟢.*==$/)) {
                    hlType = "hl-green"
                    hlSymbol = "🟢"
                  } else if (text.match(/^==🔵.*==$/)) {
                    hlType = "hl-blue"
                    hlSymbol = "🔵"
                  } else if (text.match(/^==🟣.*==$/)) {
                    hlType = "hl-purple"
                    hlSymbol = "🟣"
                  } 

                  if (hlType) {
                    builder.add(
                      hlStart,
                      hlEnd,
                      Decoration.mark({
                        class: hlType + " hl-custom"
                      })
                    );
                  }

                  let firstNode = hlNodes[0]
                  let lastNode = hlNodes[hlNodes.length - 1]

                  for (let range of ranges) {
                    let notSelected = hlStart > range.to || hlEnd < range.from

                    if (notSelected) {

                      if (hlType) {
                        builder.add(
                          hlStart + 2,
                          hlStart + 2 + hlSymbol.length,
                          Decoration.replace({})
                        );
                      }

                      if (firstNode && lastNode) {
                        if (firstNode.from == lastNode.from) {
                          builder.add(
                            firstNode.from,
                            firstNode.to,
                            Decoration.mark({
                              class: "hl-first hl-last"
                            })
                          );
        
                        } else {
                          builder.add(
                            firstNode.from,
                            firstNode.to,
                            Decoration.mark({
                              class: "hl-first"
                            })
                          );
        
                          builder.add(
                            lastNode.from,
                            lastNode.to,
                            Decoration.mark({
                              class: "hl-last"
                            })
                          );
                        }

                      }
                      
                    } else {
                      if (hlType) {
                        builder.add(
                          hlStart + 2,
                          hlStart + 2 + hlSymbol.length,
                          Decoration.mark({
                            class: "hl-formatting hl-formatting-start"
                          })
                        );
                      }
                    }
                  }

                  hlNodes = []
                } 
              } else if (type.includes("highlight")) {
                let nodeText = view.state.doc.sliceString(node.from, node.to)
                hlNodes.push({from: node.from, to: node.to, text: nodeText})
              }

            }
          }
        });
      }
      return builder.finish();
    }
  }
  const pluginSpec: PluginSpec<HighlightsPlugin> = {
    decorations: (value: HighlightsPlugin) => value.decorations
  };
  const highlightsPlugin = ViewPlugin.fromClass(
    HighlightsPlugin,
    pluginSpec
  );
  plugin.registerEditorExtension([highlightsPlugin]);
}