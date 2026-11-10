import { getIcon, getIconIds, SuggestModal } from "obsidian";
import MdPlus from "../main";



export const SvgSuggestModal = class extends SuggestModal<string> {
    iconIds: string[]
    plugin: MdPlus
    selectCallback: (id: string) => void

  constructor(plugin: MdPlus, selectCallback: (id: string) => void) {
    super(plugin.app);
    this.selectCallback = selectCallback
    this.iconIds = getIconIds();
    this.iconIds.unshift("");
    this.plugin = plugin;
  }
  getSuggestions(query: string) {
    return this.iconIds.filter((val) => {
      return val.toLowerCase().includes(query.toLowerCase());
    });
  }
  async renderSuggestion(id: string, el: Element) {
    let svg = getIcon(id) || "";
    el.append(svg);
    el.classList.add("image-suggestion-item");
    el.classList.add("svg-icon");
  }
  onChooseSuggestion(id: string) {
    this.selectCallback(id)
  }
}



