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
import MdPlus from '../main';




export const registerCheckboxExtension = (plugin: MdPlus) => {

    class CheckboxPlugin implements PluginValue {
        decorations: DecorationSet;
        view: EditorView

        constructor(view: EditorView) {
            this.view = view
            this.decorations = this.buildDecorations(view);
        }

        update(update: ViewUpdate) {
            //@ts-ignore
            if (update.docChanged || update.viewportChanged || update.transactions?.[0]?.annotations?.[0]?.value) {
                this.decorations = this.buildDecorations(update.view);
            }
        }

        destroy() {}

        buildDecorations(view: EditorView): DecorationSet {
            const builder = new RangeSetBuilder<Decoration>();
            for (let { from, to } of view.visibleRanges) {
                syntaxTree(view.state).iterate({
                    from,
                    to,
                    enter(node: any) {

                        // Mark the line before table
                        if (node.type.name.includes("HyperMD-table-row-0")) {
                            builder.add(
                            node.from - 1,
                            node.from - 1,
                            Decoration.line({
                                attributes: {
                                class: "pre-table-line"
                                }
                            })
                            )
                        }


                        // Wrap checkboxes
                        if (node.type.name.includes("formatting_formatting-task_property") || 
                        node.type.name.includes("formatting_formatting-task_meta")) {
                            let deco = Decoration.mark({
                            attributes: {
                                "data-checkbox-start": node.from
                            },
                            class: "custom-checkbox"
                            });
                            builder.add(node.from - 2, node.to + 1, deco);
                        }
                    },
                });
            }
            
            return builder.finish();
        }
    }

    const pluginSpec: PluginSpec<CheckboxPlugin> = {
        decorations: (value: CheckboxPlugin) => value.decorations,
    };

    const checkboxPlugin = ViewPlugin.fromClass(
        CheckboxPlugin,
        pluginSpec
    )

    plugin.registerEditorExtension(checkboxPlugin)
}


