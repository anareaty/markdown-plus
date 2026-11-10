import { SuggestModal, TFile, getIcon, getIconIds, SettingTab } from "obsidian";
import MdPlus from "./main";



export class SvgSuggestModal extends SuggestModal<string> {
    iconIds: string[]
    listObj: any
    plugin: MdPlus
    settingTab: SettingTab

    constructor(plugin: MdPlus, listObj: any, settingTab: SettingTab) {
        super(plugin.app)
        this.listObj = listObj
        this.iconIds = getIconIds();
        this.iconIds.unshift("")
        this.plugin = plugin
        this.settingTab = settingTab
    }

    getSuggestions(query: string): string[] {
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
        if (id || id === "") {
            this.listObj.iconId = id
            this.plugin.saveSettings()
            this.settingTab.display()
            this.plugin.updateAllLists()
        }
    }
}