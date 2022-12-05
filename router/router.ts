import {
	BrowserWindow,
	ipcMain,
	Tray,
	Notification,
	nativeTheme,
	globalShortcut,
	dialog,
} from 'electron'
import { APIParams, Route } from '../typings/api'

import { windows, openMainWindows } from '../windows'
import { mode, setMode } from '../appearance'
import {
	logo,
	systemConfig,
	customizeOutputContent,
	// priority,
	// interval,
	updateAppConfig,
	languages,
	alignment,
	style,
	dragPosition,
	autoStart,
	customizeOutput,
	setCustomizeOutput,
	setMonitorSize,
} from '../config'
import * as nyanyalog from 'nyanyajs-log'
import { generateMonitorData, reloadMonitor } from '../modules/methods'

export const R = (
	func: (options: {
		event: Electron.IpcMainEvent
		window: BrowserWindow
		data: APIParams
	}) => void
) => {
	return (event: Electron.IpcMainEvent, data: APIParams) => {
		const w = windows.get(data.route)
		w &&
			func({
				event,
				window: w,
				data,
			})
	}
}

export const initRouter = () => {
	ipcMain.on(
		'saveData',
		(
			event: Electron.IpcMainEvent,
			data: {
				customizeOutputContent: string
				// priority: number
				// interval: number
			}
		) => {
			updateAppConfig(data)
		}
	)
	ipcMain.on('getData', (event: Electron.IpcMainEvent) => {
		windows.get('/index.html').webContents.send('getData', {
			customizeOutputContent,
			// priority,
			// interval,
		})
	})

	ipcMain.on(
		'getLanguages',
		(
			event: Electron.IpcMainEvent,
			{
				route,
			}: {
				route: Route
			}
		) => {
			windows.get(route).webContents.send('getLanguages', languages)
		}
	)
	ipcMain.on(
		'getConfig',
		async (
			event: Electron.IpcMainEvent,
			{
				route,
			}: {
				route: Route
			}
		) => {
			windows.get(route).webContents.send('getConfig', {
				languages,
				alignment,
				style,
				dragPosition,
				autoStart,
				customizeOutput,
			})
		}
	)

	ipcMain.on(
		'setCustomizeOutput',
		async (
			event: Electron.IpcMainEvent,
			{
				data,
			}: {
				data: string
			}
		) => {
			reloadMonitor()
			setCustomizeOutput(data)
		}
	)

	ipcMain.on(
		'setSize',
		async (
			event: Electron.IpcMainEvent,
			{
				route,
				width,
				height,
			}: {
				route: Route
				width: number
				height: number
			}
		) => {
			// console.log('setSize', width, height)
			let win = windows.get(route)
			win?.setResizable(true)
			win?.setSize(width, height)
			win?.setResizable(false)
			setMonitorSize({
				w: width,
				h: height,
			})
		}
	)

	ipcMain.on(
		'getCustomizeOutput',
		async (
			event: Electron.IpcMainEvent,
			{
				route,
			}: {
				route: Route
			}
		) => {
			windows.get(route).webContents.send('getCustomizeOutput', customizeOutput)
		}
	)
	ipcMain.on(
		'getMonitorData',
		async (
			event: Electron.IpcMainEvent,
			{
				route,
				customizeOutput,
			}: {
				route: Route
				customizeOutput: string
			}
		) => {
			// console.log('customizeOutput', route, customizeOutput)
			windows
				.get(route)
				.webContents.send(
					'getMonitorData',
					generateMonitorData(customizeOutput)
				)
		}
	)

	ipcMain.on(
		'showNotification',
		R(({ window, data }) => {
			const notification = new Notification({
				title: data.data.title || '',
				body: data.data.content || 'Nothing',
				icon: logo,
			})
			notification.show()
			if (data.data.timeout) {
				setTimeout(() => {
					notification.close()
				}, data.data.timeout || 5000)
			}
		})
	)

	ipcMain.on(
		'openDevTools',
		R(({ window }) => {
			console.log('opendevtools', window)
			window.webContents.openDevTools()
		})
	)
}
