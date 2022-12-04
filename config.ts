import {
	BrowserWindow,
	nativeImage,
	Tray,
	ipcMain,
	nativeTheme,
} from 'electron'
import { NodeFsStorage, electronRouter } from '@nyanyajs/utils/dist/node'

import path from 'path'
import isDev from 'electron-is-dev'
import * as nyanyalog from 'nyanyajs-log'
import { start } from './modules/methods'
import { appTray, getMenu } from './taskMenu'
import { t } from './modules/languages'
import { windows } from './windows'
import { autoLauncher } from './main'

nyanyalog.config({
	format: {
		function: {
			fullFunctionChain: false,
		},
		prefixTemplate: '[{{Timer}}] [{{Type}}] [{{File}}]@{{Name}}',
	},
})

export let customizeOutputContent = ''
// export let priority = 128
// export let interval = 10000
// export let msg = t('closed')

export let languages = 'en-US'
export let alignment = 'left'
export let style = 'dark'
export let dragPosition = 'close'
export let autoStart = 'close'
export let customizeOutput = '{timer}'
export let monitorSize = {
	w: 700,
	h: 100,
}

export const setLanguages = async (lang: string) => {
	languages = lang
	await systemConfig.set('language', languages)
	appTray.setContextMenu(getMenu())
	windows.get('/index.html')?.webContents?.send('getLanguages', languages)
}

export const setAlignment = async (a: string) => {
	alignment = a
	await systemConfig.set('alignment', alignment)
	appTray.setContextMenu(getMenu())
}

export const setDragPosition = async (a: string) => {
	dragPosition = a
	await systemConfig.set('dragPosition', dragPosition)
	appTray.setContextMenu(getMenu())
}

export const setAutoStart = async (a: string) => {
	autoStart = a
	await systemConfig.set('autoStart', autoStart)
	appTray.setContextMenu(getMenu())
}

export const setCustomizeOutput = async (a: string) => {
	customizeOutput = a
	await systemConfig.set('customizeOutputContent', customizeOutput)
	appTray.setContextMenu(getMenu())
}

export const setMonitorSize = async (a: typeof monitorSize) => {
	monitorSize = a
	await systemConfig.set('monitorSize', monitorSize)
}

export const initAppConfig = async () => {
	const data = await systemConfig.get('config')

	if (data?.customizeOutputContent) {
		customizeOutputContent = data.customizeOutputContent
		// priority = data.priority
		// interval = data.interval
	}
}

export const updateAppConfig = async (data: {
	customizeOutputContent: string
	// priority: number
	// interval: number
}) => {
	customizeOutputContent = data.customizeOutputContent
	// priority = data.priority
	// interval = data.interval
	start()
	await systemConfig.set('config', data)
}

// export const updateMsg = async (data: string) => {
// 	msg = data
// }

export const setStyle = async (a: string) => {
	style = a
	await systemConfig.set('style', style)
	appTray.setContextMenu(getMenu())
	// windows.get('/monitor.html')?.webContents?.send('getAlignment', alignment)
}

// 自动获取本机目录
export let userHome = process.env.HOME || process.env.USERPROFILE
const cacheRootDir = userHome + '/.cache'
const configRootDir = userHome + '/.config'
// 'mode' | 'language'

// console.log("userHome",process.)

nyanyalog.info('isDev', isDev)
nyanyalog.info('__dirname', __dirname)
let staticPath = isDev ? '../public' : '../public'

export const taskIcon = path.join(path.join(__dirname, staticPath), 'logo.png')

export const logo = path.join(path.join(__dirname, staticPath), 'logo.png')

let labelPrefix = isDev ? 'dev_' : ''

export const systemConfig = new NodeFsStorage<any>({
	label: labelPrefix + 'systemConfig',
	cacheRootDir: configRootDir + '/meow-monitor/s',
	// encryption: {
	// 	enable: false,
	// 	key: 'nyanya-progress-priority',
	// },
})
export const initConfig = async () => {
	NodeFsStorage.baseRootDir = cacheRootDir + '/meow-monitor/u'

	await systemConfig.getAndSet('language', (v): any => {
		languages = v ? v : languages
		return languages
	})
	await systemConfig.getAndSet('mode', (v) => {
		return v ? v : 'system'
	})

	await systemConfig.getAndSet('alignment', (v) => {
		alignment = v ? v : alignment
		return v ? v : alignment
	})

	await systemConfig.getAndSet('style', (v) => {
		style = v ? v : style
		return v ? v : style
	})

	await systemConfig.getAndSet('dragPosition', (v) => {
		dragPosition = v ? v : dragPosition
		return v ? v : dragPosition
	})

	await systemConfig.getAndSet('autoStart', (v) => {
		autoStart = v ? v : autoStart
		return v ? v : autoStart
	})

	await systemConfig.getAndSet('customizeOutputContent', (v) => {
		customizeOutput = v ? v : customizeOutput
		return v ? v : customizeOutput
	})

	await systemConfig.getAndSet('monitorSize', (v) => {
		monitorSize = v ? v : monitorSize
		return v ? v : monitorSize
	})

	autoLauncher
		.isEnabled()
		.then((isEnabled: boolean) => {
			setAutoStart(isEnabled ? 'open' : 'close')
		})
		.catch((err) => {
			console.log(err)
		})

	electronRouter(ipcMain)
}
