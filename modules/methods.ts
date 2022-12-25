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
	updateSpeed,
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
import si from 'systeminformation'

let timer: NodeJS.Timer
export let isStart = false
export let time = 0
export let lastTime = ''

export const start = () => {
	// console.log('start', processName, priority, interval)
	isStart = true
}

import os from 'os-utils'
import OS from 'os'
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
const getNvidiaGPUUsage = () => {
	return new Promise<{
		temperature: string
		power: string
		videoMemory: {
			used: number
			total: number
			free: number
		}
		utilization: string
	}>((resolve) => {
		let temperature = ''
		let power = ''
		let usedMem = 0
		let totalMem = 0
		let freeMem = 0
		let utilization = ''
		try {
			exec('nvidia-smi', (err, stdout, stderr) => {
				if (err) {
					// console.log(err)
					resolve({
						temperature,
						power,
						videoMemory: {
							used: usedMem,
							total: totalMem,
							free: freeMem,
						},
						utilization,
					})
					return
				}
				let a = stdout.split('\r\n')

				a.some((v) => {
					if (v.indexOf('MiB') >= 0) {
						const tempIndex = v.indexOf('C ')
						temperature = v.substring(tempIndex - 4, tempIndex).trim() + 'C'

						const powerIndex = v.indexOf('W ')

						power = v.substring(powerIndex - 4, powerIndex).trim() + 'W'

						const usedMemIndex = v.indexOf('MiB / ')

						usedMem = Number(v.substring(usedMemIndex - 6, usedMemIndex).trim())

						const totalMemIndex = v.indexOf('MiB | ')

						totalMem = Number(
							v.substring(totalMemIndex - 6, totalMemIndex).trim()
						)
						freeMem = totalMem - usedMem
						const utilizationIndex = v.indexOf('% ')

						utilization =
							v.substring(utilizationIndex - 6, utilizationIndex).trim() + '%'

						return true
					}
				})
				resolve({
					temperature,
					power,
					videoMemory: {
						used: usedMem,
						total: totalMem,
						free: freeMem,
					},
					utilization,
				})
			})
		} catch (error) {
			// console.log('error', error)
			resolve({
				temperature,
				power,
				videoMemory: {
					used: usedMem,
					total: totalMem,
					free: freeMem,
				},
				utilization,
			})
		}
	})
}

let networkInterfaces: si.Systeminformation.NetworkInterfacesData[] = []
let networkInterfacesCount = 0
const getNetworkSpeed = () => {
	networkInterfacesCount++

	return new Promise<{
		upload: number
		download: number
	}>(async (resolve) => {
		let upload = 0
		let download = 0
		let p: any[] = []
		try {
			if (networkInterfacesCount % 100 === 0 || networkInterfacesCount === 1) {
				const res = await si.networkInterfaces()
				const net = res.filter((v) => {
					return !v?.virtual && v?.ip4 && v.type
				})
				if (net.length) {
					networkInterfaces = net
				}
			}

			if (networkInterfaces.length) {
				networkInterfaces.forEach((v) => {
					if (!v.iface) return
					p.push(
						new Promise(async (res, rej) => {
							const netStats = await si.networkStats(v.iface)
							console.log(netStats)
							if (netStats.length) {
								upload += netStats?.[0].tx_sec || 0
								download += netStats?.[0].rx_sec || 0
							}
							res('')
						})
					)
				})
			} else {
				// networkInterfacesCount = -40
			}

			p.length && (await Promise.all(p))
			resolve({
				upload,
				download,
			})
		} catch (error) {
			resolve({
				upload,
				download,
			})
		}
	})
}

const formartNetworkSpeed = (s: number) => {
	if (s >= 1024 * 1024) {
		return (s / 1024 / 1024).toFixed(2) + 'MB/s'
	}
	return (s / 1024).toFixed(2) + 'KB/s'
}

