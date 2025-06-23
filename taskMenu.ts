import {
  BrowserWindow,
  globalShortcut,
  Tray,
  app,
  Menu,
  MenuItem,
  nativeTheme,
  ipcMain,
  ipcRenderer,
  Notification, screen
} from 'electron'
import { windows, openMainWindows, createWindow } from './windows'
import {
  initConfig,
  logo,
  systemConfig,
  taskIcon,
  // processName,
  // priority,
  // interval,
  // msg,
  language,
  setLanguage,
  setAlignment,
  alignment,
  style,
  setStyle,
  dragPosition,
  setDragPosition,
  autoStart,
  setAutoStart,
  updateSpeed,
  setUpdateSpeed,
  setFontSize,
  fontSize,
} from './config'

import {
  isStart,
  time,
  lastTime,
  start,
  reloadMonitor,
  openDrag,
} from './modules/methods'
import { t } from './modules/languages'
import { exec } from 'child_process'
import { version } from './package.json'
import { autoLauncher } from './main'

export let appTray: Tray

export const getMenu = () => {
  const contextMenu = Menu.buildFromTemplate([
    {
      label: t('configure'),
      click() {
        openMainWindows()
      },
    },
    {
      label: t('alignment'),
      submenu: [
        {
          label: t('left'),
          checked: alignment === 'left',
          type: 'radio',
          click() {
            reloadMonitor()
            setAlignment('left')
          },
        },
        {
          label: t('center'),
          checked: alignment === 'center',
          type: 'radio',
          click() {
            reloadMonitor()
            setAlignment('center')
          },
        },
      ],
    },
    {
      label: t('style'),
      submenu: [
        {
          label: t('dark'),
          checked: style === 'dark',
          type: 'radio',
          click() {
            reloadMonitor()
            setStyle('dark')
          },
        },
        {
          label: t('light'),
          checked: style === 'light',
          type: 'radio',
          click() {
            reloadMonitor()
            setStyle('light')
          },
        },
        {
          sublabel: t('left'),
          type: "separator",
        },
        {
          label: t('fontSize'),
          submenu: [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map((v) => {
            const ft = v + "px"
            return {
              label: ft,
              checked: fontSize === ft,
              type: 'radio',
              click() {
                reloadMonitor()
                setFontSize(ft)
              },
            }
          })
        },
      ],
    },
    {
      label: t('updateSpeed'),
      submenu: [
        {
          label: t('high') + ' (1s)',
          checked: updateSpeed === 'high',
          type: 'radio',
          click() {
            setUpdateSpeed('high')
            reloadMonitor()
          },
        },
        {
          label: t('normal') + ' (2s)',
          checked: updateSpeed === 'normal',
          type: 'radio',
          click() {
            setUpdateSpeed('normal')
            reloadMonitor()
          },
        },
        {
          label: t('low') + ' (5s)',
          checked: updateSpeed === 'low',
          type: 'radio',
          click() {
            setUpdateSpeed('low')
            reloadMonitor()
          },
        },
      ],
    },
    {
      label: t('dragPosition'),
      submenu: [
        {
          label: t('open'),
          checked: dragPosition === 'open',
          type: 'radio',
          click() {
            openDrag('open')
            reloadMonitor()
          },
        },
        {
          label: t('close'),
          checked: dragPosition === 'close',
          type: 'radio',
          click() {
            openDrag('close')
            reloadMonitor()
          },
        },
        {
          label: t('defaultLocation'),
          async click() {
            // const w = screen.getPrimaryDisplay().workAreaSize.width
            // if (alignment === "center") {
            //   await systemConfig.set('/monitor.html' + 'x', 0)
            // }
            // if (alignment === "left") {
            // }
            await systemConfig.set('/monitor.html' + 'x', 0)
            await systemConfig.set('/monitor.html' + 'y', 0)
            reloadMonitor()
            // setDragPosition('defaultLocation')
          },
        },
      ],
    },
    {
      label: t('autoStart'),
      submenu: [
        {
          label: t('open'),
          checked: autoStart === 'open',
          type: 'radio',
          click() {
            // app.setLoginItemSettings({
            // 	openAtLogin: true,
            // })
            autoLauncher.enable()
            setAutoStart('open')
          },
        },
        {
          label: t('close'),
          checked: autoStart === 'close',
          type: 'radio',
          click() {
            // app.setLoginItemSettings({
            // 	openAtLogin: false,
            // })
            autoLauncher.disable()
            setAutoStart('close')
          },
        },
      ],
    },
    {
      label: t('languages'),
      submenu: [
        {
          label: t('enUS'),
          checked: language === 'en-US',
          type: 'radio',
          click() {
            setLanguage('en-US')
          },
        },
        {
          label: t('zhCN'),
          checked: language === 'zh-CN',
          type: 'radio',
          click() {
            setLanguage('zh-CN')
          },
        },
        {
          label: t('zhTW'),
          checked: language === 'zh-TW',
          type: 'radio',
          click() {
            setLanguage('zh-TW')
          },
        },
      ],
    },
    {
      label: t('about'),
      submenu: [
        {
          label: t('version') + ': ' + version,
          enabled: false,
        },
        {
          label: t('github'),
          click() {
            exec('start https://github.com/ShiinaAiiko/meow-monitor')
          },
        },
      ],
    },
    {
      label: t('quit'),
      click() {
        //ipc.send('close-main-window');
        app.quit()
      },
    },
  ])
  return contextMenu
}

//系统托盘右键菜单
export const createTaskMenu = async (type?: 'pink' | 'white') => {
  appTray && appTray.destroy()
  //系统托盘图标目录
  // console.log(1, iconDir)
  // console.log(
  // 	2,
  // 	'/home/shiina_aiiko/Development/@Aiiko/ShiinaAiikoDevWorkspace/@OpenSourceProject/meow-sticky-note/client/public/favicon.ico'
  // )

  if (!type) {
    type = (await systemConfig.get('taskMenuIconType')) || 'pink'
  }
  await systemConfig.set('taskMenuIconType', type)

  let icon = type === 'pink' ? taskIcon : taskIcon
  appTray = new Tray(icon)
  appTray.setTitle('aaaaa')
  // console.log(appTray)
  // console.log(iconDir)
  //图标的上下文菜单

  //设置此托盘图标的悬停提示内容
  appTray.setToolTip(t('appName'))

  appTray.addListener('double-click', () => {
    openMainWindows()
  })

  //设置此图标的上下文菜单
  appTray.setContextMenu(getMenu())
}
