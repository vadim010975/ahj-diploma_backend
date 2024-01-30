const mime = require('mime-types');
const fs = require('fs');
const path = require('path');
const public = path.join(path.dirname(__dirname), '/public');
const keyFolder = path.join(path.dirname(__dirname), '/key');
const { accessSync, constants } = require('node:fs');


const db = {
  add(file, geolocation) {
    const subfolder = Date.now();
    const uploadFolder = public + '/' + subfolder;
    fs.mkdirSync(uploadFolder);
    fs.copyFileSync(file.filepath, uploadFolder + '/' + file.originalFilename);
    if (geolocation) {
      this.createFileGeolocation(subfolder, geolocation);
    }
    return this.createResponse(subfolder);
  },

  addMessage(text, geolocation) {
    const subfolder = Date.now();
    const uploadFolder = public + '/' + subfolder;
    fs.mkdirSync(uploadFolder);
    const filePath = '/' + subfolder + '/' + '%message%.txt';
    fs.writeFileSync(public + filePath, text);
    if (geolocation) {
      this.createFileGeolocation(subfolder, geolocation);
    }
    return this.createResponse(subfolder);
  },

  addLink(text, geolocation) {
    const subfolder = Date.now();
    const uploadFolder = public + '/' + subfolder;
    fs.mkdirSync(uploadFolder);
    const filePath = '/' + subfolder + '/' + '%link%.txt';
    fs.writeFileSync(public + filePath, text);
    if (geolocation) {
      this.createFileGeolocation(subfolder, geolocation);
    }
    return this.createResponse(subfolder);
  },

  addEncryptedMessage(text, geolocation) {
    const subfolder = Date.now();
    const uploadFolder = public + '/' + subfolder;
    fs.mkdirSync(uploadFolder);
    const filePath = '/' + subfolder + '/' + '%encrypted_message%.txt';
    fs.writeFileSync(public + filePath, text);
    if (geolocation) {
      this.createFileGeolocation(subfolder, geolocation);
    }
    return this.createResponse(subfolder);
  },

  loadHistory({ type, postDate: folder, text }) {
    const folders = this.selectFilesByType({ type, text });
    const arrayLength = folders.length;
    folders.sort();
    const data = [];
    let startIdx, endIdx;
    if (arrayLength === 0) {
      console.log('данных нет');
      return;
    }
    if (arrayLength < 10) {
      startIdx = arrayLength - 1;
      endIdx = 0;
    } else {
      if (folder) {
        const lastIdx = folders.indexOf(folder);
        if (lastIdx === -1) {
          throw new Error('Папка не найдена');
        }
        startIdx = lastIdx - 1;
        endIdx = lastIdx - 10 < 0 ? 0 : lastIdx - 10;
      } else {
        startIdx = arrayLength - 1;
        endIdx = arrayLength - 10;
      }
    }
    for (let i = startIdx; i >= endIdx; i -= 1) {
      const res = this.createResponse(folders[i]);
      if (res) {
        data.push(res);
      }
    }
    return {
      type: 'history',
      data,
    };
  },

  createResponse(subfolder) {
    const files = (fs.readdirSync(public + '/' + subfolder));
    if (files.length === 0) {
      this.removeFolder(subfolder);
      return;
    }
    if (files.length === 1 && files[0] === 'geolocation.txt') {
      this.removeFolder(subfolder);
      return;
    }
    let file, geolocation;
    files.forEach(el => {
      if (el != 'geolocation.txt') {
        file = el;
      } else {
        geolocation = JSON.parse(fs.readFileSync(public + '/' + subfolder + '/' + el, 'utf8'));
      }
    });
    const filePath = '/' + subfolder + '/' + file;
    try {
      accessSync(public + filePath, constants.R_OK);
    } catch (err) {
      console.error('no access!');
      return;
    }
    if (file === '%message%.txt' || file === '%link%.txt' || file === '%encrypted_message%.txt') {
      const message = fs.readFileSync(public + filePath, 'utf8');
      switch(file) {
        case '%message%.txt':
          type = 'message';
          break;
        case '%link%.txt':
          type = 'link';
          break;
        case '%encrypted_message%.txt':
          type = 'encrypted_message';
      }
      return {
        type,
        filePath,
        date: subfolder,
        message,
        geolocation,
      }
    }
    const mimetype = mime.lookup(public + filePath).split('/')[0];
    return {
      type: 'file',
      fileName: file,
      filePath,
      date: subfolder,
      mimetype,
      extname: path.extname(file),
      geolocation,
    }
  },

  removeFolder(subfolder) {
    if (!fs.readdirSync(public).includes(subfolder)) {
      console.log('папка не найдена для удаления');
      return subfolder;
    }
    const folderPath = public + '/' + subfolder;
    fs.rmSync(
      folderPath,
      {
        maxRetries: 5,
        recursive: true,
        retryDelay: 200
      },
      (err) => {
        console.error('ошибка удаления папки' + err);
      });

    if (fs.readdirSync(public).includes(subfolder)) {
      console.log('папка не удалена');
      return;
    }
    return subfolder;
  },

  createFileGeolocation(subfolder, geolocation) {
    const fileName = public + '/' + subfolder + '/' + 'geolocation.txt';
    fs.writeFileSync(fileName, geolocation);
  },

  getInformation() {
    const images = this.selectFilesByType({ type: 'image' }).length;
    const videos = this.selectFilesByType({ type: 'video' }).length;
    const audios = this.selectFilesByType({ type: 'audio' }).length;
    const messages = this.selectFilesByType({ type: 'message' }).length;
    const links = this.selectFilesByType({ type: 'link' }).length;
    const encryptedMessage = this.selectFilesByType({ type: 'encrypted_message' }).length;
    const otherFiles = this.selectFilesByType({ type: 'otherFiles' }).length;
    const all = this.getFolders().length;
    return {
      images,
      videos,
      audios,
      messages,
      links,
      encryptedMessage,
      otherFiles,
      all,
    }
  },

  selectFilesByType({ type, text }) {
    const folders = this.getFolders();
    if (type === 'all') {
      return folders;
    }
    return folders.filter(folder => {
      const file = this.getContentFile(folder);
      const mimetype = mime.lookup(public + folder + file).split('/')[0];
      switch (type) {
        case 'search':
          if (file != '%message%.txt' && file != '%link%.txt') {
            return;
          }
          const textInFile = fs.readFileSync(public + '/' + folder + '/' + file, 'utf8');
          const clean = text.trim().toLowerCase();
          return textInFile.toLowerCase().startsWith(clean);
        case 'message':
          return file === '%message%.txt';
        case 'link':
          return file === '%link%.txt';
        case 'encrypted_message':
          return file === '%encrypted_message%.txt';
        case 'image':
          return mimetype === 'image';
        case 'audio':
          return mimetype === 'audio';
        case 'video':
          return mimetype === 'video';
        default:
          return (
            file != '%message%.txt' &&
            file != '%link%.txt' &&
            file != '%encrypted_message%.txt' &&
            mimetype != 'image' &&
            mimetype != 'audio' &&
            mimetype != 'video'
          );
      }
    });
  },

  getContentFile(folder) {
    const files = (fs.readdirSync(public + '/' + folder));
    return (files.filter(file => file != 'geolocation.txt'))[0];
  },

  getFolders() {
    const elements = fs.readdirSync(public);
    return elements.filter(element => {
      const stats = fs.statSync(public + '/' + element);
      if (stats.isDirectory()) return true;
    });
  },

  saveKey(key) {
    fs.writeFileSync(keyFolder + '/key.txt', key);
    return this.getKey();
  },

  getKey() {
    const files = (fs.readdirSync(keyFolder));
    const file = [...files].find(el => el === 'key.txt');
    if (!file) {
      return { key: '' };
    }
    const key = fs.readFileSync(keyFolder + '/' + file, 'utf8');
    if (key) return { key };
  }
}

module.exports = db;