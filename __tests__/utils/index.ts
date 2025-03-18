import request from 'supertest';

import { userToken as token } from './../config/index';
import { server } from '../..';

const userToken = token();

export const testGetClient = async (url: string) => {
  const response = await request(server)
    .get(url)
    .set('Authorization', `Bearer ${userToken}`)
    .expect(200);

  return response;
};
