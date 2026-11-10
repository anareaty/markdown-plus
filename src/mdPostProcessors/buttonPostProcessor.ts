import { setIcon } from "obsidian"
import MdPlus from "../main"




export const registerButtonPostProcessor = (plugin: MdPlus) => {
  plugin.registerMarkdownPostProcessor((el, ctx) => {
    let items = el.findAll("code")

    for (let codeEl of items) {
      let codeText = codeEl.textContent
      let buttonMatch = codeText.match(/(<<)(.+)(>>)/)
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

        let buttonEl = document.createElement("button")
        
        buttonEl.classList.add("inline-button")

        if (buttonIcon) {
          setIcon(buttonEl, buttonIcon)
          if (buttonName) {
            buttonEl.classList.add("has-icon-with-text")
          }
        }

        buttonEl.append(buttonName)



        buttonEl.onclick = (e) => {
          e.stopPropagation()
          //@ts-ignore
          plugin.app.commands.executeCommandById(buttonId)
        }


        codeEl.replaceWith(buttonEl)



      }


    }
  })
}