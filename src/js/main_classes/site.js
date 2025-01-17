import * as Basics from "../helpers/basics.js";
import {Page} from "./page.js";
import ko from 'knockout';
import dashEl from '../../widgets/site_dash_element.html';
import titleRow from '../../widgets/site_title_row.html';
import {bindEvent, close_on_clickOutside, createElement} from "../helpers/basics.js";
import {Studies} from "./studies";
import {Admin} from "./admin";
import {FILE_SAVE_ACCESS, FILE_SAVE_DATASET} from "../variables/urls";
import langIndex from "../locales.json";
import {Lang} from "./lang";
import {TabBar} from "../../widgets/tab_bar";
import tab_box from "../../widgets/tab_bar.html";

const PAGE_MIN_WIDTH = 650;

export const Site = {
	serverVersion: -1,
	_loader: null,
	serverName: "",
	el_pages: null,
	el_header: null,
	el_navi: null,
	el_saveBtn: null,
	el_publishBtn: null,
	el_backBtn: null,
	pages: [],
	valueIndex: {},
	page_width_percent: 100,
	override_page_width: false,
	startHash: "",
	
	studies: Studies,
	admin: Admin,
	
	init: function(serverName, startHash, serverVersion, server_accessKey) {
		this.serverVersion = serverVersion;
		
		this.serverName = serverName;
		this.startHash = startHash;
		Studies.accessKey(server_accessKey);
		
		this.el_pages = document.getElementById("el_pages");
		this.el_header = document.getElementById("current_stateInfo_el");
		this.el_navi = document.getElementById("nav_menu");
		this.el_naviContent = document.getElementById("nav_content");
		this.el_saveBtn = document.getElementById("saveBox");
		this.el_publishBtn = document.getElementById("publishBox");
		this.el_backBtn = document.getElementById("btn_up");
		
		this.init_knockout();
		
		document.getElementById("header_serverName").innerText = serverName;
		document.getElementById("legalLink").innerText = Lang.get("impressum");
		
		//clean el_pages:
		this.el_pages.innerHTML = "";
		
		
		//events:
		
		Basics.bindEvent(this.el_backBtn, "click", this.go_back.bind(this));
		
		window.onhashchange = this._onhashchange.bind(this);
		this._onhashchange();
		
		Basics.bindEvent(document.getElementById("pageBox_width"), "change", function(e) {
			let p = e.target.value;
			this.el_pages.style.width = p+"%";
			this.page_width_percent = p;
			this.override_page_width = true;
			
			this.position_page();
		}.bind(this));
		
		Basics.bindEvent(window, "resize", this.update_page_dimensions.bind(this));
		this.update_page_dimensions();
		
		
		//Language selector:
		
		let createLine = function(code, hash) {
			let entry = langIndex[code];
			let a = createElement("a", false, {
				className: "line verticalPadding nowrap"
			});
			if(hash)
				a.href = "?lang=" + code + hash;
			a.appendChild(createElement("span", false, {innerHTML: entry.flag}));
			a.appendChild(createElement("span", false, {innerText: entry.name, className: "desc"}));
			return a;
		}
		
		let el = document.getElementById("lang_chooser");
		let currentEl = createLine(Lang.code);
		el.appendChild(currentEl);
		
		
		bindEvent(currentEl, "click", function() {
			let box = createElement("div", false, {className: "dropdown"});
			let hash = this.get_hash(this.get_pagesCount());
			
			for(let code in langIndex) {
				if(!langIndex.hasOwnProperty(code))
					continue;
				let a = createLine(code, hash);
				box.appendChild(a);
			}
			el.appendChild(box);
			close_on_clickOutside(box);
		}.bind(this));
	},
	
	init_knockout: function() {
		let self = this;
		ko.components.register('dash-el', {
			viewModel: function(params) {
				this.data = params.data;
				this.img = params.img;
				this.title = params.title;
				this.msg = params.msg;
				this.link_title = params.link_title;
				this.link_navi = params.link_navi;
			},
			template: dashEl
		});
		ko.components.register('title-row', {
			viewModel: function(params) {
				this.title = params.title;
				this.data = params.data;
				this.parent = params.parent;
			},
			template: titleRow
		});
		ko.components.register('tab-bar', {
			viewModel: TabBar,
			template: tab_box
		});
		
		let getValues = function(valueAccessor, bindingContext) {
			let target = valueAccessor();
			return Array.isArray(target) && target[1]
				? [target[0], bindingContext.$root.page.depth - 1]
				: [target, bindingContext.$root.page.depth];
		};
		ko.bindingHandlers.navi = {
			init: function(el, valueAccessor, allBindings, viewModel, bindingContext) {
				let [code, depth] = getValues(valueAccessor, bindingContext);
				let hash = self.get_hash(depth) + code;
				el.href = hash;
				el.classList.add("internal_link");
				el.setAttribute("target-hash", code);
				bindEvent(el, "click", function() {
					if(hash === window.location.hash) {
						self.position_page(depth + 1);
						self.update_siteName(depth + 1);
					}
				});
				
				if(bindingContext.$root.hasOwnProperty("page")) {
					if(code === bindingContext.$root.page.nextPageCode())
						el.classList.add("selectedLink");
					
					let subscriber = bindingContext.$root.page.nextPageCode.subscribe(function(newValue) {
						if(!el.isConnected) {
							subscriber.dispose();
							return;
						}
						
						if(code === newValue)
							el.classList.add("selectedLink");
						else
							el.classList.remove("selectedLink");
					});
				}
			},
			update: function(el, valueAccessor, allBindings, viewModel, bindingContext) {
				let [code, depth] = getValues(valueAccessor, bindingContext);
				el.href = self.get_hash(depth) + code;
				el.setAttribute("target-hash", code);
				// el.href = self.get_hash(bindingContext.$root.page.depth) + valueAccessor();
			}
		};
		
	},
	
	reload_allPages: function() {
		let pages = this.pages;
		for(let i=pages.length-1; i>=0; --i) {
			let page = pages[i];
			if(!page.isLoading)
				page.reload();
		}
	},
	
	get_hash: function(depth) {
		let hash = "#";
		for(let i=0, max=Math.min(this.pages.length, depth+1); i<max; ++i) {
			hash += this.pages[i].codeString + "/";
		}
		return hash;
	},
	
	update_page_dimensions: function() {
		let page_width = window.innerWidth || document.documentElement.clientWidth;
		
		if(page_width > PAGE_MIN_WIDTH) {
			if(!this.override_page_width) {
				this.page_width_percent = Math.round(100 / (page_width / PAGE_MIN_WIDTH));
				document.body.classList.remove("small_screen");
			}
		}
		else {
			this.page_width_percent = 93;
			document.body.classList.add("small_screen");
			this.override_page_width = false;
		}
		let el = document.getElementById("pageBox_width");
		el.value = Math.round(this.page_width_percent);
		this.el_pages.style.width = this.page_width_percent+"%";
		this.position_page();
	},
	update_navi_dimensions: function() {
		window.setTimeout(function() {
			this.el_navi.style.width = this.el_naviContent.clientWidth+"px";
		}.bind(this), 50);
	},
	
	go_back: function() {
		window.location.hash = this.get_hash(this.get_pagesCount()-2);
		return true;
	},
	get_pagesCount: function() {
		return this.pages.length;
	},
	get_lastPage: function() {
		return this.pages[this.pages.length-1];
	},
	
	position_page: function(depth) {
		let pagesCount = depth === undefined ?  this.pages.length : depth+1;
		//if there are too many elements, we only divide by max number that fits on the screen:
		let max_num = Math.min(pagesCount, Math.floor(100 / this.page_width_percent));
		//we move it by -50% because page is already centered:
		//we also add 1 to multiplication to account for margin (1% per side)
		let new_position = (pagesCount-max_num)*100 + (max_num * 50 - 50);
		
		if(new_position > 1) {
			this.el_pages.style.transform = "translate(-" + new_position + "%)";
			this.el_backBtn.style.display = "block";
		}
		else {
			this.el_pages.style.transform = "none";
			this.el_backBtn.style.display = "none";
		}
		
		if(pagesCount > 1) {
			this.el_header.style.right = ((100 - this.page_width_percent * max_num) / 2) + "%";
			this.el_header.style.width = this.page_width_percent + "%";
		}
	},
	update_siteName: function(depth) {
		window.document.title = this.pages[depth === undefined ? this.pages.length-1 : depth].printTitle();
	},
	
	replace: function(code, page) { //TODO: remove (use page.remove instead)
		page.destroy();
		this.add_pageToIndex(code);
	},
	goto: function(code) {
		window.location.hash = "#"+code;
	},
	add_page: function(code, depth) {
		window.location.hash = this.get_hash(depth || this.pages.length-1) + code
	},
	add_pageToIndex: function(code) {
		let pages = this.pages;
		let index = pages.length;
		if(index)
			pages[index-1].nextPageCode(code);
		
		let page = new Page(index, code);
		this.pages[index] = page
		this.add_navigation(page);
	},
	remove_page: function(depth) {
		let pages = this.pages;
		pages[depth].destroy();
	},
	
	add_navigation: function(page) {
		let el = createElement("span");
		el.appendChild(createElement("a", false, {href: this.get_hash(page.depth)}, {"data-bind": "text: printTitle"}));
		bindEvent(el, "click", function(e) {
			e.preventDefault();
			self.position_page(page.depth);
			self.update_siteName(page.depth);
		});
		bindEvent(el, "pointerenter", function() {
			page.parentEl.classList.add("point_out");
		});
		bindEvent(el, "pointerleave", function() {
			page.parentEl.classList.remove("point_out");
		});
		page.el_navi = el;
		this.el_naviContent.appendChild(el);
		
		this.update_navi_dimensions();
		// window.document.title = this.siteName+" - "+page.title();
		ko.applyBindings(page, el);
		
		if(page.depth) {
			this.el_header.style.opacity = "1";
			this.el_header.style.transform = "translateY(0px)";
		}
	},
	remove_navigation: function(page) {
		if(page.el_navi === null)
			return;
		ko.cleanNode(page.el_navi);
		this.el_naviContent.removeChild(page.el_navi);
		this.update_navi_dimensions();
		
		if(page.depth <= 1) {
			this.el_header.style.opacity = "0";
			this.el_header.style.transform = "translateY(25px)";
		}
	},
	
	_onhashchange: function() {
		// let hash = window.location.hash.substring(1);
		let hash = window.location.hash;
		if(hash.length === 0)
			hash = this.startHash;
		else
			hash = hash.substring(1);
		
		let new_pages = hash.split("/");
		if(hash.substr(-1) === "/")
			new_pages.pop();
		
		
		//making sure we only interpret new content:
		let pages = this.pages;
		let firstI=0;
		
		//find unneeded pages:
		while(firstI < new_pages.length && firstI < pages.length && new_pages[firstI] === pages[firstI].codeString) {
			++firstI;
		}
		
		//remove unneeded pages:
		for(let i=pages.length-1; i>=firstI; --i) {
			this.remove_page(i);
		}
		if(firstI >= 1)
			pages[firstI-1].nextPageCode("");
		
		//add new pages:
		for(let i=firstI, max=new_pages.length; i<max; ++i) {
			this.add_pageToIndex(new_pages[i]);
		}
		
		this.update_page_dimensions();
		this.update_siteName();
	},
	
	save_access: function(page, study_id, page_name) {
		return page.loader.loadRequest(FILE_SAVE_ACCESS, true, "post", "study_id="+study_id+"&page_name="+page_name);
	},
	save_dataset: function(page, type, participant, questionnaire_name, questionnaire_id, responses) {
		let study = Studies.get_current();
		
		responses = responses || {};
		responses["model"] = navigator.userAgent;
		
		let output = {
			userId: participant,
			appType: "Web",
			appVersion: this.serverVersion,
			serverVersion: this.serverVersion,
			dataset: [{
				dataSetId: 0,
				studyId: study.id(),
				studyVersion: study.version(),
				studySubVersion: study.subVersion(),
				accessKey: Studies.accessKey(),
				questionnaireName: questionnaire_name,
				questionnaireInternalId: questionnaire_id,
				eventType: type,
				responseTime: Date.now(),
				timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
				responses: responses
			}]
		};
		
		return page.loader.loadRequest(FILE_SAVE_DATASET, false, "post", JSON.stringify(output));
	},
	
};
let self = Site;