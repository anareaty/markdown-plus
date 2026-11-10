import MdPlus from "../main";



export const registerCustomListsPostProcessor = (plugin: MdPlus) => {
    plugin.registerMarkdownPostProcessor((el, ctx) => {
        let items = el.findAll("li:not(.task-list-item)")
        for (let item of items) {
          plugin.updateListItem(item)
        }
    });
}



