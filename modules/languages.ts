import { languages } from '../config'

export const resources = {
	'zh-CN': {
		appName: '喵视器',

		configure: '配置',

		alignment: '对齐方式',
		left: '向左对齐',
		center: '中间对齐',
		right: '向右对齐',

		style: '风格',
		dark: '暗黑',
		light: '明亮',

		dragPosition: '拖拽位置',
		open: '打开',
		close: '关闭',
		defaultLocation: '默认位置',
		enableMonitorDragging: '开启监视器拖拽',
		disableMonitorDragging: '禁用监视器拖拽',

		autoStart: '自启动',

		languages: '多语言',
		enUS: 'English - 英文',
		zhCN: '中文(简体) - 中文(简体)',
		zhTW: '中文(繁體) - 中文(繁体)',

		quit: '退出',

		about: '关于',
		version: '版本',
		github: 'Github',
	},
	'zh-TW': {
		appName: '喵視器',

		configure: '配置',

		alignment: '對齊方式',
		left: '向左對齊',
		center: '中間對齊',
		right: '向右對齊',

		style: '風格',
		dark: '暗黑',
		light: '明亮',

		dragPosition: '拖拽位置',
		open: '打開',
		close: '關閉',
		defaultLocation: '默認位置',
		enableMonitorDragging: '開啟監視器拖拽',
		disableMonitorDragging: '禁用監視器拖拽',

		autoStart: '自啟動',

		languages: '多語言',
		enUS: 'English - 英文',
		zhCN: '中文(簡體) - 中文(簡體)',
		zhTW: '中文(繁體) - 中文(繁體)',

		quit: '退出',

		about: '關於',
		version: '版本',
		github: 'Github',
	},
	'en-US': {
		appName: 'Meow Monitor',

		configure: 'Configure',

		alignment: 'Alignment',
		left: 'Left',
		center: 'Center',
		right: 'Right',

		style: 'Style',
		dark: 'Dark',
		light: 'Light',

		dragPosition: 'Drag position',
		open: 'Open',
		close: 'Close',
		defaultLocation: 'Default location',
		enableMonitorDragging: 'Enable monitor dragging',
		disableMonitorDragging: 'Disable monitor dragging',

		autoStart: 'Auto start',

		languages: 'Languages',
		enUS: 'English - English',
		zhCN: '中文(简体) - Chinese(Simplified)',
		zhTW: '中文(繁體) - Chinese(Traditional)',

		quit: 'Quit',

		about: 'About',
		version: 'Version',
		github: 'Github',
	},
}

export const t = (parameter: keyof typeof resources['en-US']): string => {
	return resources?.[languages]?.[parameter] || parameter
}
