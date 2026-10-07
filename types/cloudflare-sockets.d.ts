declare module "cloudflare:sockets" {
  export function connect(
    address: { hostname: string; port: number },
    options?: { secureTransport?: "off" | "on" | "starttls" }
  ): {
    readable: ReadableStream<Uint8Array>;
    writable: WritableStream<Uint8Array>;
    startTls(): ReturnType<typeof connect>;
    close(): void;
  };
}
