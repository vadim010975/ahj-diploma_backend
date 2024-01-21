const mime = require('mime-types');
const fs = require('fs');
const path = require('path');
const public = path.join(path.dirname(__dirname), '/public');
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

  loadHistory(folder) {
    const elements = fs.readdirSync(public);

    const folders = elements.filter(element => {
      const stats = fs.statSync(public + '/' + element);
      if (stats.isDirectory()) return true;
    });

    const arrayLength = folders.length;

    folders.sort();

    const data = [];

    let startIdx, endIdx;

    if (arrayLength === 0) {
      console.log('контентная папка пустая');
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


    if (file === '%message%.txt' || file === '%link%.txt') {

      const message = fs.readFileSync(public + filePath, 'utf8');

      return {
        type: file === '%message%.txt' ? 'message' : 'link',
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
      mimetype: mimetype,
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

  filter(search) {
    const folders = fs.readdirSync(public);
    let file;
    const data = [];
    folders.forEach(folder => {
      const files = (fs.readdirSync(public + '/' + folder));
      files.forEach(el => {
        if (el === '%message%.txt' || el === '%link%.txt') {
          file = el;
          const textInFile = fs.readFileSync(public + '/' + folder + '/' + file, 'utf8');
          const clean = search.trim().toLowerCase();
          if (textInFile.toLowerCase().startsWith(clean)) {
            const res = this.createResponse(folder);
            if (res) {
              data.push(res);
            }
          }
        }
      });
    });
    return {
      type: 'find',
      data,
    };
  },

  getInformation() {
    const folders = fs.readdirSync(public);
    let images = 0, videos = 0, audios = 0, messages = 0, links = 0, otherFiles = 0;
    folders.forEach(folder => {
      const files = (fs.readdirSync(public + '/' + folder));
      files.forEach(file => {
        if (file != 'geolocation.txt') {
          console.log(file);
          const mimetype = mime.lookup(public + folder + file).split('/')[0];
          console.log(mimetype);
          if (file === '%message%.txt') {
            console.log('messages');
            messages += 1;
          } else if (file === '%link%.txt') {
            console.log('links');
            links += 1;
          } else if (mimetype === 'image') {
            console.log('images');
            images += 1;
          } else if (mimetype === 'audio') {
            console.log('audios');
            audios += 1;
          } else if (mimetype === 'video') {
            console.log('video');
            videos += 1;
          } else {
            console.log('otherFiles');
            otherFiles += 1;
          }
        }
      });
    });
    return {
      images,
      videos,
      audios,
      messages,
      links,
      otherFiles,
      all: folders.length,
    }
  }
}

module.exports = db;