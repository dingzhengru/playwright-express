const { test, expect } = require('@playwright/test');
const fs = require('fs');
const dayjs = require('dayjs');
const { appendData } = require('../utils/file');
const {
  RG_BACK_URL,
  RG_BACK_ACCOUNT,
  RG_BACK_PASSWORD,
  RG_BACK_GAME_REPORT_URL,
  RG_BACK_GAME_REPORT_PATH,
} = require('../settings.js');

test.describe('查帳', () => {
  let betDataList;
  test.beforeEach(async () => {
    betDataList = JSON.parse(await fs.readFileSync('reports/bet.json', 'utf8'));
    // betDataList = betDataList.filter(item => item)
  });

  test('根據 report 資料查帳', async ({ page }) => {
    await page.goto(RG_BACK_URL);
    await page.fill('input[type="name"]', RG_BACK_ACCOUNT);
    await page.fill('input[type="password"]', RG_BACK_PASSWORD);
    await page.click('button[type="submit"]');
    await page.goto(RG_BACK_GAME_REPORT_URL);
    await page.waitForTimeout(1000);

    // console.log('重新匯總');
    // page.on('dialog', dialog => dialog.dismiss());
    // await page.click('button[onclick="redoGroupAccount()"]');
    // await page.waitForEvent('dialog');
    // await page.waitForTimeout(10000);

    //* 查詢資料
    const searchedServerNameList = []; //* 避免重複查同一遊戲
    for (const item of betDataList) {
      if (searchedServerNameList.includes(item.ServerName)) {
        continue;
      }
      await page.click('#font1');
      await page.selectOption('#GameType', item.GameType);
      await page.selectOption('#GameItem', item.ReportGameItem);

      if (item.ReportServerName !== '') {
        await page.selectOption('#ServerName', item.ReportServerName);
      }

      await page.selectOption('#BucketID', item.BucketID);
      await page.fill('#MemberID', item.MemberID);
      await page.click('.btn.btn-default.S4_1_0');

      //* 確認是否有資料
      await expect(page.locator('#table40')).toBeVisible();
      await page.waitForTimeout(3000);

      const dataCount = betDataList.filter(i => i.ServerName === item.ServerName).length;
      const dataSearched = await page.locator('#table40 tbody tr:visible');
      const dataSearchedCount = await page.locator('#table40 tbody tr:visible').count();

      const winLoseList = [];
      for (let i = 0; i < dataSearchedCount; i++) {
        const item = await dataSearched.nth(i);
        const tdItem = await item.locator('td').nth(10);
        const text = await tdItem.textContent();
        winLoseList.push(text);
      }

      //* 存入 RG_BACK_GAME_REPORT_PATH
      const saveData = {};
      saveData[item.ServerName] = {
        count: dataCount,
        countSearched: dataSearchedCount,
        winLoseList,
        date: dayjs().format('YYYY/MM/DD HH:mm:ss'),
      };
      appendData(RG_BACK_GAME_REPORT_PATH, saveData);

      console.log(item.ProviderID, item.ServerName);
      console.log(`今日筆數: ${dataCount}`);
      console.log(`今日筆數(查詢): ${dataSearchedCount}`);

      searchedServerNameList.push(item.ServerName);
    }
  });
});
