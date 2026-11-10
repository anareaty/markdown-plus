import { SuggestModal } from "obsidian"
import MdPlus from "../main"
import { EditorView } from '@codemirror/view';


export const SelectCommandModal = class extends SuggestModal<string> {

    from: number
    to: number
    buttonId: string
    buttonName: string
    buttonIcon: string | undefined
    view: EditorView
    plugin: MdPlus


  constructor(from: number, to: number, buttonId: string, buttonName: string, buttonIcon: string | undefined, view: EditorView, plugin: MdPlus) {
    super(plugin.app)
    this.to = to
    this.from = from
    this.buttonId = buttonId
    this.buttonName = buttonName
    this.buttonIcon = buttonIcon
    this.view = view
    this.plugin = plugin
  }

  getSuggestions(query: string) {
    //@ts-ignore
    return this.plugin.app.commands.listCommands().filter(c => c.name.toLowerCase().includes(query.toLowerCase()))
  }


  renderSuggestion(command: any, el: Element) {
    el.createEl('div', { text: command.name });
  }


  onChooseSuggestion(command: any) {

    let commandId = command.id
    let commandIcon = command.icon
    //@ts-ignore
    let currentCommandName = this.plugin.app.commands.commands[this.buttonId]?.name
    //@ts-ignore
    let currentCommandIcon = this.plugin.app.commands.commands[this.buttonId]?.icon

    let buttonNameText = command.name

    if (this.buttonId != this.buttonName && currentCommandName != this.buttonName) {
      buttonNameText = this.buttonName
    } 

    let buttonIconText = ""

    if (commandIcon) {
      buttonIconText = ":" + commandIcon + ":"
    }

    if (this.buttonIcon && this.buttonIcon != currentCommandIcon) {
      buttonIconText = ":" + this.buttonIcon + ":"
    }



    let buttonText = commandId + "|" + buttonIconText + buttonNameText

    let transaction = this.view.state.update({
      changes: [
        { from: this.from + 2, to: this.to - 2 },
        { from: this.from + 2, insert: buttonText }
      ]
    });
    this.view.dispatch(transaction)
  }
}