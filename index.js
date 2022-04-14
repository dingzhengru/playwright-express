const { exec } = require('child_process');
const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
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

app.listen(port, () => {
  console.log(`listening on port ${port}`);
});
