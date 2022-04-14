const { test, expect } = require('@playwright/test');
const fs = require('fs');
const { apiTransfer } = require('../api/rg.js');

test.describe('充值', () => {
  let providerList;
  test.beforeEach(async () => {
    providerList = JSON.parse(await fs.readFileSync('data/providers.json', 'utf8')).default;
  });

  test('全部充值一元', async () => {
    for (let ProviderID of providerList) {
      const requestData = { ProviderID, TransferType: 1, TransferMoney: '1' };
      const result = await apiTransfer(requestData);
      expect(result.ErrorCode).toEqual('0');
    }
  });
});
