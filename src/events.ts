import { Editor, Menu, Platform } from "obsidian";
import MdPlus from "./main";
import { TableEditor } from "@obsidian-typings/obsidian-public-latest";




const escapeRegExp = (str: string) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}




const updateLiveTableCellContent = (target: HTMLElement, replaceFunc: (text: string) => string) => {

  let table = target.closest(".cm-table-widget")
  if (table) {
    //@ts-ignore
    let tableWidget = (table.cmTile?.widget ?? table.cmView?.widget) as TableEditor

    if (tableWidget) {
      let cellChildMap = tableWidget.cellChildMap     

      for (let cellChild of cellChildMap) {
        let cellObj = cellChild[0]
        let cell = cellObj.contentEl

        if (cell.contains(target)) {
          let newText = replaceFunc(cellObj.text)

          let editor = tableWidget.editor as unknown as Editor

          console.log(editor)
          tableWidget.updateCell(cellObj, newText)
          tableWidget.dispatchTable()

          editor.focus()
        }
      }
    }
  }
}







const updateTableCheckbox = (target: HTMLElement, newSymbol: string) => {
  let symbol = target.getAttribute("data-task")

  const replaceFunc = (text: string) => {
    let re = new RegExp(`^- \\[${symbol}\\]`)
    return text.replace(re, "- [" + newSymbol + "]")
  }

  updateLiveTableCellContent(target, replaceFunc)
}




const updateListCheckbox = (target: HTMLElement, newSymbol: string, plugin: MdPlus) => {
    let wrapper = target.closest(".custom-checkbox")
    
    if(!wrapper) return
    let editor = plugin.app.workspace.activeEditor?.editor

    if (target.closest(".column-editor-container")) {
      editor = plugin.activeColumnEditor?.editor
    }

    if (!editor) return
    let checkboxStart = wrapper.getAttribute("data-checkbox-start")
    let checkboxStartPos = editor.offsetToPos(Number(checkboxStart))
    let symbol = target.getAttribute("data-task")
    let checkboxLineText = editor.getLine(checkboxStartPos.line)
    checkboxLineText = checkboxLineText.replace("- [" + symbol + "]", "- [" + newSymbol + "]")
    editor.setLine(checkboxStartPos.line , checkboxLineText)
}



export const tableCheckboxClickEvent = (target: HTMLElement, plugin: MdPlus) => {
    let symbol = target.getAttribute("data-task")
    if (symbol == " ") {
        updateTableCheckbox(target, "x")
    } else {
        updateTableCheckbox(target, " ")
    }
        
}



const checkboxUpdateFunc = (target: HTMLElement, newSymbol: string, plugin: MdPlus, type: string) => {
    if (type == "table") {
        updateTableCheckbox(target, newSymbol)
    } else {
        updateListCheckbox(target, newSymbol, plugin)
    }
}



export const createCheckboxMenu = (e: PointerEvent, target: HTMLElement, plugin: MdPlus, type: string) => {

    let checkboxMenu = new Menu()
    //@ts-ignore
    checkboxMenu.dom?.classList.add("checkbox-menu")

    checkboxMenu.addItem(item => item
      .setTitle("Задача")
      .setIcon("circle")
      .onClick(() => {
        checkboxUpdateFunc(target, " ", plugin, type)
      })
    )
    
    checkboxMenu.addItem(item => item
      .setTitle("Выполнено")
      .setIcon("check-circle-2")
      .onClick(() => {
        checkboxUpdateFunc(target, "x", plugin, type)
      })
    )
    
    checkboxMenu.addItem(item => item
      .setTitle("Начато")
      .setIcon("circle-slash")
      .onClick(() => {
        checkboxUpdateFunc(target, "/", plugin, type)
      })
    )

    checkboxMenu.addItem(item => item
      .setTitle("Перенесено")
      .setIcon("chevron-right-circle")
      .onClick(() => {
        checkboxUpdateFunc(target, ">", plugin, type)
      })
    )
    
    checkboxMenu.addItem(item => item
      .setTitle("Отменено")
      .setIcon("minus")
      .onClick(() => {
        checkboxUpdateFunc(target, "-", plugin, type)
      })
    )
    
    checkboxMenu.addItem(item => item
      .setTitle("Провалено")
      .setIcon("x-circle")
      .onClick(() => {
        checkboxUpdateFunc(target, "~", plugin, type)
      })
    )

    checkboxMenu.showAtMouseEvent(e)
}



const contextMenuEvent = (e: PointerEvent, plugin: MdPlus) => {
  let target = e.target;
  if (target instanceof HTMLElement && target.classList.contains("task-list-item-checkbox")) {
    let cmLine = target.closest(".HyperMD-list-line");
    if (cmLine) {
      createCheckboxMenu(e, target, plugin, "list");
    }
  }
}


export const registerCheckboxEvents = (plugin: MdPlus) => {

    if (Platform.isDesktop) {
      plugin.registerDomEvent(document, "mousedown", (e) => {
        if (e.button == 2) {
          contextMenuEvent(e as PointerEvent, plugin)
        }
      });
    } else {
      plugin.registerDomEvent(document, "contextmenu", (e) => {
        contextMenuEvent(e as PointerEvent, plugin)
      });
    }


    plugin.registerEvent(plugin.app.workspace.on("editor-menu", (menu, editor, info) => {
        //@ts-ignore
        menu.dom?.classList.add("editor-menu")
    }))
}





export const updateNumberWidget = (numString: string, colored: boolean, target: HTMLElement) => {

  let oldText = "{" + numString + "}"
  let newText = "{/" + numString + "/}"

  if (colored) {
    oldText = "{/" + numString + "/}"
    newText = "{" + numString + "}"
  }

  const replaceFunc = (text: string) => {
    let re = new RegExp(`${escapeRegExp(oldText)}`)
    return text.replace(re, newText)
  }

  updateLiveTableCellContent(target, replaceFunc)    
}