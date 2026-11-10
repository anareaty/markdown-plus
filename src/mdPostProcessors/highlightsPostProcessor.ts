
import MdPlus from "../main";

export const registerHighlightsPostProcessor = (plugin: MdPlus) => {
  plugin.registerMarkdownPostProcessor((el, ctx) => {
    let items = el.findAll("mark");
    for (let mark of items) {

      let text = mark.textContent
      let hlType
      let hlSymbol = ""

      if (text.match(/^🔴.*$/)) {
        hlType = "hl-red"
        hlSymbol = "🔴"
      } else if (text.match(/^🟠.*$/)) {
        hlType = "hl-orange"
        hlSymbol = "🟠"
      } else if (text.match(/^🟡.*$/)) {
        hlType = "hl-yellow"
        hlSymbol = "🟡"
      } else if (text.match(/^🟢.*$/)) {
        hlType = "hl-green"
        hlSymbol = "🟢"
      } else if (text.match(/^🔵.*$/)) {
        hlType = "hl-blue"
        hlSymbol = "🔵"
      } else if (text.match(/^🟣.*$/)) {
        hlType = "hl-purple"
        hlSymbol = "🟣"
      } 

      if (hlType) {
        mark.classList.add(hlType)
        if (mark.firstChild && "data" in mark.firstChild && typeof mark.firstChild.data == "string") {
            mark.firstChild.data = mark.firstChild.data.slice(hlSymbol.length)
        }
      }
    }
  });
}