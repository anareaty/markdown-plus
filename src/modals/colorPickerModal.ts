import { Modal, Setting, SettingTab } from "obsidian";
import MdPlus from "../main";


export class ColorPickerModal extends Modal {
    plugin: MdPlus
    listObj: any
    type: string
    settingTab: SettingTab

    constructor(plugin: MdPlus, listObj: any, type: string, settingTab: SettingTab) {
        super(plugin.app);
        this.plugin = plugin
        this.listObj = listObj
        this.type = type
        this.settingTab = settingTab
    }
    
    onOpen() {
        this.modalEl.classList.add("color-picker-modal")
        const {contentEl} = this

        new Setting(contentEl)
        .addColorPicker(color => {
            if (this.listObj[this.type] && this.listObj[this.type].startsWith("#")) {
                color.setValue(this.listObj[this.type])
            }
            
            color.onChange((value) => {
                let listColor = color.getValue()
                
                this.listObj[this.type] = listColor
                this.plugin.saveSettings()
                this.plugin.updateAllLists()
                this.settingTab.display()
            })
        })
    }

    onClose() {
        const {contentEl} = this
        contentEl.empty()
    } 
}