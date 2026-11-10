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
import { SvgSuggestModal } from '../modals/svgSuggestModal';
import { SelectCommandModal } from '../modals/selectCommandModal';





export const registerButtonExtension = (plugin: MdPlus) => {

  class ButtonWidget extends WidgetType {
    from: number
    to: number
    buttonId: string
    buttonName: string
    buttonIcon: string | undefined
    buttonParts: any
    plugin: MdPlus

    constructor(from: number, to: number, buttonId: string, buttonName: string, buttonIcon: string | undefined, buttonParts: any, plugin: MdPlus) {
      super();
      this.to = to
      this.from = from
      this.buttonId = buttonId
      this.buttonName = buttonName
      this.buttonIcon = buttonIcon
      this.buttonParts = buttonParts
      this.plugin = plugin
    }

    toDOM(view: EditorView) {
      let buttonEl = document.createElement("button")
      buttonEl.classList.add("inline-button")
      if (this.buttonIcon) {
        setIcon(buttonEl, this.buttonIcon)
        if (this.buttonName) {
          buttonEl.classList.add("has-icon-with-text")
        }
      }
      buttonEl.append(this.buttonName)
    

      buttonEl.onclick = (e) => {
        //@ts-ignore
        this.plugin.app.commands.executeCommandById(this.buttonId)
      }

      buttonEl.onmousedown = (e) => {
        e.preventDefault()
        e.stopPropagation()
      }

      buttonEl.oncontextmenu = (e) => {
        e.preventDefault()
        e.stopPropagation()

        let menu = new Menu

        menu.addItem((item) => item
        .setTitle("Выбрать команду")
        .setIcon("terminal")
        .onClick(() => {
          new SelectCommandModal(this.from, this.to, this.buttonId, this.buttonName, this.buttonIcon, view, plugin).open()
        }))


        menu.addItem((item) => item
        .setTitle("Изменить название")
        .setIcon("edit-3")
        .onClick(() => {

          let insert = "|"
          let buttonEnd = this.to - 2
          
          let nameEnd = buttonEnd + 1
          let nameStart = nameEnd


          if (this.buttonParts) {
            insert = ""
            nameEnd = buttonEnd
            nameStart = nameEnd - this.buttonName.length
            
          }

          let transaction = view.state.update({
            changes: [
              { from: buttonEnd, to: buttonEnd },
              { from: buttonEnd, insert: insert }
            ],
            selection: {
              anchor: nameStart, head: nameEnd
            }
          });
          view.dispatch(transaction);
          
        }))


        menu.addItem((item) => item
        .setTitle("Выбрать иконку")
        .setIcon("image")
        .onClick(() => {

          let selectCallback = (iconId: string) => {
            let buttonText = this.buttonId

            if (iconId) {
              if (this.buttonName == this.buttonId) {
                buttonText = this.buttonId + "|:" + iconId + ":"
              } else {
                buttonText = this.buttonId + "|:" + iconId + ":" + this.buttonName
              }
          
            } else if (this.buttonName && this.buttonName != this.buttonId) {
              buttonText = this.buttonId + "|" + this.buttonName
            }

            let buttonStart = this.from + 2
            let buttonEnd = this.to - 2

            let transaction = view.state.update({
              changes: [
                { from: buttonStart, to: buttonEnd },
                { from: buttonStart, insert: buttonText }
              ]
            });
            view.dispatch(transaction);
          }
          new SvgSuggestModal(this.plugin, selectCallback).open()
        }))



        

        menu.showAtMouseEvent(e)
      
      }

      
      return buttonEl
    }
  }
  

  class ButtonsPlugin {
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
      for (let { from, to } of view.visibleRanges) {
        syntaxTree(view.state).iterate({
          from,
          to,
          enter(node: any) {

            


            if (node.type.name.startsWith("inline-code")) {



              
              let codeStr = view.state.doc.sliceString(node.from, node.to)

              let buttonMatch = codeStr.match(/(<<)(.+)(>>)/)
                          
              if (buttonMatch) {
                let buttonId = buttonMatch[2]!
                let buttonName = buttonId
                let buttonIcon

                let buttonParts = buttonId.match(/(.+?)(\|)(.+)/)

                        

                if (buttonParts) {
                  buttonId = buttonParts[1]!
                  buttonName = buttonParts[3]!

                  let nameParts = buttonName.match(/(:)(.+?)(:)(.*)/)

                  if (nameParts) {
                    buttonIcon = nameParts[2]!
                    buttonName = nameParts[4]!
                  }
                }






                for (let range of ranges) {

     

                  if (node.from - 1 > range.to || node.to + 1 < range.from) {


                    builder.add(
                      node.from,
                      node.to,
                      Decoration.replace({
                        widget: new ButtonWidget(node.from, node.to, buttonId, buttonName, buttonIcon, buttonParts, plugin)
                      })
                      );
                    }
                  }
                
                
              }


            
            }

            



           
          }
        });
      }
      return builder.finish();
    }
  }
  const pluginSpec: PluginSpec<ButtonsPlugin> = {
    decorations: (value: ButtonsPlugin) => value.decorations
  };
  const buttonsPlugin = ViewPlugin.fromClass(
    ButtonsPlugin,
    pluginSpec
  );
  plugin.registerEditorExtension([buttonsPlugin]);
}


