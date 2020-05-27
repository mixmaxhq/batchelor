import Batchelor from './';
import nock from 'nock';
import util from 'util';
import fs from 'fs';
import expectedResult from './mocks/result.json';

beforeAll(() => {
  nock.disableNetConnect();
});

describe('Batchelor', () => {
  let client;

  beforeEach(() => {
    client = new Batchelor({
      uri: 'https://www.googleapis.com/batch/gmail/v1/',
      method: 'POST',
      auth: {
        bearer: '',
      },
      headers: {
        'Content-Type': 'multipart/mixed',
      },
    });
    // Make promise based.
    client.run = util.promisify(client.run);
  });

  it('should request an end-point', async () => {
    const scope = nock('https://www.googleapis.com')
      .post('/batch/gmail/v1/')
      .replyWithFile(200, __dirname + '/mocks/response.txt', {
        'Content-Type': 'multipart/mixed; boundary=batch_e18a79KIjgaVUvAf-cfwbL1MtYtcjIqC',
      });

    client.add({
      method: 'GET',
      path: '/gmail/v1/users/me/messages/172166a90d50fe37',
    });
    client.add({
      method: 'GET',
      path: '/gmail/v1/users/me/messages/172163f16b503c65',
    });
    const result = await client.run();

    expect(result).toEqual(expectedResult);
    scope.done();
  });
});
