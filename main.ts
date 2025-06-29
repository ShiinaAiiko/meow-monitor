import {
	BrowserWindow,
	globalShortcut,
	Tray,
	app,
	Menu,
	MenuItem,
	nativeTheme,
	ipcMain,
	protocol,
	ipcRenderer,
	Notification,
} from 'electron'
import path from 'path'
import { exec } from 'child_process'
import isDev from 'electron-is-dev'
import {
	initConfig,
	systemConfig,
	logo,
	taskIcon,
	initAppConfig,
} from './config'

import { initAppearance } from './appearance'
import { createTaskMenu } from './taskMenu'
import { initRouter } from './router/router'
import { start } from './modules/methods'
import { openMainWindows, openMonitor } from './windows'
import * as nyanyalog from 'nyanyajs-log'

import AutoLaunch from 'auto-launch'
import { initShortcut } from './shortcut'
export const autoLauncher = new AutoLaunch({
	name: 'Meow Monitor',
	// path: '/Applications/Minecraft.app',
})



const run = () => {
	let isQuit = false

	const argvFunc = (argv: string[]) => {
		// nyanyalog.info(argv)
		isQuit = false
		argv.forEach((val, index) => {
			if (val === 'quit') {
				app.quit()
				isQuit = true
			}
		})
		// nyanyalog.info('isQuit => ', isQuit)
	}

	argvFunc(process.argv)

	nyanyalog.info('启动')

	// protocol.registerSchemesAsPrivileged([
	//   { scheme: 'app', privileges: { secure: true, standard: true } }
	// ])
	const ready = async () => {
		if (isQuit) {
			return
		}
		app.commandLine.appendSwitch('disable-http-cache')
		await initConfig()
		await initAppearance()

    initRouter()
    initShortcut()
		initAppConfig()
		await createTaskMenu()

		start()
		await openMonitor()
		// await openMainWindows()
	}

	const isFirstInstance = app.requestSingleInstanceLock()

	nyanyalog.info('isFirstInstance', isFirstInstance)
	if (!isFirstInstance) {
		nyanyalog.info('is second instance')
		app.quit()
	} else {
		app.on('second-instance', (event, commanLine, workingDirectory) => {
			nyanyalog.info('new app started', commanLine)

			argvFunc(commanLine)

			!isQuit && openMainWindows()
		})

		app.on('ready', ready)
	}

	ipcMain.on('quit', () => {
		nyanyalog.info('quit')
		app.quit()
	})

	app.focus()

	app.on('window-all-closed', () => {
		nyanyalog.info('window-all-closed', process.platform)
		// if (process.platform !== 'darwin') {
		// 	// app.quit()
		// }
	})
	app.on('activate', () => {
		nyanyalog.info('activate')
		// if (mainWindow === null) {
		// 	createWindow()
		// }
	})
}

run()
