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
import { setIcon, editorLivePreviewField, Menu } from 'obsidian';
import MdPlus from '../main';






export const registerCustomListExtension = (plugin: MdPlus) => {
    class IconWidget extends WidgetType {
        listObj: any
        from: number
        constructor(listObj: any, from: number) {
            super()
            this.listObj = listObj
            this.from = from
        }
        toDOM(view: EditorView): HTMLElement {
            let iconSpan = document.createElement('span');
            setIcon(iconSpan, this.listObj.iconId)
            iconSpan.classList.add("custom-list-icon")
            iconSpan.setAttribute("data-symbol", this.listObj.symbol)
            iconSpan.setCssProps({
                "color": this.listObj.iconColor
            })

            iconSpan.oncontextmenu = (e) => {
              e.preventDefault()
              let iconMenu = new Menu()
              
              let lists = plugin.settings.lists
      
              
              for (let list of lists) {
                iconMenu.addItem(item => {
                  item
                  .setChecked(this.listObj.symbol == list.symbol)
                  .setTitle(list.name || list.symbol)
                  .setIcon(list.iconId)
                  //@ts-ignore
                  item.iconEl.setCssProps({
                    "color": list.iconColor
                  })
                  //@ts-ignore
                  item.dom.setCssProps({
                    "color": list.color,
                    "background-color": list.background
                  })
                  //@ts-ignore
                  item.dom.classList.add("custom-list-menu-item")
      
                  item.onClick(() => {
                    let transaction = view.state.update({
                      changes: [
                        {from: this.from, to: this.from + this.listObj.symbol.length}, 
                        {from: this.from, insert: list.symbol}]
                    })
                    view.dispatch(transaction)
                  })
      
                  return item
                })
              }


              iconMenu.addItem(item => item
                .setTitle("Задача")
                .setIcon("circle")
                .onClick(() => {
                  let transaction = view.state.update({
                      changes: [
                        {from: this.from, to: this.from + this.listObj.symbol.length}, 
                        {from: this.from, insert: "[ ]"}]
                    })
                    view.dispatch(transaction)
                })
              )
		

              iconMenu.addItem(item => item
                .setTitle("Список")
                .setIcon("dot")
                .onClick(() => {
                  let transaction = view.state.update({
                      changes: [
                        {from: this.from, to: this.from + this.listObj.symbol.length + 1}, 
                        {from: this.from, insert: ""}]
                  })
                  view.dispatch(transaction)
                })
              )
		

              iconMenu.addItem(item => item
                .setTitle("ОЧИСТИТЬ")
                .setIcon("x")
                .onClick(() => {
                  let transaction = view.state.update({
                      changes: [
                        {from: this.from - 2, to: this.from + this.listObj.symbol.length + 1}, 
                        {from: this.from - 2, insert: ""}]
                  })
                  view.dispatch(transaction)
                })
              )
		
              iconMenu.showAtMouseEvent(e)
            }
            return iconSpan;
        }
    }



    class CustomListPlugin implements PluginValue {
        decorations: DecorationSet
        view: EditorView

      constructor(view: EditorView) {
        this.decorations = this.buildDecorations(view);
        this.view = view
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
        if (!view.state.field(editorLivePreviewField)) {return builder.finish();}
        let items = plugin.settings.lists
    
        for (let { from, to } of view.visibleRanges) {
          syntaxTree(view.state).iterate({
            from,
            to,
            enter(node: any) {
              if (node.type.name.startsWith('list')) {
                let listStr = view.state.doc.sliceString(node.from, node.to)

                for (let listObj of items) {
                  let symbol = listObj.symbol
                  if (!symbol) continue
                  if (listStr.startsWith(symbol + " ")) {

                    let replaceTo = node.from + symbol.length + 1
                    let hasIconClass = "no-icon"
                    if (listObj.iconId) {
                      replaceTo = node.from + symbol.length
                      hasIconClass = "has-icon"
                    }
                    
                    builder.add(
                      node.from - 2,
                      node.from - 2,
                      Decoration.line({
                        attributes: {
                          class: "custom-list-line " + listObj.customClass + " " + hasIconClass,
                          style: "color: " + listObj.color + "; background-color: " + listObj.background,
                        "data-symbol": listObj.symbol
                        }
                      })
                    );

                    builder.add(
                      node.from,
                      replaceTo,
                      Decoration.replace({
                        widget: new IconWidget(listObj, node.from),
                      })
                    );
                  }
                }                
              }
            },
          });
        }
        return builder.finish();
      }
    }

    const pluginSpec: PluginSpec<CustomListPlugin> = {
        decorations: (value: CustomListPlugin) => value.decorations,
    };

    const customListPlugin = ViewPlugin.fromClass(
      CustomListPlugin,
      pluginSpec
    )

    plugin.registerEditorExtension([customListPlugin])
}


