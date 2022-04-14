const { test, expect } = require('@playwright/test');
// const { firefox } = require('playwright'); // 'firefox'、'chromium'、'webkit'.
const fs = require('fs');
const dayjs = require('dayjs');
const numeral = require('numeral');
const { apiGetMemberSessionKey, apiGetGameUrl } = require('../api/rg.js');
const { getImageNumber, checkImageDiff } = require('../utils/image');
const { appendData } = require('../utils/file');
const { RG_BET_REPORT_PATH, RG_API_MEMBER_ID, BUCKET } = require('../settings.js');

test.describe('RG', () => {
  let JsonData, session, gameUrl, screenshotPath;

  test.beforeEach(async () => {
    JsonData = JSON.parse(await fs.readFileSync('data/bet/ae.json', 'utf8'));
    screenshotPath = `screenshots/${JsonData.ProviderID}`;
  });

  test('Get Session', async () => {
    let requestData = { GameType: JsonData.GameType, ServerName: JsonData.ServerName };
    let result = await apiGetMemberSessionKey(requestData);
    expect(result.ErrorCode).toEqual('0');
    session = result.SessionKey;
    console.log('session: ', session);
  });

  test('Get GameUrl', async () => {
    requestData = { SessionKey: session };
    result = await apiGetGameUrl(requestData);
    expect(result.ErrorCode).toEqual('0');
    gameUrl = result.List.GameUrl;
    console.log('gameUrl: ', gameUrl);
  });

  test('Bet', async ({ page }) => {
    await page.goto(gameUrl);
    await page.waitForTimeout(3000);
    await expect(page.locator('#mCSB_1')).toBeVisible();
    await page.waitForTimeout(3000);
    await page.click('html', { position: { x: 0, y: 0 } });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${screenshotPath}/${JsonData.ServerName}.png` });

    let balanceStart = 0;
    let balanceEnd = 0;
    let winLose = 0;
    const balanceStartPath = `${screenshotPath}/balance--start.png`;
    const balanceEndPath = `${screenshotPath}/balance--end.png`;
    const balanceClip = { x: 1011, y: 667, width: 158, height: 26 };
    const startButtonOriginPath = `${screenshotPath}/start--origin.png`;
    const startButtonCurrentPath = `${screenshotPath}/start--current.png`;
    const startButtonClip = { x: 601, y: 598, width: 88, height: 85 };
    const startPos = { x: 640, y: 640 };

    //* 擷取開始按鈕
    await page.screenshot({ path: startButtonOriginPath, clip: startButtonClip });

    async function startBet() {
      //* 擷取帳戶餘額 (開始)
      await page.screenshot({ path: balanceStartPath, clip: balanceClip });
      balanceStart = await getImageNumber(balanceStartPath);
      console.log(`帳戶餘額 (開始): ${balanceStart}`);

      //* 點擊開始按鈕
      await page.click('html', { position: startPos });

      //* 比對開始按鈕 (是否結束)
      const checkCount = 6;
      for (let i = 0; i < checkCount; i++) {
        await page.waitForTimeout(10000);
        await page.screenshot({ path: startButtonCurrentPath, clip: startButtonClip });
        const result = await checkImageDiff(startButtonOriginPath, startButtonCurrentPath);
        if (result) {
          break;
        }
      }

      //* 擷取帳戶餘額 (結束)
      await page.screenshot({ path: balanceEndPath, clip: balanceClip });
      balanceEnd = await getImageNumber(balanceEndPath);
      winLose = balanceEnd === 0 ? 0 : balanceEnd - balanceStart;
      console.log(`中獎金額: ${winLose}`);
      console.log(`帳戶餘額: ${balanceEnd}`);

      //* 加進 RG_BET_REPORT_PATH
      const betData = {
        ...JsonData,
        WinLose: numeral(winLose).format('0.00'),
        MemberID: RG_API_MEMBER_ID,
        BucketID: BUCKET,
        Date: dayjs().format('YYYY/MM/DD HH:mm:ss'),
      };
      appendData(RG_BET_REPORT_PATH, betData);
    }

    const count = 2;
    for (let i = 0; i < count; i++) {
      await startBet();
    }
  });
});
