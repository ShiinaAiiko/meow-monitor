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
  log,
  R,
  language,
  customizeOutput,
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
            temperature = v.substring(tempIndex - 4, tempIndex).trim() + '℃'

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
        const res: any = await si.networkInterfaces()
        // log.info("res1111111111111", res)
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
              // log.info(netStats)
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

import { openWeatherWMOToEmoji } from '@akaguny/open-meteo-wmo-to-emoji'

// 专门在后台跑的采集器，确保同一时间只有一个底层命令在执行

let timer2: NodeJS.Timeout
export const startHardwareCollection = (
  updateSpeed: 'high' | 'normal' | 'low'
) => {
  clearInterval(timer2)

  const intervalMap = { high: 1000, normal: 2000, low: 5000 }
  const delay = intervalMap[updateSpeed] || 2000
  let interval = updateSpeed === 'high' ? 1 : updateSpeed === 'normal' ? 2 : 5

  const init = async () => {
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

    si.cpuTemperature().then((res) => {
      cpuTemp = JSON.stringify(res)
    })
    si.cpuCurrentSpeed().then((res) => {
      cpuCurrentSpeed = JSON.stringify(res)
    })

    if (customizeOutput.indexOf('Mem') >= 0) {
      totalMem = os.totalmem()
      freememPercentage = os.freememPercentage()
      freeMem = os.freemem()
    }

    if (customizeOutput.indexOf('{NVGPU}') >= 0) {
      getNvidiaGPUUsage().then((res) => {
        nvgpuUsage = res
      })
    }

    if (count % (interval * 3 > 10 ? 10 : interval * 3) === 0 || count === 1) {
      getNetworkSpeed().then((res) => {
        // console.log('networkSpeed', networkSpeed)
        networkSpeed = res
      })
    }

    if (customizeOutput.indexOf('Battery') >= 0) {
      if (count % 60 === 0 || count === 1) {
        si.battery().then((res) => {
          batteryCycleCount = res.cycleCount
          batteryPercent = String(String(res.percent) + '%').padStart(3, '0')
        })
      }
    }

    if (customizeOutput.indexOf('{Latlng') >= 0) {
      const latlngRegex =
        /\{Latlng\[\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\]\}/i
      const match = customizeOutput.match(latlngRegex)

      if (match) {
        curLatlng.lat = Number(match[1])
        curLatlng.lng = Number(match[2])
      }
    }
    if (
      customizeOutput.indexOf('{Latlng') >= 0 ||
      customizeOutput.indexOf('{Weather}') >= 0 ||
      customizeOutput.indexOf('{Country}') >= 0 ||
      customizeOutput.indexOf('{State}') >= 0 ||
      customizeOutput.indexOf('{Region}') >= 0 ||
      customizeOutput.indexOf('{City}') >= 0 ||
      customizeOutput.indexOf('{Temperature}') >= 0 ||
      customizeOutput.indexOf('{ApparentTemperature}') >= 0 ||
      customizeOutput.indexOf('{WindSpeed}') >= 0 ||
      customizeOutput.indexOf('{WindDirection}') >= 0 ||
      customizeOutput.indexOf('{Humidity}') >= 0
    ) {
      if (count % 30 === 0 || count === 1) {
        getWeather()
      }
      if (count % 150 === 0) {
        getCity()
      }
    }
  }
  init()
  timer2 = setInterval(init, delay)
}

