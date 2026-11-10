
import { TFile } from "obsidian"
import { createCheckboxMenu, tableCheckboxClickEvent, updateNumberWidget } from "../events"
import MdPlus from "../main"





const tableCheckboxClickReading = (context: any, checkbox: HTMLInputElement, splitPartsIndexes: number[], plugin: MdPlus) => {
    
    const getNewText = (text: string, ind: number) => {

        let lines = text.split("\n")
        let splitParts = []
        let partsCount = 0

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i]!
            let taskMatchInLine = line.match(/(^>*\s*\|.*?)(?<=\|\s*)- \[.\](?=[^|\n]*\|)/)

            if (taskMatchInLine) {
                let cells = line.split("|")

                for (let k = 0; k < cells.length; k++) {
                    let cell = cells[k]!
                    let cellTaskMatch = cell.match(/^(\s*- \[)(.)(\])/)

                    if (cellTaskMatch) {
                        splitPartsIndexes.push(partsCount)
                        splitParts.push(cell)
                        partsCount++
                    } else {
                        splitParts.push(cell)
                        partsCount++
                    }

                    if (k < cells.length - 1) {
                        splitParts.push("|")
                        partsCount++
                    }
                }
            } else {
                splitParts.push(line)
                partsCount++
            }

            if (i < lines.length - 1) {
                splitParts.push("\n")
                partsCount++
            }
        }

        let splitPartInd = splitPartsIndexes[ind]!
        let splitPart = splitParts[splitPartInd]!
        let cellTaskMatch = splitPart.match(/^(\s*- \[)(.)(\])/)!
        let status = cellTaskMatch[2]

        if (status == " ") {
            splitParts[splitPartInd] = splitPart.replace("- [ ]", "- [x]")
        } else {
            splitParts[splitPartInd] = splitPart.replace(/- \[.\]/, "- [ ]")
        }

        let newText = splitParts.join("")
        return newText
    }

    let container = context.containerEl

    let tableCheckboxes = container.querySelectorAll(
        "td > .task-list-item-checkbox.table-checkbox"
    )

    for (let ind = 0; ind < tableCheckboxes.length; ind++) {
        let ch = tableCheckboxes[ind]

        if (ch === checkbox) {

            if (container.classList.contains("cm-callout")) {
                //@ts-ignore
                const calloutWidget = (container.cmTile?.widget ?? container.cmView?.widget)

                if (calloutWidget) {
                    let text = calloutWidget.text
                    let newText = getNewText(text, ind)
                    let editorView = calloutWidget.editor.cm

                    let transaction = editorView.state.update({
                    changes: [
                        { from: calloutWidget.start, to: calloutWidget.end },
                        { from: calloutWidget.start, insert: newText }
                    ]
                    });
                    editorView.dispatch(transaction)
                }
            } else {
                let file = plugin.app.vault.getAbstractFileByPath(context.sourcePath) as TFile
                plugin.app.vault.process(file, (text) => {
                    let newText = getNewText(text, ind)
                    return newText
                })
            }
        }
    }
}

















