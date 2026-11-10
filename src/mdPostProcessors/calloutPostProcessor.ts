import { App } from "obsidian";
import MdPlus from "../main";
import { Prec } from '@codemirror/state';
import { EditorView } from '@codemirror/view';








export const resolveEditorClass = (plugin: MdPlus) => {
  if (plugin.cachedEditorClass !== undefined) return plugin.cachedEditorClass;
  plugin.cachedEditorClass = null;
  let temp = null;
  try {
    //@ts-ignore
    const registry = plugin.app.embedRegistry
    const createMdEmbed = registry?.embedByExtension?.md;
    if (!createMdEmbed) return null;

    temp = createMdEmbed(
      {app: plugin.app, containerEl: document.createElement("div"), state: {}},
      null,
      "",
    );
    temp.load();
    temp.editable = true;
    temp.showEditor();
    if (temp.editMode) {
      const proto = Object.getPrototypeOf(Object.getPrototypeOf(temp.editMode));
      const ctor = proto?.constructor;
      if (typeof ctor === "function") {
        plugin.cachedEditorClass = ctor
      }
    }
  } catch {
    plugin.cachedEditorClass = null;
  } finally {
    try {
      temp?.unload();
    } catch {
      // Best-effort cleanup when probing an unsupported internal API.
    }
  }
  return plugin.cachedEditorClass;
}








export const createEditor = (containerEl: HTMLElement, content: string, view: any, column: any, plugin: MdPlus) => {

   
  if (plugin.activeColumnEditor) {
   let {containerEl, cmView, columnData} = plugin.activeColumnEditor
   saveAndUnloadCalloutColumnEditor(containerEl, cmView, columnData, plugin)
  }
  
  

  const EditorClass = resolveEditorClass(plugin)
  if (!EditorClass) return


  class EmbeddedColumnEditor extends EditorClass {
    constructor(app: App, containerEl: HTMLElement, owner: any, cmView: any, columnData: any) {
      super(app, containerEl, owner)
      this.cmView = cmView
      this.columnData = columnData
    }

    buildLocalExtensions() {
      const extensions = super.buildLocalExtensions();

      extensions.push(
        Prec.highest(
          EditorView.domEventHandlers({
            focusin: (evt) => {
              evt.stopPropagation();
              evt.win.setTimeout(() => {
                if (this.cm.hasFocus) {
                  this.app.workspace.activeEditor = owner
                  plugin.activeColumnEditor.focused = true
                }
              });
              return false;
            },


            blur: (e) => {
              setTimeout(() => {
                let active = this.containerEl.doc.activeElement
                if (plugin.activeColumnEditor && active instanceof Element) {
                  let isMenu = active.closest(".menu");
                  let isModal = active.closest(".modal-container")
                  if (!this.containerEl.contains(active)) {
                    if (!isMenu && !isModal) {
                      saveAndUnloadCalloutColumnEditor(this.containerEl, this.cmView, this.columnData, plugin)
                    } else if (!this.cm.hasFocus) {
                      plugin.activeColumnEditor.focused = false
                    }
                  } 
                } 
              }, 200)
            }
          }),
        ),
      )

       return extensions
    }
  }

  let instance: any = null;
  const contextFile = plugin.app.workspace.getActiveFile();

  const owner = {
    app: plugin.app,
    scroll: 0,
    editMode: null,
    showSearch: () => {},
    toggleMode: () => {},
    onMarkdownScroll: () => {},
    getMode: () => "source",
    get editor() {
      return instance?.editor;
    },
    get file() {
      return contextFile;
    },
    get path() {
      return contextFile?.path ?? "";
    },
  };

  plugin.activeColumnEditor = new EmbeddedColumnEditor(plugin.app, containerEl, owner, view, column);

  instance = plugin.activeColumnEditor
  owner.editMode = plugin.activeColumnEditor
  plugin.activeColumnEditor.load();
  plugin.activeColumnEditor.set(content);


  plugin.activeColumnEditor.focus()
  let editor = plugin.activeColumnEditor.editor
  let lastLine = editor.lastLine()
  let lastLineText = editor.getLine(lastLine)
  editor.setSelection({line: lastLine, ch: lastLineText.length})
   
}




export const saveColumnContent = (newContent: string, view: any, column: any) => {
    let transaction = view.state.update({
      changes: [
        { from: column.from, to: column.to },
        { from: column.from, insert: newContent }
      ]
    })
    view.dispatch(transaction)
}



export const saveAndUnloadCalloutColumnEditor = (containerEl: HTMLElement, view: any, column: any, plugin: MdPlus) => {

  let editorValue = plugin.activeColumnEditor.editor.getValue()


  editorValue = ">> " + editorValue.trim().replaceAll("\n", "\n>> ")

  
  plugin.activeColumnEditor.unload()
  let parentEl = containerEl.parentElement
  parentEl?.classList.remove("is-editing")
  containerEl.remove()
  plugin.activeColumnEditor = null

  saveColumnContent(editorValue, view, column)
}






