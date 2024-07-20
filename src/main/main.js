const { app, BrowserWindow, ipcMain, screen, Tray, Menu } = require('electron');
const path = require('path');
const axios = require('axios');
const fs = require('fs');


let notificationWindow;
let tray;

function createNotificationWindow() {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    notificationWindow = new BrowserWindow({
        width: 500,
        x: width - 520,
        y: 20,
        frame: false,
        alwaysOnTop: true,
        transparent: true,
        skipTaskbar: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            enableRemoteModule: false,
            nodeIntegration: false
        }
    });

    notificationWindow.loadFile(path.join(__dirname, '../renderer/notification.html'));
    notificationWindow.hide();
}

async function fetchAdkar() {
    try {
        const data = fs.readFileSync(path.join('data/adkar.json'), 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading adkar.json:', error);
        return [];
    }
}

async function fetchQuranVerses() {
    const surahNumber = Math.floor(Math.random() * 114)+1;
    try {
        const response = await axios.get(`https://api.alquran.cloud/v1/surah/${surahNumber}`);
        console.log(response.data.data.ayahs[0]);
        const ayah = response.data.data.ayahs[Math.floor(Math.random() * response.data.data.numberOfAyahs)];
        console.log(ayah);

        return ayah;
    } catch (error) {
        console.error('Error fetching Quran verses:', error);
        return [];
    }
}

async function fetchCombinedData() {
    const adkar = await fetchAdkar();
    const quranVerses = await fetchQuranVerses();

    // Get a random category from adkar
    const adkarCategories = Object.keys(adkar);
    const randomCategory = adkarCategories[Math.floor(Math.random() * adkarCategories.length)];

    // // Get a random diker from the selected category
    const dikers = adkar[randomCategory];
    const randomDiker = dikers[Math.floor(Math.random() * dikers.length)];

    return [quranVerses];
}

async function showNotification() {
    const combinedData = await fetchCombinedData();
    if (combinedData.length > 0) {
        const randomItem = combinedData[Math.floor(Math.random() * combinedData.length)];
        notificationWindow.webContents.send('show-notification', combinedData[0].text);
        notificationWindow.show();
        setTimeout(() => notificationWindow.hide(), 15000); // Hide notification after 5 seconds
    }
}

app.whenReady().then(() => {
    createNotificationWindow();

    tray = new Tray(path.join('assets/images/icon.png')); // Add your tray icon here
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Quit', click: () => app.quit() }
    ]);
    tray.setToolTip('Adkar Notifier');
    tray.setContextMenu(contextMenu);

    setInterval(showNotification, 5000); // Show notification every 10 seconds

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) {
            createNotificationWindow();
        }
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});
