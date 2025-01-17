import html from "./study_settings.html"
import {Studies} from "../js/main_classes/studies";
import {Lang} from "../js/main_classes/lang";
import {FILE_ADMIN} from "../js/variables/urls";
import ko from "knockout";
import {Site} from "../js/main_classes/site";

export function ViewModel(page) {
	let self = this;
	let id = Site.valueIndex.id;
	this.html = html;
	this.promiseBundle = [
		Studies.init(page),
		page.loader.loadRequest(FILE_ADMIN + "?type=is_frozen&study_id="+id).then(function(frozen) {
			self.locked_enabled(frozen);
		})
	];
	page.title(Lang.get("study_settings"));
	this.locked_enabled = ko.observable(false);
	
	
	this.preInit = function({id}, studies) {
		this.dataObj = studies[id];
		
		this.locked_enabled.subscribe(function() {
			page.loader.loadRequest(FILE_ADMIN + "?type=freeze_study" + (self.locked_enabled() ? "&frozen" : "") + "&study_id="+id).then(function(frozen) {
				self.locked_enabled(frozen);
				page.loader.info(frozen ? Lang.get("info_study_frozen") : Lang.get("info_study_unfrozen"));
			});
		});
	};
	
}