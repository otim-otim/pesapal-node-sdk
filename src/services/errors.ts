import axios from 'axios';
import { IErrorResponse, IPesapalError } from '../interfaces';

/**
 * Error reported by the Pesapal API, either as a non-2xx HTTP response or as
 * an `error` object / non-200 `status` inside an HTTP 200 response body.
 */
export class PesapalApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public errorType?: string
  ) {
    super(message);
    this.name = 'PesapalApiError';
  }
}

type PesapalBody = { error?: IPesapalError | null; status?: string | number; message?: string } | null | undefined;

/** Throws a PesapalApiError if a Pesapal response body reports a failure. */
export const assertPesapalSuccess = (body: PesapalBody, fallbackMessage: string): void => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return;

  const error = body.error;
  const status = body.status !== undefined && body.status !== null ? Number(body.status) : undefined;
  const hasError = !!error && !!(error.code || error.message || error.error_type);
  const badStatus = status !== undefined && !Number.isNaN(status) && (status < 200 || status >= 300);

  if (hasError || badStatus) {
    throw new PesapalApiError(
      error?.message || body.message || fallbackMessage,
      status,
      error?.code ?? undefined,
      error?.error_type ?? undefined
    );
  }
};

/** Normalises any thrown value into the SDK's IErrorResponse shape. */
export const toErrorResponse = (error: unknown): IErrorResponse => {
  if (error instanceof PesapalApiError) {
    return { error: error.message, status: error.status, code: error.code, errorType: error.errorType };
  }
  if (axios.isAxiosError(error)) {
    const pesapalError = (error.response?.data as PesapalBody)?.error;
    return {
      error: pesapalError?.message || error.message,
      status: error.response?.status,
      code: pesapalError?.code ?? undefined,
      errorType: pesapalError?.error_type ?? undefined
    };
  }
  if (error instanceof Error) {
    return {
      error: error.message,
      status: 'status' in error ? (error as { status?: number }).status : undefined
    };
  }
  return { error: 'An unknown error occurred', status: undefined };
};
