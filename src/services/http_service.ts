/*
 * Copyright (c) 2025 Novumlogic Technologies Pvt Ltd
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import axios, {
  AxiosError,
  type AxiosInstance,
  type ResponseType,
} from "axios";
import { Err, Ok, type Result } from "@lib/result.ts";

export const StatusCode = {
  SUCCESS: 0,
  FAILURE: 1,
  NETWORK_ERROR: 2,
} as const;

export type StatusCode = (typeof StatusCode)[keyof typeof StatusCode];

const statusCodeFromKey = (key: string): StatusCode | undefined =>
  (StatusCode as Record<string, StatusCode>)[key];

type ApiErrorBody = {
  errorCode?: string;
  message?: string;
};

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

function isApiErrorBody(x: unknown): x is ApiErrorBody {
  if (!isRecord(x)) return false;
  const ec = x.errorCode;
  const msg = x.message;
  const ecOk = ec === undefined || typeof ec === "string";
  const msgOk = msg === undefined || typeof msg === "string";
  return ecOk && msgOk;
}

export type HttpSuccess<T> = {
  statusCode: StatusCode;
  payload: T;
  cookies?: string[];
};

export type HttpError = {
  statusCode: StatusCode;
  error: string;
  raw?: unknown;
};

export default class HttpService {
  private httpClient: AxiosInstance;
  private REQUEST_TIMEOUT = 1000 * 10;

  public constructor(baseURL: string, options?: { cookies?: string }) {
    this.httpClient =
      options?.cookies === undefined
        ? axios.create({ baseURL, withCredentials: true })
        : axios.create({
            baseURL,
            withCredentials: true,
            headers: { Cookie: options.cookies },
          });
  }

  public async get<T>(
    route: string,
    options?: {
      requestTimeout?: number;
      expectedStatusCode?: number;
      expectedResponseCode?: StatusCode;
      header?: Record<string, string>;
      responseType?: ResponseType;
    },
  ): Promise<Result<HttpSuccess<T>, HttpError>> {
    try {
      const givenOptions: typeof options = {
        requestTimeout: options?.requestTimeout ?? this.REQUEST_TIMEOUT,
        expectedStatusCode: options?.expectedStatusCode ?? 200,
        expectedResponseCode:
          options?.expectedResponseCode ?? StatusCode.SUCCESS,
        header: options?.header ?? undefined,
        responseType: options?.responseType ?? "json",
      };

      const response = await this.httpClient.get<T>(route, {
        timeout: givenOptions.requestTimeout,
        headers: givenOptions.header,
        responseType: givenOptions.responseType,
      });

      if (response.status === givenOptions.expectedStatusCode) {
        return Ok<HttpSuccess<T>>({
          statusCode: givenOptions.expectedResponseCode!,
          payload: response.data,
          cookies: response.headers["set-cookie"] as string[] | undefined,
        });
      }
      throw new AxiosError("INTERNAL:Unknown Error Occurred.");
    } catch (error) {
      return this.errorHandler(error);
    }
  }

  public async post<T>(
    route: string,
    body?: unknown,
    options?: {
      requestTimeout?: number;
      expectedStatusCode?: number;
      expectedResponseCode?: StatusCode;
      header?: Record<string, string>;
      responseType?: ResponseType;
    },
  ): Promise<Result<HttpSuccess<T>, HttpError>> {
    try {
      const givenOptions: typeof options = {
        requestTimeout: options?.requestTimeout ?? this.REQUEST_TIMEOUT,
        expectedStatusCode: options?.expectedStatusCode ?? 200,
        expectedResponseCode:
          options?.expectedResponseCode ?? StatusCode.SUCCESS,
        header: options?.header ?? undefined,
        responseType: options?.responseType ?? "json",
      };

      const response = await this.httpClient.post<T>(route, body, {
        timeout: givenOptions.requestTimeout,
        headers: givenOptions.header,
        responseType: givenOptions.responseType,
      });

      if (response.status === givenOptions.expectedStatusCode) {
        return Ok<HttpSuccess<T>>({
          statusCode: givenOptions.expectedResponseCode!,
          payload: response.data,
          cookies: response.headers["set-cookie"] as string[] | undefined,
        });
      }
      throw new AxiosError("INTERNAL:Unknown Error Occurred.");
    } catch (error) {
      return this.errorHandler(error);
    }
  }

  public async patch<T>(
    route: string,
    body: unknown,
    options?: {
      requestTimeout?: number;
      expectedStatusCode?: number;
      expectedResponseCode?: StatusCode;
      header?: Record<string, string>;
      responseType?: ResponseType;
    },
  ): Promise<Result<HttpSuccess<T>, HttpError>> {
    try {
      const givenOptions: typeof options = {
        requestTimeout: options?.requestTimeout ?? this.REQUEST_TIMEOUT,
        expectedStatusCode: options?.expectedStatusCode ?? 200,
        expectedResponseCode:
          options?.expectedResponseCode ?? StatusCode.SUCCESS,
        header: options?.header ?? undefined,
        responseType: options?.responseType ?? "json",
      };

      const response = await this.httpClient.patch<T>(route, body, {
        timeout: givenOptions.requestTimeout,
        headers: givenOptions.header,
        responseType: givenOptions.responseType,
      });

      if (response.status === givenOptions.expectedStatusCode) {
        return Ok<HttpSuccess<T>>({
          statusCode: givenOptions.expectedResponseCode!,
          payload: response.data,
          cookies: response.headers["set-cookie"] as string[] | undefined,
        });
      }
      throw new AxiosError("INTERNAL:Unknown Error Occurred.");
    } catch (error) {
      return this.errorHandler(error);
    }
  }

  private errorHandler<T = never>(error: unknown): Result<T, HttpError> {
    const axiosError = error as AxiosError<unknown>;

    if (axiosError?.code === "ECONNREFUSED") {
      return Err<HttpError>({
        statusCode: StatusCode.NETWORK_ERROR,
        error: "Cannot Connect to the Services.",
        raw: axiosError,
      });
    }

    if (
      typeof axiosError?.message === "string" &&
      axiosError.message.startsWith("INTERNAL:")
    ) {
      return Err<HttpError>({
        statusCode: StatusCode.FAILURE,
        error: axiosError.message.replaceAll("INTERNAL:", ""),
        raw: axiosError,
      });
    }

    const data: unknown = axiosError?.response?.data;

    if (isApiErrorBody(data)) {
      const mapped = data.errorCode
        ? statusCodeFromKey(data.errorCode)
        : undefined;
      return Err<HttpError>({
        statusCode: mapped ?? StatusCode.FAILURE,
        error: data.message ?? "Unknown error",
        raw: data,
      });
    }

    return Err<HttpError>({
      statusCode: StatusCode.FAILURE,
      error:
        typeof axiosError?.message === "string"
          ? axiosError.message
          : "Unknown error",
      raw: axiosError,
    });
  }
}
