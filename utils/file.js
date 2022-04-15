const fs = require('fs');

module.exports = {
  async appendJSONData(filename, data) {
    //* 查看是否已有檔案，沒有的話就新增，並把標頭文字填入
    let fileData = [];
    try {
      const result = await fs.readFileSync(filename, { encoding: 'utf8' });
      fileData = JSON.parse(result);
    } catch {}

    fileData.push(data);
    await fs.writeFileSync(filename, JSON.stringify(fileData));
    return null;
  },
  removeFile(path) {
    try {
      fs.unlinkSync(path);
    } catch (error) {}
    return null;
  },
};
