import html from "./date_range.html"
import {Lang} from "../js/main_classes/lang";
import {Studies} from "../js/main_classes/studies";

export function ViewModel(page) {
	this.html = html;
	page.title(Lang.get("edit_dateRange"));
	this.promiseBundle = [Studies.init(page)];
	
	this.preInit = function({id}, studies) {
		this.dataObj = studies[id];
	};
}