export const generateMonitorData = (customizeOutput: string) => {
  let interval = updateSpeed === 'high' ? 1 : updateSpeed === 'normal' ? 2 : 5

  count++
  // console.log('customizeOutput', customizeOutput)

  customizeOutput = customizeOutput.replace(/&nbsp;?/g, ' ')

  customizeOutput = customizeOutput.replace(
    /\{Time(?:\[([^\]]+)\])?\}/gi,
    (match, formatStr) => {
      const finalFormat = formatStr ? formatStr : 'YYYY-MM-DD HH:mm:ss'
      return moment().locale(language.toLowerCase()).format(finalFormat)
    }
  )

  if (customizeOutput.indexOf('{CPU}') >= 0) {
    // console.log(count, count % 3 === 0)
    // console.log(cpuUsage)
    customizeOutput = customizeOutput.replace(
      '{CPU}',
      cpuUsage.padStart(placeholderLength, placeholder)
    )
  }
  if (customizeOutput.indexOf('{MemUsage}') >= 0) {
    // console.log(count, count % 3 === 0)
    customizeOutput = customizeOutput.replace(
      '{MemUsage}',
      (String(Math.round((1 - freememPercentage) * 100)) + '%').padStart(
        placeholderLength,
        placeholder
      )
    )
  }
  if (customizeOutput.indexOf('{MemUsed') >= 0) {
    const memUsedRegex = /\{MemUsed(?:\[(GB|MB)\])?\}/gi
    customizeOutput = customizeOutput.replace(memUsedRegex, (match, unit) => {
      // 把原本的字节(Byte)转成对应的 MB
      const memInMB = totalMem - freeMem

      // 判断用户传的单位，如果是 GB 就除以 1024，否则默认输出 MB
      if (unit && unit.toUpperCase() === 'GB') {
        return (memInMB / 1024).toFixed(1) + 'GB' // 保留一位小数，如 7.5GB
      }
      return Math.round(memInMB) + 'MB' // 默认 MB，如 7680MB
    })
  }
  if (customizeOutput.indexOf('{MemFree') >= 0) {
    const memFreeRegex = /\{MemFree(?:\[(GB|MB)\])?\}/gi
    customizeOutput = customizeOutput.replace(memFreeRegex, (match, unit) => {
      // 把原本的字节(Byte)转成对应的 MB
      const memInMB = freeMem

      // 判断用户传的单位，如果是 GB 就除以 1024，否则默认输出 MB
      if (unit && unit.toUpperCase() === 'GB') {
        return (memInMB / 1024).toFixed(1) + 'GB' // 保留一位小数，如 7.5GB
      }
      return Math.round(memInMB) + 'MB' // 默认 MB，如 7680MB
    })
  }
  if (customizeOutput.indexOf('{MemTotal') >= 0) {
    const memTotalRegex = /\{MemTotal(?:\[(GB|MB)\])?\}/gi
    customizeOutput = customizeOutput.replace(memTotalRegex, (match, unit) => {
      // 把原本的字节(Byte)转成对应的 MB
      const totalInMB = totalMem

      if (unit && unit.toUpperCase() === 'GB') {
        return (totalInMB / 1024).toFixed(1) + 'GB' // 总内存一般是整数，如 16GB
      }
      return Math.round(totalInMB) + 'MB'
    })
  }
  if (customizeOutput.indexOf('{NVGPU}') >= 0) {
    customizeOutput = customizeOutput.replace(
      '{NVGPU}',
      nvgpuUsage.utilization
        ? String(nvgpuUsage.utilization).padStart(3, '0')
        : '00%'
    )
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

  if (customizeOutput.indexOf('{Network') >= 0) {
    if (count % interval === 0 || count === 1) {
      networkSpeed.download += Math.random() * 10 - 5
      networkSpeed.upload += Math.random() * 10 - 5
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
  }
  if (customizeOutput.indexOf('{CPUCurrentSpeed}') >= 0) {
    customizeOutput = customizeOutput.replace(
      '{CPUCurrentSpeed}',
      cpuCurrentSpeed
    )
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

  if (customizeOutput.indexOf('{Latlng') >= 0) {
    const latlngRegex =
      /\{Latlng\[\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\]\}/gi

    customizeOutput = customizeOutput.replace(latlngRegex, '')
  }
  if (customizeOutput.indexOf('{WeatherEmoji}') >= 0) {
    const emoji = openWeatherWMOToEmoji(Number(cityIpInfo.weatherCode))
    customizeOutput = customizeOutput.replace('{WeatherEmoji}', emoji.value)
  }
  if (customizeOutput.indexOf('{Weather}') >= 0) {
    customizeOutput = customizeOutput.replace('{Weather}', cityIpInfo.weather)
  }
  if (customizeOutput.indexOf('{Country}') >= 0) {
    customizeOutput = customizeOutput.replace('{Country}', cityIpInfo.country)
  }
  if (customizeOutput.indexOf('{State}') >= 0) {
    customizeOutput = customizeOutput.replace('{State}', cityIpInfo.state)
  }
  if (customizeOutput.indexOf('{Region}') >= 0) {
    customizeOutput = customizeOutput.replace('{Region}', cityIpInfo.regionName)
  }
  if (customizeOutput.indexOf('{City}') >= 0) {
    customizeOutput = customizeOutput.replace('{City}', cityIpInfo.city)
  }
  if (customizeOutput.indexOf('{Temperature}') >= 0) {
    customizeOutput = customizeOutput.replace(
      '{Temperature}',
      String(cityIpInfo.temperature) + '℃'
    )
  }
  if (customizeOutput.indexOf('{ApparentTemperature}') >= 0) {
    customizeOutput = customizeOutput.replace(
      '{ApparentTemperature}',
      String(cityIpInfo.apparentTemperature) + '℃'
    )
  }
  if (customizeOutput.indexOf('{WindSpeed}') >= 0) {
    customizeOutput = customizeOutput.replace(
      '{WindSpeed}',
      String(cityIpInfo.windSpeed) + 'km/h'
    )
  }
  if (customizeOutput.indexOf('{WindDirection}') >= 0) {
    customizeOutput = customizeOutput.replace(
      '{WindDirection}',
      cityIpInfo.windDirection
    )
  }
  if (customizeOutput.indexOf('{Humidity}') >= 0) {
    customizeOutput = customizeOutput.replace(
      '{Humidity}',
      String(cityIpInfo.humidity) + '%'
    )
  }
  if (customizeOutput.indexOf('{Top}') >= 0) {
    customizeOutput = customizeOutput.replace(
      '{Top}',
      String(windows.get('/monitor.html').isAlwaysOnTop())
    )
  }
  return customizeOutput.replace(/ /g, '&nbsp;')
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
import { Debounce } from '@nyanyajs/utils'
// console.log(
//   oss.cpus().map((v) => {
//     return v.times.user
//   })
// )

let curLatlng = {
  lat: 0,
  lng: 0,
}

let cityIpInfo = {
  ipv4: '',
  ipv6: '',
  country: '',
  regionName: '',
  city: '',
  lon: 0,
  lat: 0,
  timezone: '',
  isp: '',
  org: '',
  temperature: -273.15,
  humidity: 0,
  weatherCode: '',
  weather: '',
  apparentTemperature: -273.15,
  windSpeed: 0,
  windDirection: '',
  state: '',
}

// import { translate } from '@vitalets/google-translate-api';

export const getCity = async () => {
  // https://tools.aiiko.club/api/v1/ip/details?ip=&language=en-US

  if (curLatlng.lat && curLatlng.lng) {
    const res = await R.request({
      method: 'GET',
      url: `https://tools.aiiko.club/api/v1/geocode/regeo?latitude=${curLatlng.lat || cityIpInfo.lat}&longitude=${curLatlng.lng || cityIpInfo.lon}&platform=Amap`,
    })
    // log.info(res.data)
    if (res.data?.code === 200 && res.data?.data?.address) {
      const data = res.data.data
      cityIpInfo = {
        ...cityIpInfo,
        country: data.country,
        state: data.state,
        regionName: data.region,
        city: data.city,
        lon: curLatlng.lng,
        lat: curLatlng.lat,
      }
    }
    return
  }

  const res = await R.request({
    method: 'GET',
    url: `https://tools.aiiko.club/api/v1/ip/details?ip=&language=${language.indexOf('zh') >= 0 ? 'zh-CN' : language}`,
  })
  // log.info(res.data)
  if (res.data.code === 200 && res.data.data?.lat) {
    const data = res.data.data
    cityIpInfo = {
      ...cityIpInfo,
      ipv4: data.ipv4,
      ipv6: data.ipv6,
      country: data.country,
      regionName: data.regionName,
      city: data.city,
      lon: data.lon,
      lat: data.lat,
      timezone: data.timezone,
      isp: data.isp,
      org: data.org,
    }

    // log.info(await translate(cityIpInfo.city, {
    //   to: "zh-TW"
    // }))
  }
}

export const getWeather = async () => {
  if (!cityIpInfo.city) {
    await getCity()
  }

  const res = await R.request({
    method: 'GET',
    url: `https://api.open-meteo.com/v1/forecast?latitude=${curLatlng.lat || cityIpInfo.lat}&longitude=${curLatlng.lng || cityIpInfo.lon}&current=${[
      'temperature_2m',
      'weather_code',
      'relative_humidity_2m',
      'wind_speed_10m',
      'apparent_temperature',
      'dew_point_2m',
      'wind_speed_10m',
      'wind_direction_10m',
    ].join(',')}`,
  })
  const data = res?.data as any
  if (!data) return
  cityIpInfo = {
    ...cityIpInfo,
    temperature: data?.current?.temperature_2m || -273.15,
    apparentTemperature: data?.current?.apparent_temperature || -273.15,
    windSpeed: data?.current?.wind_speed_10m || 0,
    windDirection: data?.current?.wind_direction_10m || 0,
    humidity: data?.current?.relative_humidity_2m || 0,
    weatherCode: data?.current?.weather_code || '',

    weather: t(('weather' + (data?.current?.weather_code || 0)) as any),
  }
  log.info(cityIpInfo.temperature)

  const wd = data?.current?.wind_direction_10m || 0

  if (wd >= 337.5 || wd < 22.5) {
    cityIpInfo.windDirection = t('windDirection1')
  }
  if (wd >= 22.5 && wd < 67.5) {
    cityIpInfo.windDirection = t('windDirection2')
  }
  if (wd >= 67.5 && wd < 112.5) {
    cityIpInfo.windDirection = t('windDirection3')
  }
  if (wd >= 112.5 && wd < 157.5) {
    cityIpInfo.windDirection = t('windDirection4')
  }
  if (wd >= 157.5 && wd < 202.5) {
    cityIpInfo.windDirection = t('windDirection5')
  }
  if (wd >= 202.5 && wd < 247.5) {
    cityIpInfo.windDirection = t('windDirection6')
  }
  if (wd >= 247.5 && wd < 292.5) {
    cityIpInfo.windDirection = t('windDirection7')
  }
  if (wd >= 292.5 && wd < 337.5) {
    cityIpInfo.windDirection = t('windDirection8')
  }
  if (wd === -999) {
    cityIpInfo.windDirection = t('windDirection9')
  }
  if (wd === -1) {
    cityIpInfo.windDirection = t('windDirection10')
  }
}
