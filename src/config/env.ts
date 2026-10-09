const DEFAULT_PORT = 3000;
const MAX_PORT = 65_535;

export function getPort(value: string | undefined): number {
  if (value === undefined || value.trim() === '') {
    return DEFAULT_PORT;
  }

  const port = Number(value);

  if (!Number.isInteger(port) || port < 1 || port > MAX_PORT) {
    throw new Error('PORT must be an integer between 1 and 65535.');
  }

  return port;
}
