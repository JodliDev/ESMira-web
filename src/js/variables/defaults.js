import {
	CONDITION_TYPE_ALL,
	STATISTICS_CHARTTYPES_LINE,
	STATISTICS_DATATYPES_DAILY,
	STATISTICS_VALUETYPES_MEAN
} from "./statistics";
import {Lang} from "../main_classes/lang";

export const Defaults = {};


//
// Codes for OwnMapping:
// $XXX : Array with objects
// _XXX : Should not be compared with defaults
//
export function fillDefaults() {
	Defaults.conditions = {
		key: "",
		value: "",
		operator: 0
	};
	Defaults.axisData = {
		$conditions: Defaults.conditions,
		
		variableName: "",
		observedVariableIndex: -1,
		conditionType: CONDITION_TYPE_ALL
	};
	Defaults.axisContainer = {
		xAxis: Defaults.axisData,
		yAxis: Defaults.axisData,
		
		label: '',
		color: '#00bbff',
	};
	Defaults.charts = {
		$publicVariables: Defaults.axisContainer,
		$axisContainer: Defaults.axisContainer,
		
		title: "",
		chartDescription: "",
		xAxisLabel: "",
		yAxisLabel: "",
		valueType: STATISTICS_VALUETYPES_MEAN,
		dataType: STATISTICS_DATATYPES_DAILY,
		chartType: STATISTICS_CHARTTYPES_LINE,
		//storageType is set in admin.php. Default is 0, which is timed
		inPercent: false,
		xAxisIsNumberRange: false,
		maxYValue: 0,
		displayPublicVariable: false,
		hideUntilCompletion: false,
		fitToShowLinearProgression: 0
	};
	Defaults.statistics = {
		$charts: Defaults.charts,
		
		_observedVariables: {}
	};
	Defaults.inputs = {
		$subInputs: {
			responseType: "text_input",
			name: "input",
			required: false,
			random: false,
			defaultValue: "",
			text: "",
			url: "",
			leftSideLabel: "",
			rightSideLabel: "",
			likertSteps: 5,
			numberHasDecimal: false,
			listChoices: [],
			asDropDown: true,
			forceInt: false
		},
		responseType: "text_input",
		name: "input",
		required: false,
		random: false,
		defaultValue: "",
		text: "",
		url: "",
		leftSideLabel: "",
		rightSideLabel: "",
		likertSteps: 5,
		numberHasDecimal: false,
		listChoices: [],
		asDropDown: true,
		forceInt: false
	};
	
	Defaults.pages = {
		$inputs: Defaults.inputs,
		
		randomized: false,
		header: "",
		footer: ""
	};
	Defaults.actions = {
		type: 1, //is Invitation
		msgText: "",
		timeout: 0,
		reminder_count: 0,
		reminder_delay_minu: 5
	};
	Defaults.signalTimes = {
		label: "",
		startTimeOfDay: 0,
		endTimeOfDay: 0,
		random: false,
		randomFixed: false,
		frequency: 1,
		minutesBetween: 60
	};
	Defaults.schedules = {
		$signalTimes: Defaults.signalTimes,
		
		userEditable: true,
		dailyRepeatRate: 1,
		skipFirstInLoop: false,
		weekdays: 0,
		dayOfMonth: 0
	};
	Defaults.eventTriggers = {
		label: "Event",
		cueCode: "joined",
		skipThisQuestionnaire: false,
		specificQuestionnaireEnabled: false,
		specificQuestionnaireInternalId: -1,
		randomDelay: false,
		delaySec: 0,
		delayMinimumSec: 0,
	};
	Defaults.actionTriggers = {
		$actions: Defaults.actions,
		$schedules: Defaults.schedules,
		$eventTriggers: Defaults.eventTriggers
	};
	Defaults.sumScores = {
		name: "unknown",
		addList: [],
		subtractList: []
	};
	Defaults.questionnaires = {
		$actionTriggers: Defaults.actionTriggers,
		$pages: Defaults.pages,
		$sumScores: Defaults.sumScores,
		
		title: "Questionnaire",
		internalId: -1,
		publishedAndroid: true,
		publishedIOS: true,
		publishedWeb: true,
		durationStart: 0,
		durationEnd: 0,
		durationPeriodDays: 0,
		durationStartingAfterDays: 0,
		
		completableOnce: false,
		completableOncePerNotification: false,
		completableMinutesAfterNotification: 0,
		limitCompletionFrequency: false,
		completionFrequencyMinutes: 60,
		completableAtSpecificTime: false,
		completableAtSpecificTimeStart: -1,
		completableAtSpecificTimeEnd: -1
	};
	Defaults.eventUploadSettings = {
		actions_executed: false,
		invitation: false,
		invitation_missed: false,
		message: false,
		notification: false,
		rejoined: false,
		reminder: false,
		schedule_changed: true,
		statistic_viewed: false,
		study_message: false,
		study_updated: false
	}
	Defaults.studies = {
		$questionnaires: Defaults.questionnaires,
		groups: [], //TODO: can be removed when all have lib-Version 16 (Android: 2.4.2.1, iOS: 1.1.3)
		publicStatistics: Defaults.statistics,
		personalStatistics: Defaults.statistics,
		
		id: -1,
		version: -1,
		subVersion: -1,
		serverVersion: -1,
		new_changes: false,
		published: false,
		publishedWeb: true,
		publishedAndroid: true,
		publishedIOS: true,
		title: "Error",
		sendMessagesAllowed: true,
		studyDescription: '',
		informedConsentForm: '',
		postInstallInstructions: '',
		chooseUsernameInstructions: Lang.get("default_chooseUsernameInstructions"),
		webQuestionnaireCompletedInstructions: Lang.get("default_webQuestionnaireCompletedInstructions"),
		webInstallInstructions: '',
		contactEmail: '',
		accessKeys: [],
		eventUploadSettings: Defaults.eventUploadSettings
	};
	Defaults.messages = {
		content: "",
		userId: "",
		appVersion: "",
		appType: "",
		distributedSince: -1
	};
	Defaults.user = {
		username: "Error",
		admin: false,
		read: [],
		msg: [],
		write: [],
		publish: []
	};
}