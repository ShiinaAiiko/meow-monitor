import {
	BrowserWindow,
	ipcMain,
	Tray,
	Notification,
	nativeTheme,
	globalShortcut,
	dialog,
	SaveDialogOptions,
	OpenDialogOptions,
} from 'electron'
import path from 'path'
import fs from 'fs'
import * as nyanyalog from 'nyanyajs-log'

import {
	logo,
	systemConfig,
	customizeOutputContent,
	// priority,
	// msg,
	// updateMsg,
	setDragPosition,
} from '../config'

const mkdirsSync = (dirname: string) => {
	if (fs.existsSync(dirname)) {
		return true
	} else {
		if (mkdirsSync(path.dirname(dirname))) {
			fs.mkdirSync(dirname)
			return true
		}
	}
}

const removeDir = (dir: string) => {
	let files = fs.readdirSync(dir)
	for (var i = 0; i < files.length; i++) {
		let newPath = path.join(dir, files[i])
		let stat = fs.statSync(newPath)
		if (stat.isDirectory()) {
			//如果是文件夹就递归下去
			removeDir(newPath)
		} else {
			//删除文件
			fs.unlinkSync(newPath)
		}
	}
	fs.rmdirSync(dir) //如果文件夹是空的，就将自己删除掉
}

import { PowerShell } from 'node-powershell'
import moment from 'moment'
import { appTray, getMenu } from '../taskMenu'
import { t } from './languages'

let timer: NodeJS.Timer
export let isStart = false
export let time = 0
export let lastTime = ''

export const start = () => {
	// console.log('start', processName, priority, interval)
	isStart = true
}

import os from 'os-utils'
import nodeCMD from 'node-cmd'
import { exec } from 'child_process'
import { openMonitor, windows } from '../windows'

async function getCPUUsage() {
	return new Promise<number>((resolve, reject) => {
		os.cpuUsage(function (v) {
			resolve(v)
		})
	})
}

/**
 * 获取系统gpu(nvidia)利用率
 */
async function getGPUUsage() {
	return new Promise<string>((resolve) => {
		try {
			exec('nvidia-smi -q -d UTILIZATION', (err, stdout, stderr) => {
				if (err) {
					// console.log(err)
					resolve('')
					return
				}

				let a = stdout
					.split('\r\n')
					.find((s) => s.indexOf('Gpu') >= 0 && s.indexOf('%') >= 0)
				let start = a.indexOf(':') + 2
				let end = a.indexOf('%') - 1
				let ss = a.substring(start, end)
				resolve(ss)
			})
		} catch (error) {
			// console.log('error', error)
			resolve('')
		}
	})
}

let cpuUsage = '00%'
let gpuUsage = '00'
let totalMem = 0
let freeMem = 0
let freememPercentage = 0
let count = 0
let interval = 2
let placeholderLength = 2
let placeholder = '`'

export const generateMonitorData = async (customizeOutput: string) => {
	// console.log('customizeOutput', customizeOutput)
	count++
	customizeOutput = customizeOutput.replace(/\s+/g, '&nbsp')
	if (customizeOutput.indexOf('{Time}') >= 0) {
		customizeOutput = customizeOutput.replace(
			'{Time}',
			moment().format('YYYY-MM-DD hh:mm:ss')
		)
	}
	if (customizeOutput.indexOf('{CPU}') >= 0) {
		// console.log(count, count % 3 === 0)
		// console.log(cpuUsage)
		customizeOutput = customizeOutput.replace(
			'{CPU}',
			cpuUsage.padStart(placeholderLength, placeholder)
		)
		if (count % interval === 0) {
			getCPUUsage().then((res) => {
				res = res * 100
				cpuUsage =
					String(
						res >= 100
							? 100
							: res <= 0.99
							? String(Math.round(res)).padStart(2, '0')
							: String(Math.floor(res)).padStart(2, '0')
					) + '%'
			})
		}
	}
	if (customizeOutput.indexOf('{Mem}') >= 0) {
		// console.log(count, count % 3 === 0)
		customizeOutput = customizeOutput.replace(
			'{Mem}',
			(String(Math.round((1 - freememPercentage) * 100)) + '%').padStart(
				placeholderLength,
				placeholder
			)
		)
		if (count % interval === 0) {
			totalMem = os.totalmem()
			freememPercentage = os.freememPercentage()
			freeMem = os.freemem()
		}
	}
	if (customizeOutput.indexOf('{GPU}') >= 0) {
		// console.log(count, count % 3 === 0)
		gpuUsage &&
			(customizeOutput = customizeOutput.replace(
				'{GPU}',
				String(gpuUsage + '%').padStart(placeholderLength, placeholder)
			))
		if (count % interval === 0) {
			getGPUUsage().then((res) => {
				gpuUsage = (res || '00').padStart(2, '0')
			})
		}
	}
	return customizeOutput
}

export const reloadMonitor = () => {
	console.log('------reloadMonitor------')

	windows.get('/monitor.html')?.on('closed', () => {
		openMonitor()
	})
	windows.get('/monitor.html')?.close?.()
}

export const openDrag = (a: string) => {
	setDragPosition(a)

	const notification = new Notification({
		title: t('appName'),
		body:
			a === 'open' ? t('enableMonitorDragging') : t('disableMonitorDragging'),
		icon: logo,
	})
	notification.show()
	setTimeout(() => {
		notification.close()
	}, 5000)
	windows.get('/monitor.html')?.setIgnoreMouseEvents(a === 'open')
}

import oss from 'os'
console.log(
	oss.cpus().map((v) => {
		return v.times.user
	})
)
