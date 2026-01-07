import { useState, useEffect } from "react";

export interface TerminalSize {
  width: number;
  height: number;
}

export function useTerminalSize(): TerminalSize {
  const [size, setSize] = useState<TerminalSize>(() => ({
    width: process.stdout.columns || 80,
    height: process.stdout.rows || 24,
  }));

  useEffect(() => {
    const handleResize = (): void => {
      setSize({
        width: process.stdout.columns || 80,
        height: process.stdout.rows || 24,
      });
    };

    process.stdout.on("resize", handleResize);
    process.on("SIGWINCH", handleResize);

    return () => {
      process.stdout.off("resize", handleResize);
      process.off("SIGWINCH", handleResize);
    };
  }, []);

  return size;
}
