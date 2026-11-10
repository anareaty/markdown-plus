import {
	Editor,
	MarkdownView,
	Plugin,
	requireApiVersion,
	Menu,
	setIcon,
	MenuItem,
} from 'obsidian';
import {
	MDP_DEFAULT_SETTINGS,
	MdPlusSettings,
	MdPlusSettingTab,
} from './settings';

import { registerCheckboxExtension } from './codeMirrorExtensions/checkboxExtension';
import { registerCheckboxEvents } from './events';
import { registerCustomListExtension } from './codeMirrorExtensions/listExtension';
import { registerCustomListsPostProcessor } from './mdPostProcessors/listPostProcessor';
import { registerNumberWidgetPostProcessor, registerTableCheckboxPostProcessor } from './mdPostProcessors/tablePostProcessor';
import { registerCalloutPostProcessor, saveAndUnloadCalloutColumnEditor } from './mdPostProcessors/calloutPostProcessor';
import { registerButtonExtension } from './codeMirrorExtensions/buttonExtension';
import { registerButtonPostProcessor } from './mdPostProcessors/buttonPostProcessor';
import { registerEmptyLineExtension } from './codeMirrorExtensions/emptyLineExtension';
import { registerHighlightsExtension } from './codeMirrorExtensions/highlightsExtension';
import { registerHighlightsPostProcessor } from './mdPostProcessors/highlightsPostProcessor';




