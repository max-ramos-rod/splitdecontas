import { useEffect, useRef } from "react";
import { createQR } from "@solana/pay";

interface QRDisplayProps {
  url: string;
  size?: number;
}

export function QRDisplay({ url, size = 256 }: QRDisplayProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const qr = createQR(url, size, "white", "#000000");
    ref.current.innerHTML = "";
    qr.append(ref.current);
  }, [url, size]);

  return <div ref={ref} style={{ width: size, height: size }} />;
}
