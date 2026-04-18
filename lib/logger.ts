export const logError = (context: string, error: unknown) => {
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[${context}]`, error);
  }
};
