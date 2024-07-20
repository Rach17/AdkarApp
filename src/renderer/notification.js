window.electron.ipcRenderer.on('show-notification', (event, message) => {
    console.log('Received notification:', message);
    const notificationElement = document.getElementById('notification');
    notificationElement.innerText = message;
});