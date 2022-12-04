import {
	BrowserWindow,
	globalShortcut,
	Tray,
	app,
	Menu,
	Notification,
	MenuItem,
} from 'electron'
import { dragPosition, logo, setDragPosition } from './config'
import { openDrag } from './modules/methods'

import { windows, openMainWindows, createWindow } from './windows'
//   Command（或Cmd简称）
// Control（或Ctrl简称）
// CommandOrControl（或CmdOrCtrl简称）
// Alt
// Option
// AltGr
// Shift
// Super

export const initShortcut = () => {
	globalShortcut.register('Control+Alt+m', async () => {
		console.log('开启拖拽')
		openDrag(dragPosition === 'open' ? 'close' : 'open')
	})
}
