import { App, PluginSettingTab, Setting, setIcon } from 'obsidian';

import { SvgSuggestModal } from './svgSuggestModal';
import MdPlus from './main';
import { createColorMenu } from './menus/colorMenu';



export interface MdPlusSettings {
    lists: any[]
    editorMenu: boolean
}

export const MDP_DEFAULT_SETTINGS: MdPlusSettings = {
	lists: [],
    editorMenu: true
}


export class MdPlusSettingTab extends PluginSettingTab {
	plugin: MdPlus;

	constructor(app: App, plugin: MdPlus) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

        let lists = this.plugin.settings.lists
        lists.forEach((listObj, index) =>  {

            let listSetting = new Setting(containerEl)
            listSetting
            .addButton(btn => btn
                .setTooltip("Выбрать иконку")
                .setIcon("image")
                .onClick(() => {
                    new SvgSuggestModal(this.plugin, listObj, this).open()
                })
            )

            .addButton(btn => btn
                .setTooltip("Цвет иконки")
                .setIcon("paintbrush")
                .onClick((e) => {
                    createColorMenu(this.plugin, e, listObj, "iconColor", this)
                })
            )

            .addButton(btn => btn
                .setTooltip("Цвет текста")
                .setIcon("type")
                .onClick((e) => {
                    createColorMenu(this.plugin, e, listObj, "color", this)
                })
            )

            .addButton(btn => btn
                .setTooltip("Цвет фона")
                .setIcon("paint-bucket")
                .onClick((e) => {
                    createColorMenu(this.plugin, e, listObj, "background", this)
                })
            )


            
        
            


            listSetting.settingEl.classList.add("custom-list-setting")
            let customListIcon = listSetting.infoEl.createEl("span")
            customListIcon.classList.add("custom-list-line")
            customListIcon.classList.add("custom-list-line-setting")

            if (listObj.customClass) {
                customListIcon.classList.add(listObj.customClass)
            }
            
            customListIcon.setCssProps({
                "color": listObj.color,
                "background-color": listObj.background,
            })
            let symbol = listObj.symbol
            if (!symbol) symbol = " "


            if (listObj.iconId) {

                let iconSpan = document.createElement('span');
                setIcon(iconSpan, listObj.iconId)
                iconSpan.classList.add("custom-list-icon")
                iconSpan.setCssProps({
                    "color": listObj.iconColor
                })

                customListIcon.append(iconSpan)
                
                
            } 

            let listTitle = listObj.name || listObj.symbol

            customListIcon.append(" " + listTitle)

            
            if (index < lists.length - 1) {
                listSetting
                .addButton(btn => btn
                    .setIcon("arrow-down")
                    .onClick(() => {
                        let prevList = lists[index+1]
                        lists[index+1] = listObj
                        lists[index] = prevList
                        this.plugin.saveSettings()
                        this.display()
                    })
                )
            }

            if (index > 0) {
                listSetting
                .addButton(btn => btn
                    .setIcon("arrow-up")
                    .onClick(() => {
                        let prevList = lists[index-1]
                        lists[index-1] = listObj
                        lists[index] = prevList
                        this.plugin.saveSettings()
                        this.display()
                    })
                )
            }

            



            
            listSetting
            .addButton(btn => btn
                .setIcon("x")
                .onClick(() => {
                    this.plugin.settings.lists = this.plugin.settings.lists.filter(c => c.symbol != listObj.symbol)
                    this.plugin.saveSettings()
                    this.display()
                    this.plugin.updateAllLists()
                })
            )

            


            let listTextSetting = new Setting(containerEl)

            listTextSetting
            .addText(text => {
                text.setPlaceholder("Символ")
                .setValue(listObj.symbol)
                .onChange((value) => {
                    let sameObj = this.plugin.settings.lists.find(c => c.symbol == value)
                    if (sameObj) {} else {
                        listObj.symbol = value
                        this.plugin.saveSettings()
                        this.plugin.updateAllLists()
                    }
                })  
                
                text.inputEl.onblur = () => {
                    this.display()
                }
            })


            .addText(text => {
                text.setPlaceholder("Название")
                .setValue(listObj.name || "")
                .onChange((value) => {
                    listObj.name = value
                    this.plugin.saveSettings()
                })  
                
                text.inputEl.onblur = () => {
                    this.display()
                }
            })


            .addText(text => {
                text.setPlaceholder("Класс")
                .setValue(listObj.customClass)
                .onChange((value) => {
                    listObj.customClass = value
                    this.plugin.saveSettings()
                    this.plugin.updateAllLists()
                })  
                
                text.inputEl.onblur = () => {
                    this.display()
                }
            })

            
        })

		new Setting(containerEl)
			.setName('Добавить элемент списка')
            .addButton(btn => btn
                .setIcon("plus")
                .onClick(() => {
                    let emptyObj = this.plugin.settings.lists.find(c => c.symbol == "")
                    if (!emptyObj) {
                        let listObj = {
                            symbol: "",
                            name: "",
                            iconId: "",
                            iconColor: "",
                            color: "",
                            background: "",
                            customClass: ""
                        }
                        this.plugin.settings.lists.push(listObj)
                        this.plugin.saveSettings()
                        this.display()
                    }
                    
                })
            )

        

        
			
	}
}