export const registerCalloutPostProcessor = (plugin: MdPlus) => {
    plugin.registerMarkdownPostProcessor((el, ctx) => {

    let callout = el.find(".callout[data-callout='columns']")

    if (callout) {

      el.onclick = (e) => {
        if (e.target instanceof HTMLElement && !e.target.closest("input[type='checkbox']")) {
          e.stopPropagation()
        }
      }

      

      let columns = callout.findAll(".callout[data-callout='col']")

      let calloutEl = el.parentElement

      if (calloutEl && calloutEl.classList.contains("cm-callout")) {

        calloutEl.classList.add("columns")
        
        let columnsMeta = callout.getAttribute("data-callout-metadata")
        if (columnsMeta) {
          calloutEl.setAttribute("data-columns-meta", columnsMeta)
        }
        
      }

      


      for (let i = 0; i < columns.length; i++) {
        let columnCol = columns[i]!
        let columnWidth = 0
        let meta = columnCol.getAttribute("data-callout-metadata")

        if (meta) {
          let width = Number(meta)
          if (Number.isFinite(width)) {
            columnWidth = width
            columnCol.classList.add("fixed-width")
            columnCol.style.flex = `0 0 ${columnWidth}%`
          }
        }




        if (calloutEl && calloutEl.classList.contains("cm-callout")) {


          


          let resizer = columnCol.createEl("div")
          resizer.classList.add("column-resizer")

          let startX = 0;
          let startWidth = 0;
          

          const mouseDownHandler = function (e: MouseEvent) {

            if (plugin.activeColumnEditor) {
              let {containerEl, cmView, columnData} = plugin.activeColumnEditor
              saveAndUnloadCalloutColumnEditor(containerEl, cmView, columnData, plugin)
            }

            startX = e.clientX;
            startWidth = columnCol.getBoundingClientRect().width;
            document.addEventListener('mousemove', mouseMoveHandler);
            document.addEventListener('mouseup', mouseUpHandler);
          }


          const mouseMoveHandler = function (e: MouseEvent) {
            resizer.classList.add("is-dragging")
            callout.classList.add("is-resized")
            let takenWidth = 0
            let containerWidth = callout.getBoundingClientRect().width

            columns.forEach((item, ind) => {
              let w = item.getBoundingClientRect().width

              if (ind != i) {
                if (ind < i || item.classList.contains("fixed-width")) {
                  takenWidth = takenWidth + w
                } else if (ind > i) {
                  takenWidth = takenWidth + 160
                }
              }
            })

            let availiablewidth = containerWidth - takenWidth
            const dx = e.clientX - startX;
            let newWidth = startWidth + dx
            if (newWidth < 160) newWidth = 160
            if (newWidth > availiablewidth) newWidth = availiablewidth
            let percentWidth = Math.ceil(newWidth * 100 / containerWidth)

            columnCol.style.flex = `0 0 ${percentWidth}%`;
            columnCol.classList.add("fixed-width")
            columnWidth = percentWidth
          }



          const mouseUpHandler = function () {
            document.removeEventListener('mousemove', mouseMoveHandler);
            document.removeEventListener('mouseup', mouseUpHandler);
            resizer.classList.remove("is-dragging")
            callout.classList.remove("is-resized")

            //@ts-ignore
            const widget = (calloutEl.cmTile?.widget ?? calloutEl.cmView?.widget)

            if (widget) {
              let text = widget.text
              let lines = text.split("\n")
              let columnCount = 0
              let posStart = widget.start
              let posEnd = posStart

              for (let k = 0; k < lines.length; k++) {
                let line = lines[k]

                if (line.match(/^>\s*>\s*\[\!col\]\s*$/) || line.match(/^>\s*>\s*\[\!col\s*|\s*d+\s*\]\s*$/)) {
                  if (columnCount == i) {
                    posEnd = posStart + line.length
                    break
                  }
                  columnCount++
                }

                posStart = posStart + line.length + 1
              }

              if (Number.isFinite(columnWidth)) {
                let newColLine = `>> [!col| ${columnWidth}]`
                let editorView = widget.editor.cm

                let transaction = editorView.state.update({
                  changes: [
                    { from: posStart, to: posEnd },
                    { from: posStart, insert: newColLine }
                  ]
                });
                editorView.dispatch(transaction)
              }
            }

          }

          resizer.addEventListener('mousedown', mouseDownHandler)







          


          columnCol.ondblclick = (e) => {
            e.preventDefault()
            e.stopPropagation()
            

            //@ts-ignore
            const widget = (calloutEl.cmTile?.widget ?? calloutEl.cmView?.widget)
            if (widget) {

              if (columnCol.classList.contains("is-editing")) return
              columnCol.classList.add("is-editing")

              let contentEl = columnCol.find(".callout-content")
              let editorContainer = columnCol.createEl("div", {cls: "column-editor-container"})
              contentEl.after(editorContainer)




              let text = widget.text
              let lines = text.split("\n")
              let columnCount = 0

              let inCurrentColumn
              let currentColumn: any

              let linePosStart = widget.start

              for (let k = 0; k < lines.length; k++) {
                let line = lines[k]

                if (line.match(/^>\s*>\s*\[\!col\]\s*$/) || line.match(/^>\s*>\s*\[\!col\s*|\s*d+\s*\]\s*$/)) {
                  if (columnCount == i) {
                    // Текущая колонка начинается
                    inCurrentColumn = true
                  } else {
                    inCurrentColumn = false
                  }
                  columnCount++

                } else if (inCurrentColumn && line.match(/^>\s*>\s*/)) {

                  if (!currentColumn) {
                    currentColumn = {}
                    currentColumn.from = linePosStart
                    currentColumn.to = linePosStart + line.length
                    currentColumn.lines = [line]

                  } else {
                    currentColumn.to = linePosStart + line.length
                    currentColumn.lines.push(line)
                  }

                }




                linePosStart = linePosStart + line.length + 1

                
              }


              let columnContent = ""

              if (currentColumn) {
                columnContent = currentColumn.lines.map((l: string) => l.replace(/>\s*>\s?/, "")).join("\n")
              }

              let editorView = widget.editor.cm


              editorContainer.setAttribute("data-editor-start", currentColumn.from)
              createEditor(editorContainer, columnContent, editorView, currentColumn, plugin)


            }









  
            
          }
        }

      }
    }
  })
}



