export const ok = <T>(data: T, message = 'ok') =>
  Response.json({ success: true, data, message, errors: null });

export const fail = (message: string, status = 400, errors?: unknown) =>
  Response.json({ success: false, data: null, message, errors }, { status });
