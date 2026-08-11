import { Response } from 'express';
import { ApiSuccessResponse, ResponseMeta } from '../shared/types';
import { HTTP_STATUS } from '../shared/constants';

export const sendSuccess = <T>(
  res: Response,
  data: T,
  options: {
    message?: string;
    statusCode?: number;
    meta?: ResponseMeta;
    requestId?: string;
  } = {},
): void => {
  const { message, statusCode = HTTP_STATUS.OK, meta, requestId } = options;
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    message,
    meta,
    requestId,
    timestamp: new Date().toISOString(),
  };
  res.status(statusCode).json(response);
};

export const sendCreated = <T>(
  res: Response,
  data: T,
  message = 'Resource created successfully',
  requestId?: string,
): void => {
  sendSuccess(res, data, {
    message,
    statusCode: HTTP_STATUS.CREATED,
    requestId,
  });
};

export const sendNoContent = (res: Response): void => {
  res.status(HTTP_STATUS.NO_CONTENT).send();
};

export const sendPaginated = <T>(
  res: Response,
  result: { data: T[]; meta: ResponseMeta },
  requestId?: string,
): void => {
  sendSuccess(res, result.data, {
    meta: result.meta,
    requestId,
  });
};