const numberWidgetClickReading = (context: any, numberWidget: HTMLElement, splitPartsIndexes: number[], plugin: MdPlus) => {
    

    
    const getNewText = (text: string, ind: number) => {

        let lines = text.split("\n")
        let splitParts = []
        let partsCount = 0

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i]!
            let taskMatchInLine = line.match(/(^>*\s*\|.*?)(?<=\|\s*)\{\/*\d+\/*\}(?=[^|\n]*\|)/)

            if (taskMatchInLine) {
                let cells = line.split("|")

                for (let k = 0; k < cells.length; k++) {
                    let cell = cells[k]!
                    let cellTaskMatch = cell.match(/^(\s*\{)(\/*\d+\/*)(\})/)

                    if (cellTaskMatch) {
                        splitPartsIndexes.push(partsCount)
                        splitParts.push(cell)
                        partsCount++
                    } else {
                        splitParts.push(cell)
                        partsCount++
                    }

                    if (k < cells.length - 1) {
                        splitParts.push("|")
                        partsCount++
                    }
                }
            } else {
                splitParts.push(line)
                partsCount++
            }

            if (i < lines.length - 1) {
                splitParts.push("\n")
                partsCount++
            }
        }

        let splitPartInd = splitPartsIndexes[ind]!
        let splitPart = splitParts[splitPartInd]!

        
        let cellTaskMatch = splitPart.match(/^(\s*\{)(\/*\d+\/*)(\})/)!

        let num = cellTaskMatch[2]

        if (num?.match(/^\d+$/)) {
            splitParts[splitPartInd] = splitPart.replace(num, "/" + num + "/")
        } else if (num?.match(/^\/\d+\/$/)) {
            splitParts[splitPartInd] = splitPart.replace(/(\/)(\d+)(\/)/, "$2")
        }

        let newText = splitParts.join("")
        return newText
    }

    let container = context.containerEl

    let numberWidgets = container.querySelectorAll(".mdp-number-widget")



    for (let ind = 0; ind < numberWidgets.length; ind++) {
        let nw = numberWidgets[ind]

        if (nw === numberWidget) {

            if (container.classList.contains("cm-callout")) {
                //@ts-ignore
                const calloutWidget = (container.cmTile?.widget ?? container.cmView?.widget)

                if (calloutWidget) {
                    let text = calloutWidget.text
                    let newText = getNewText(text, ind)
                    let editorView = calloutWidget.editor.cm

                    let transaction = editorView.state.update({
                    changes: [
                        { from: calloutWidget.start, to: calloutWidget.end },
                        { from: calloutWidget.start, insert: newText }
                    ]
                    });
                    editorView.dispatch(transaction)
                }
            } else {
                let file = plugin.app.vault.getAbstractFileByPath(context.sourcePath) as TFile
                plugin.app.vault.process(file, (text) => {
                    let newText = getNewText(text, ind)
                    return newText
                })
            }
        }
    }
}

















const renderTableCheckbox = (text: string, element: HTMLElement, plugin: MdPlus) => {

    let symbols = [" ", "x", ">", "/", "-", "~"]
    let checkbox: HTMLInputElement | undefined

    for (let symbol of symbols) {
        if (text.startsWith("- [" + symbol + "]")) {
            checkbox = document.createElement("input")
            checkbox.type = "checkbox"
            checkbox.classList.add("task-list-item-checkbox")
            checkbox.classList.add("table-checkbox")
            checkbox.setAttribute("data-task", symbol)
            checkbox.checked = true
            
            if (symbol == " ") {
                checkbox.checked = false
            }
            
            text = text.replace("- [" + symbol + "]", "")
            element.empty()
            element.append(checkbox)
            element.append(text)

            checkbox.onclick = (e) => {
                e.preventDefault()
                e.stopPropagation()
                tableCheckboxClickEvent(checkbox!, plugin)
            }

            checkbox.onpointerdown = (e) => {
              e.stopPropagation()
            };

            checkbox.oncontextmenu = (e) => {
                e.preventDefault()
                e.stopPropagation()
                let cmTable = checkbox!.closest(".cm-table-widget")
                if (cmTable) {
                    createCheckboxMenu(e as PointerEvent, checkbox!, plugin, "table")
                }
            }

            break
        }
    }
    return checkbox
}





export const registerTableCheckboxPostProcessor = (plugin: MdPlus) => {
    plugin.registerMarkdownPostProcessor((element, context: any) => {

      if (element.classList.contains("table-cell-wrapper")) {
        let text = element.textContent
        renderTableCheckbox(text, element, plugin)

      } else {
        let tableCells = element.findAll("td")
        let splitPartsIndexes: number[] = []

        for (let td of tableCells) {
          let text = td.textContent
          let checkbox = renderTableCheckbox(text, td, plugin)

            if (checkbox) {
                checkbox.onclick = async (e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    tableCheckboxClickReading(context, checkbox, splitPartsIndexes, plugin)
                }
            }
        }
      }
    })
}







const renderNumberWidget = (text: string, element: HTMLElement, plugin: MdPlus) => {

    let numberMatch = text.match(/^(\{)(\d+)(\})$/)
    let colored = false
    if (!numberMatch) {
        numberMatch = text.match(/^(\{\/)(\d+)(\/\})$/)
        colored = true
    }
    

    if (numberMatch) {
        let numString = numberMatch[2]!
        let numberWidget = document.createElement("span")
        numberWidget.classList.add("mdp-number-widget")

        if (colored) {
            numberWidget.classList.add("mdp-number-widget-colored")
        }

        numberWidget.append(numString)
        element.empty()
        element.append(numberWidget)

        numberWidget.onclick = (e) => {
            e.preventDefault()
            e.stopPropagation()
            updateNumberWidget(numString, colored, numberWidget)
        }
        numberWidget.onpointerdown = (e) => {
            e.stopPropagation()
        }

        return numberWidget

        
    }

    return

}


export const registerNumberWidgetPostProcessor = (plugin: MdPlus) => {
    plugin.registerMarkdownPostProcessor((element, context) => {

      if (element.classList.contains("table-cell-wrapper")) {
        let text = element.textContent
        renderNumberWidget(text, element, plugin)

      } else {
        let tableCells = element.findAll("td")
        let splitPartsIndexes: number[] = []

        for (let td of tableCells) {
          let text = td.textContent
          let numberWidget = renderNumberWidget(text, td, plugin)
          if (numberWidget) {
            numberWidget.onclick = (e) => {
                e.preventDefault()
                e.stopPropagation()
                numberWidgetClickReading(context, numberWidget, splitPartsIndexes, plugin)
            }
          }
          
          
        }
      }
    })
}