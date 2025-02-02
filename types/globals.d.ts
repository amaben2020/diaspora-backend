/// <reference types="@clerk/express/env" />

import { Request } from 'express';
import { ClerkExpressRequireAuth } from '@clerk/express';

declare interface AuthenticatedRequest extends Request {
  auth: NonNullable<Request['auth']>;
}

export { AuthenticatedRequest };
