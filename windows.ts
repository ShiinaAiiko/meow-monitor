import {
	BrowserWindow,
	BrowserWindowConstructorOptions,
	globalShortcut,
	Tray,
	app,
	Menu,
	screen,
	MenuItem,
} from 'electron'
import path from 'path'

import isDev from 'electron-is-dev'

import { Route } from './typings/api'
import { taskIcon, systemConfig, dragPosition, monitorSize } from './config'

export const windows = new Map<Route, BrowserWindow>()

export interface BrowserWindowOPtions extends BrowserWindowConstructorOptions {
	visible: boolean
}

export const createWindow = async (
	route: Route,
	options: BrowserWindowOPtions
) => {
	let x = options?.x >= 0 ? options?.x : await systemConfig.get(route + 'x')
	let y = options?.y >= 0 ? options?.y : await systemConfig.get(route + 'y')
	const window = new BrowserWindow({
		...options,
		webPreferences: {
			...options.webPreferences,
			devTools: true,
		},
		icon: taskIcon,
	})
	console.log(route, options.x, options.y, x, y)

	if (process.platform === 'darwin') {
		app.dock.setIcon(taskIcon)
	}

	if (x < 0 || x === undefined) {
		window.center()
	} else {
		window.setPosition(x, y)
	}
	if (options.visible) {
		window.show()
	} else {
		window.hide()
	}
	console.log(route, `file://${path.join(__dirname, '../public' + route)}`)
	window.loadURL(`file://${path.join(__dirname, '../public' + route)}`, {
		extraHeaders: 'pragma: no-cache',
	})
	window.webContents.openDevTools()
	setTimeout(() => {
		if (options?.webPreferences?.devTools) {
			window.webContents.openDevTools()
		} else {
			window.webContents.closeDevTools()
		}
	})
	window.on('show', () => {
		console.log('show')
	})
	window.on('closed', () => {
		console.log('closed')
		windows.delete(route)
	})
	window.on('move', async (e: any) => {
		const [x, y] = window.getPosition()
		await systemConfig.set(route + 'x', x)
		await systemConfig.set(route + 'y', y)
	})
	window.setMenu(null)
	windows.set(route, window)
	return window
}
const menu = new Menu()
menu.append(
	new MenuItem({
		label: 'Electron',
		submenu: [
			{
				role: 'help',
				accelerator:
					process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Alt+Shift+I',
				click: () => {
					console.log('Electron rocks!')
				},
			},
		],
	})
)

export const openMainWindows = async () => {
	let window = windows.get('/index.html')
	if (window) {
		window.show()
		// window.focus()
		window.webContents.send('show')
		return window
	}
	return await createWindow('/index.html', {
		title: 'Nyanya Progress Priority',
		width: 490,
		height: 650,
		// x: 0,
		// y: 0,
		skipTaskbar: false,
		hasShadow: true,
		alwaysOnTop: false,
		fullscreen: false,
		// center: true,
		// 可以隐藏窗口
		frame: true,
		useContentSize: false,
		resizable: false,
		// backgroundColor: 'rgba(0,0,0,0.3)',

		webPreferences: {
			devTools: isDev ? true : false,
			nodeIntegration: true,
			contextIsolation: false,
		},
		visible: true,
	})
}

export const openMonitor = async () => {
	let window =
		windows.get('/monitor.html') ||
		(await createWindow('/monitor.html', {
			title: 'Nyanya Progress Priority',
			width: monitorSize.w,
			height: monitorSize.h,
			x: (await systemConfig.get('/monitor.html' + 'x')) || 0,
			y: (await systemConfig.get('/monitor.html' + 'y')) || 20,
			skipTaskbar: false,
			hasShadow: true,
			alwaysOnTop: false,
			fullscreen: false,
			// center: true,
			// 可以隐藏窗口
			useContentSize: true,
			resizable: true,

			transparent: true, // 窗口透明
			frame: false, // 无边框
			// backgroundColor: 'rgba(0,0,0,0.3)',

			webPreferences: {
				devTools: isDev ? false : false,
				nodeIntegration: true,
				contextIsolation: false,
			},
			visible: true,
		}))
	window.show()
	// window.focus()
	window.webContents.send('show')
	window.setIgnoreMouseEvents(dragPosition === 'open' ? false : true) // 鼠标穿透
	window.setAlwaysOnTop(true) // 保持置顶
	window.setSkipTaskbar(true) // 无任务栏图标
	window.setFocusable(false) // 无任务栏图标

	return window
}
