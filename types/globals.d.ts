/// <reference types="@clerk/express/env" />

interface authRequest<ReqBody = { user: IUser }> extends Request {}
