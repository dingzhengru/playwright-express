const fs = require('fs');
const ip = require('ip');
const dayjs = require('dayjs');
const { exec } = require('child_process');
const { appendJSONData } = require('./utils/file');
const asyncHandler = require('express-async-handler');
const express = require('express');
const app = express();
const port = 3000;

app.use('/logs', express.static('logs'));
app.set('view engine', 'ejs');

const myLogger = function (req, res, next) {
  console.log(`----------------Request----------------`);
  console.log(req.url);
  console.log(`query`, req.query);
  console.log(`params`, req.params);
  if (req.url.includes('log') === false) {
    const log = {
      title: `Request: ${req.url}`,
      data: JSON.stringify(req.query),
      type: '',
    };
    appendJSONData(`logs/${dayjs().format('YYYY-MM-DD')}.json`, log);
  }

  next();
};

app.use(myLogger);

app.get('/search', (req, res) => {
  console.log('[Request] /', req.query);
  process.env.REQUEST_BODY = JSON.stringify(req.query);
  exec('npm run google-search--no-head', (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
  });
  res.send(req.query);
});

app.get(
  '/log',
  asyncHandler(async (req, res, next) => {
    const date = req.query.d || dayjs().format('YYYY-MM-DD');
    let logData = JSON.parse(await fs.readFileSync(`logs/${date}.json`, { encoding: 'utf8' }));

    res.render('log', {
      //* 這邊不用寫 views/index 是因為 express 預設 template 就是會放在 views 資料夾裡面
      result: logData,
    });
  })
);

app.listen(port, () => {
  console.log(`listening on  ${ip.address()}:${port}`);
});
