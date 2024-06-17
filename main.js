const { app, BrowserWindow, ipcMain } = require('electron');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

let mainWindow;
let puppeteerWindow;

app.on('ready', () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile('index.html');
});

ipcMain.on('execute-script', async (event, script) => {
  try {
    if (puppeteerWindow) {
      puppeteerWindow.close();
    }

    puppeteerWindow = new BrowserWindow({
      width: 800,
      height: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    const browser = await puppeteer.launch({
      headless: false,
      args: [`--app=${puppeteerWindow.webContents.getURL()}`],
    });

    const page = await browser.newPage();

    // 加载用户输入的Puppeteer脚本
    const userFlow = JSON.parse(script);
    for (const step of userFlow.steps) {
      if (step.type === 'navigate') {
        await page.goto(step.url);
      } else if (step.type === 'click') {
        await page.click(step.target);
      } else if (step.type === 'setViewport') {
        const viewport = {
          width:  1280,
          height:  800,
          isMobile:  false,
          hasTouch: false,
          isLandscape:  false,
        };
        await page.setViewport(viewport);
      } else if (step.type === 'emulateNetworkConditions') {
        await page.emulateNetworkConditions(step.networkConditions);
      }
      // 处理其他类型的步骤...
    }

    // 保留登录cookie
    const cookies = await page.cookies();
    fs.writeFileSync('cookies.json', JSON.stringify(cookies, null, 2));

    await browser.close();
  } catch (error) {
    console.error('Error executing script:', error);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
