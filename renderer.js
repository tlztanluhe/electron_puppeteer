const { ipcRenderer } = require('electron');

document.getElementById('run').addEventListener('click', () => {
  const script = document.getElementById('script').value;
  ipcRenderer.send('run-script', script);
});