let cpuUsage = '00%'
// let gpuUsage = '00'
let totalMem = 0
let freeMem = 0
let freememPercentage = 0
let count = 0
let placeholderLength = 2
let placeholder = '`'

let nvgpuUsage = {
	temperature: '---',
	power: '---',
	videoMemory: {
		used: 0,
		total: 0,
		free: 0,
	},
	utilization: '---',
}

let networkSpeed = {
	upload: 0,
	download: 0,
}
let batteryPercent = '00%'
let batteryCycleCount = 0
let cpuTemp = '---'
let cpuCurrentSpeed = '---'

let uptime = {
	d: 0,
	h: 0,
	m: 0,
	s: 0,
}

export const generateMonitorData = (customizeOutput: string) => {
	let interval = updateSpeed === 'high' ? 1 : updateSpeed === 'normal' ? 2 : 5

	// console.log('customizeOutput', customizeOutput)
	count++
	customizeOutput = customizeOutput.replace(/\s+/g, '&nbsp')
	if (customizeOutput.indexOf('{Time}') >= 0) {
		customizeOutput = customizeOutput.replace(
			'{Time}',
			moment().format('YYYY-MM-DD HH:mm:ss')
		)
	}
	if (customizeOutput.indexOf('{CPU}') >= 0) {
		// console.log(count, count % 3 === 0)
		// console.log(cpuUsage)
		customizeOutput = customizeOutput.replace(
			'{CPU}',
			cpuUsage.padStart(placeholderLength, placeholder)
		)
		if (count % interval === 0 || count === 1) {
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
	if (customizeOutput.indexOf('{NVGPU}') >= 0) {
		if (count % interval === 0 || count === 1) {
			getNvidiaGPUUsage().then((res) => {
				nvgpuUsage = res
			})
		}
	}

	if (customizeOutput.indexOf('{NVGPUTemp}') >= 0) {
		customizeOutput = customizeOutput.replace(
			'{NVGPUTemp}',
			String(nvgpuUsage.temperature)
		)
	}

	if (customizeOutput.indexOf('{NVGPUPower}') >= 0) {
		customizeOutput = customizeOutput.replace(
			'{NVGPUPower}',
			String(nvgpuUsage.power)
		)
	}

	if (customizeOutput.indexOf('{NVGPUMem}') >= 0) {
		customizeOutput = customizeOutput.replace(
			'{NVGPUMem}',
			String(
				nvgpuUsage.videoMemory.used
					? String(
							Math.floor(
								(nvgpuUsage.videoMemory.used / nvgpuUsage.videoMemory.total) *
									100
							)
					  ) + '%'
					: '0%'
			).padStart(3, '0')
		)
	}

	if (customizeOutput.indexOf('{NVGPUTotalMem}') >= 0) {
		customizeOutput = customizeOutput.replace(
			'{NVGPUTotalMem}',
			String(nvgpuUsage.videoMemory.total + 'MiB')
		)
	}

	if (customizeOutput.indexOf('{NVGPUFreeMem}') >= 0) {
		customizeOutput = customizeOutput.replace(
			'{NVGPUFreeMem}',
			String(nvgpuUsage.videoMemory.free + 'MiB')
		)
	}

	if (customizeOutput.indexOf('{NVGPUUsedMem}') >= 0) {
		customizeOutput = customizeOutput.replace(
			'{NVGPUUsedMem}',
			String(nvgpuUsage.videoMemory.used + 'MiB')
		)
	}

	if (customizeOutput.indexOf('{NVGPU}') >= 0) {
		customizeOutput = customizeOutput.replace(
			'{NVGPU}',
			nvgpuUsage.utilization
				? String(nvgpuUsage.utilization).padStart(3, '0')
				: '00%'
		)
	}

	if (customizeOutput.indexOf('{Network') >= 0) {
		if (count % interval === 0 || count === 1) {
			networkSpeed.download += Math.random() * 10 - 5
			networkSpeed.upload += Math.random() * 10 - 5
		}
		if (count % (interval * 3 > 10 ? 10 : interval * 3) === 0 || count === 1) {
			getNetworkSpeed().then((res) => {
				// console.log('networkSpeed', networkSpeed)
				networkSpeed = res
			})
		}
	}
	if (customizeOutput.indexOf('{NetworkSpeed}') >= 0) {
		customizeOutput = customizeOutput.replace(
			'{NetworkSpeed}',
			formartNetworkSpeed(networkSpeed.download + networkSpeed.upload)
		)
	}

	if (customizeOutput.indexOf('{NetworkUploadSpeed}') >= 0) {
		customizeOutput = customizeOutput.replace(
			'{NetworkUploadSpeed}',
			formartNetworkSpeed(networkSpeed.upload)
		)
	}

	if (customizeOutput.indexOf('{NetworkDownloadSpeed}') >= 0) {
		customizeOutput = customizeOutput.replace(
			'{NetworkDownloadSpeed}',
			formartNetworkSpeed(networkSpeed.download)
		)
	}

	if (customizeOutput.indexOf('{Battery') >= 0) {
		if (count % 60 === 0 || count === 1) {
			si.battery().then((res) => {
				batteryCycleCount = res.cycleCount
				batteryPercent = String(String(res.percent) + '%').padStart(3, '0')
			})
		}
	}

	if (customizeOutput.indexOf('{BatteryPercent}') >= 0) {
		customizeOutput = customizeOutput.replace(
			'{BatteryPercent}',
			batteryPercent
		)
	}

	// TEST
	if (customizeOutput.indexOf('{BatteryCycleCount}') >= 0) {
		customizeOutput = customizeOutput.replace(
			'{BatteryCycleCount}',
			String(batteryCycleCount)
		)
	}

	if (customizeOutput.indexOf('{CPUTemp}') >= 0) {
		customizeOutput = customizeOutput.replace('{CPUTemp}', cpuTemp)
		if (count % interval === 0) {
			si.cpuTemperature().then((res) => {
				cpuTemp = JSON.stringify(res)
			})
		}
	}
	if (customizeOutput.indexOf('{CPUCurrentSpeed}') >= 0) {
		customizeOutput = customizeOutput.replace(
			'{CPUCurrentSpeed}',
			cpuCurrentSpeed
		)
		if (count % interval === 0) {
			si.cpuCurrentSpeed().then((res) => {
				cpuCurrentSpeed = JSON.stringify(res)
			})
		}
	}
	if (customizeOutput.indexOf('{CPUCurrentSpeed}') >= 0) {
		customizeOutput = customizeOutput.replace(
			'{CPUCurrentSpeed}',
			cpuCurrentSpeed
		)
		if (count % interval === 0) {
			si.cpuCurrentSpeed().then((res) => {
				cpuCurrentSpeed = JSON.stringify(res)
			})
		}
	}
	if (customizeOutput.indexOf('{BootTime}') >= 0) {
		const ot = oss.uptime()
		uptime.d = Math.floor(ot / (3600 * 24))
		uptime.m = Math.floor(ot / 60) % 60
		uptime.s = Math.floor(ot % 60)
		uptime.h = Math.floor(ot / 3600) % 24
		customizeOutput = customizeOutput.replace(
			'{BootTime}',
			`${uptime.d}:${String(uptime.h).padStart(2, '0')}:${String(
				uptime.m
			).padStart(2, '0')}:${String(uptime.s).padStart(2, '0')}`
		)
		// if (count % interval === 0) {
		// }
	}
	if (customizeOutput.indexOf('{Top}') >= 0) {
		customizeOutput = customizeOutput.replace(
			'{Top}',
			String(windows.get('/monitor.html').isAlwaysOnTop())
		)
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
	console.log('a', a)

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
	reloadMonitor()
}

import oss from 'os'
console.log(
	oss.cpus().map((v) => {
		return v.times.user
	})
)