export default class MdPlus extends Plugin {
	settings!: MdPlusSettings
	activeColumnEditor: any
	cachedEditorClass: any

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new MdPlusSettingTab(this.app, this));

		registerCustomListExtension(this)
		registerCheckboxExtension(this)
		registerButtonExtension(this)
		registerEmptyLineExtension(this)
		registerHighlightsExtension(this)

		registerCustomListsPostProcessor(this)
		registerTableCheckboxPostProcessor(this)
		registerButtonPostProcessor(this)
		registerCalloutPostProcessor(this)
		registerNumberWidgetPostProcessor(this)

		if (requireApiVersion("1.4.0")) {
			registerHighlightsPostProcessor(this)
		}

		

		this.updateAllLists()


		this.addCommand({
			id: "insert-checkbox",
			name: 'Вставить флажок',
			editorCallback: (editor, view) => {
				editor.replaceSelection("- [ ] ");
			}
		});

		this.addCommand({
			id: "custom-list-insert",
			name: 'Добавить символ списка в строку под курсором',
			editorCallback: (editor, view) => {
				let menu = new Menu();
				this.populateListInsertMenu(menu, editor);
				let cursor = editor.getCursor();
				if (!cursor)
				return;
				//@ts-ignore
				let coords = editor.coordsAtPos(cursor);
				menu.showAtPosition({ x: coords.left + 20, y: coords.top });
			}
		});



		

		this.addCommand({
			id: "custom-highlight",
			name: "Выделить цветом",
			icon: "highlighter",
			editorCallback: (editor, view) => {
				let menu = new Menu();

				this.populateHighlightsMenu(menu, editor);

				let cursor = editor.getCursor();
				if (!cursor)
				return;
				//@ts-ignore
				let coords = editor.coordsAtPos(cursor);
				menu.showAtPosition({ x: coords.left + 20, y: coords.top });
			}
		})

		






		registerCheckboxEvents(this);

		this.registerDomEvent(document, "click", (e) => {

			let target = e.target;

			if ((target instanceof HTMLElement || target instanceof SVGElement) && target.closest(".custom-list-icon")) {
				let iconSpan = target.closest(".custom-list-icon");
				let symbol = iconSpan == null ? void 0 : iconSpan.getAttribute("data-symbol");
				//@ts-ignore
				let search = this.app.internalPlugins.getEnabledPluginById("global-search");
				if (search) {
				search.openGlobalSearch('"- ' + symbol + ' "');
				}
			}




		
			
			if (this.activeColumnEditor && !this.activeColumnEditor.focused && target instanceof Element) {

				let {containerEl, cmView, columnData} = this.activeColumnEditor

				let isMenu = target.closest(".menu")
				let isModal = target.closest(".modal-container")

				if (!containerEl.contains(target) && !isMenu && !isModal) {
					saveAndUnloadCalloutColumnEditor(containerEl, cmView, columnData, this)
				} 
			}

			
		





		});














		

		

		const insertColumns = (editor: Editor, num: number) => {

			let startText = "\n> [!columns]"
			let colText = "\n>> [!col]\n>> Текст колонки"

			let text = startText

			for (let i = 1; i <= num; i++) {
				text = text + colText

				if (i < num) {
				text = text + "\n>"
				}
			}

			text = text + "\n\n"
			editor.replaceSelection(text)
		}

		



	


		this.registerEvent(
			this.app.workspace.on("editor-menu", (menu, editor, view) => {


				
				menu.addItem((item) => {
					item.setTitle("Вставить колонки")
					.setSection("md-plus")
					.setIcon("columns")
					//@ts-ignore
					let sub = item.setSubmenu()
					sub
					//@ts-ignore
					.addItem((subItem) => subItem
						.setTitle("2 колонки")
						.onClick(() => {
						insertColumns(editor, 2)
						})
					)
					//@ts-ignore
					.addItem((subItem) => subItem
						.setTitle("3 колонки")
						.onClick(() => {
						insertColumns(editor, 3)
						})
					)
					//@ts-ignore
					.addItem((subItem) => subItem
						.setTitle("4 колонки")
						.onClick(() => {
						insertColumns(editor, 4)
						})
					)

					return item
				})
				



				menu.addItem((item) => {
					item.setTitle("Вставить флажок")
					.setSection("md-plus")
					.setIcon("check-square")
					.onClick(async () => {
						editor.replaceSelection("- [ ] ");
					});
				});

				menu.addItem((i) => {
					i.setTitle("Добавить символ списка")
					.setSection("md-plus")
					.setIcon("help-circle")
					//@ts-ignore
					let sub = i.setSubmenu()
					this.populateListInsertMenu(sub, editor)
					return i
				});


				
				menu.addItem((i) => {
					i.setTitle("Выделить цветом")
					.setSection("md-plus")
					.setIcon("highlighter")
					//@ts-ignore
					let sub = i.setSubmenu()
					this.populateHighlightsMenu(sub, editor)
					return i
				})
				

				menu.addItem((item) => {
					item.setTitle("Добавить кнопку")
					.setSection("md-plus")
					.setIcon("plus-square")
					.onClick(async () => {
						editor.replaceSelection("`<<button>>` ")
					});
				});

			})
		)
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			MDP_DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<MdPlusSettings>,
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}






	async populateListInsertMenu(menu: Menu, editor: Editor) {
		let lists = this.settings.lists;
		let cursor = editor.getCursor()
		if (!cursor) return
		let line = editor.getLine(cursor.line)
		let symbol = ""

		for (let list of lists) {
			if (line.trimStart().startsWith("- " + list.symbol + " ")) {
				symbol = list.symbol
				break
			}
		}

		let checkboxMatch = line.trimStart().match(/^- (\[.\]) .*/)

		for (let list of lists) {
			menu.addItem(
				(item: MenuItem) => {
				item.setChecked(symbol == list.symbol)
				.setTitle(list.name || list.symbol)
				.setIcon(list.iconId);
				//@ts-ignore
				item.iconEl.setCssProps({
					"color": list.iconColor
				});
				//@ts-ignore
				item.dom.setCssProps({
					"color": list.color,
					"background-color": list.background
				});
				//@ts-ignore
				item.dom.classList.add("custom-list-menu-item");
				item.onClick(() => {
					let newLine = line
					if (checkboxMatch) {
						newLine = line.replace(checkboxMatch[1]!, list.symbol)
						cursor.ch = cursor.ch - 3 + list.symbol.length
					} else if (symbol) {
						newLine = line.replace(symbol, list.symbol)
						cursor.ch = cursor.ch - symbol.length + list.symbol.length
					} else if (line.trimStart().startsWith("- ")) {
						newLine = line.replace("- ", "- " + list.symbol + " ")
						cursor.ch = cursor.ch + 1 + list.symbol.length
					} else {
						newLine = "- " + list.symbol + " " + line
						cursor.ch = cursor.ch + 3 + list.symbol.length
					}
					editor.setLine(cursor.line, newLine)
					editor.setCursor(cursor)
				});
				return item;
				}
			)
		}

		if (!checkboxMatch) {
			menu.addItem(item => item
				.setTitle("Задача")
				.setIcon("circle")
				.onClick(() => {
					let newLine = line
					if (symbol) {
						newLine = line.replace(symbol, "[ ]")
						cursor.ch = cursor.ch - symbol.length + 3
					} else if (line.trimStart().startsWith("- ")) {
						newLine = line.replace("- ", "- [ ] ")
						cursor.ch = cursor.ch + 4
					} else {
						newLine = "- [ ] " + line
						cursor.ch = cursor.ch + 6
					}
					editor.setLine(cursor.line, newLine)
					editor.setCursor(cursor)
				})
			)
		}


		if (symbol || checkboxMatch || !line.trimStart().startsWith("- ")) {
			menu.addItem(item => item
				.setTitle("Список")
				.setIcon("dot")
				.onClick(() => {
					let newLine = line
					if (checkboxMatch) {
						newLine = line.replace(checkboxMatch[1] + " ", "")
						cursor.ch = cursor.ch - 4
					} else if (symbol) {
						newLine = line.replace(symbol + " ", "")
						cursor.ch = cursor.ch - symbol.length - 1
					} else {
						newLine = "- " + line
						cursor.ch = cursor.ch + 2
					}
					editor.setLine(cursor.line, newLine)
					editor.setCursor(cursor)
				})
			)
		}
		

		if (symbol || checkboxMatch || line.trimStart().startsWith("- ")) {
			menu.addItem(item => item
				.setTitle("ОЧИСТИТЬ")
				.setIcon("x")
				.onClick(() => {
					let newLine = line
					if (checkboxMatch) {
						newLine = line.replace("- " + checkboxMatch[1] + " ", "")
						cursor.ch = cursor.ch - 6
					} else if (symbol) {
						newLine = line.replace("- " + symbol + " ", "")
						cursor.ch = cursor.ch - symbol.length - 3
					} else if (line.trimStart().startsWith("- ")) {
						newLine = line.replace("- ", "")
						cursor.ch = cursor.ch - 2
					}
					editor.setLine(cursor.line, newLine)
					editor.setCursor(cursor)
				})
			)
		}
		
	}





	async populateHighlightsMenu(menu: Menu, editor: Editor) {

		let colors = [
		{
			title: "Красный",
			color: "red",
			symbol: "🔴"
		},
		{
			title: "Оранжевый",
			color: "orange",
			symbol: "🟠"
		},
		{
			title: "Жёлтый",
			color: "yellow",
			symbol: "🟡"
		},
		{
			title: "Зелёный",
			color: "green",
			symbol: "🟢"
		},
		{
			title: "Синий",
			color: "blue",
			symbol: "🔵"
		},
		{
			title: "Фиолетовый",
			color: "purple",
			symbol: "🟣"
		}
		]


		const stripHighlight = (line: string) => {
		if (line.trim().match(/^==.*==$/)) {
			line = line.trim().replace(/^(==[🔴🟠🟡🟢🔵🟣]?)(.*?)(==)$/u, "$2")
		}
		return line
		}

		const setHighlight = (symbol: string) => {

			let selection = editor.getSelection()
			let newSelection

			let selectionLines = selection.split("\n")

			if (selectionLines.length == 1) {
				selection = stripHighlight(selection)
				newSelection = "==" + symbol + selection + "=="
			} else {
				selectionLines = selectionLines.map(line => {
				if (line.trim() == "") return line
				line = stripHighlight(line)
				return "==" + symbol + line + "=="
				})
				newSelection = selectionLines.join("\n")
			}

			editor.replaceSelection(newSelection)
		}


		menu.addItem(item => {
		item.setTitle("По умолчанию")
		.setSection("md-plus")
		.setIcon("highlighter")
		//@ts-ignore
		item.dom.classList.add("custom-list-menu-item");
		item.onClick(async() => {
			setHighlight("")
		})
		})

		for (let colorObj of colors) {
		menu.addItem(item => {
			item.setTitle(colorObj.title)
			.setSection("md-plus")
			.setIcon("highlighter")

			//@ts-ignore
			item.dom.setCssProps({
			"background-color": "--highlight-background-red"
			});
			//@ts-ignore
			item.iconEl.setCssProps({
			"color": "var(--color-" + colorObj.color + ")",
			});
			//@ts-ignore
			item.dom.classList.add("custom-list-menu-item");
			//@ts-ignore
			item.dom.classList.add("hl-" + colorObj.color);

			item.onClick(async() => {
			setHighlight(colorObj.symbol)
			})
		})
		}


		menu.addItem(item => {
		item.setTitle("Очистить выделение")
		.setSection("md-plus")
		.setIcon("eraser")
		//@ts-ignore
		item.dom.classList.add("custom-list-menu-item");
		item.onClick(async() => {

			let selection = editor.getSelection()
			let newSelection
			let selectionLines = selection.split("\n")
	
			if (selectionLines.length == 1) {
			newSelection = stripHighlight(selection)
			} else {
			selectionLines = selectionLines.map(line => {
				if (line.trim() == "") return line
				line = stripHighlight(line)
				return line
			})
			newSelection = selectionLines.join("\n")
			}
			editor.replaceSelection(newSelection)
		})
		})



	}





	async updateListItem(list: HTMLElement) {
	
		let items = this.settings.lists
		let listContent = list.find("p")

		if (!listContent) {

			let firstNodeFound = false
			let childNodes = [...list.childNodes]
		
			for (let node of childNodes) {
				if (node instanceof HTMLElement && node.localName == "ul") {
				break
				}
		
				if (node instanceof HTMLElement && (node.classList?.contains("list-bullet") || node.classList?.contains("list-collapse-indicator"))) {
				continue
				}
		
				if (!firstNodeFound) {
				firstNodeFound = true
				listContent = document.createElement("p");
				node.before(listContent)
				} 
				
				if (listContent) {
				listContent.append(node)
				}
			}
			}
		
		if (listContent instanceof HTMLElement) {
			let oldIcon = listContent.find(".custom-list-icon")
			if (oldIcon) {
				let symbol = oldIcon.getAttribute("data-symbol")
				oldIcon.remove()
				listContent.prepend(symbol + " ")
			}

			listContent.setCssProps({
				"color": "",
				"background-color": "",
			})

			listContent.className = ""
			list.removeAttribute("data-cls")
			
			let listTextEl = listContent.firstChild
			if (listTextEl?.nodeType != Node.TEXT_NODE) return

			if (listTextEl) {
				let listText = listTextEl.textContent?.trimStart()
				if (!listText) return

				for (let listObj of items) {
					let symbol = listObj.symbol
					if (!symbol) continue

					if (listText.startsWith(symbol + " ")) {

						let iconSpan = document.createElement('span');
						setIcon(iconSpan, listObj.iconId)
						iconSpan.classList.add("custom-list-icon")
						iconSpan.setCssProps({
							"color": listObj.iconColor
						})
						iconSpan.setAttribute("data-symbol", symbol)
						listContent.prepend(iconSpan)
						

						listTextEl.textContent = listTextEl.textContent?.replace(symbol + " ", " ") || ""

						listContent.classList.add("custom-list-line")
						listContent.classList.add("custom-list-line-reading")
						

						if (listObj.customClass) {
							listContent.classList.add(listObj.customClass)
							list.setAttribute("data-cls", listObj.customClass)
						}


						if (listObj.background) {
							listContent.classList.add("bg-colored")
						}

						listContent.setCssProps({
							"color": listObj.color,
							"background-color": listObj.background,
						})

						
						break
					}
				}
			}
		}
	}

	async updateAllLists() {
		
		let items = document.querySelectorAll("li:not(.task-list-item")

		
		for (let item of items) {
			
			if (item instanceof HTMLElement) {
				this.updateListItem(item)
			}
		}
		

		this.app.workspace.iterateAllLeaves((leaf) => {
			let view = leaf.view
			if (view instanceof MarkdownView) {	
				let state = view.getState()
				if (state.mode == "source") {
					// @ts-expect-error, not typed
					const editorView = view.editor.cm as EditorView;
					editorView.dispatch({
						userEvent: "updateCustomLists"
					})
				}
			}
		})
	}
}


