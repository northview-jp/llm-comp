// Theme colors for Ink UI
export const THEME = {
  accent1: "cyan",
  accent2: "magenta",
  success: "green",
  error: "red",
  warning: "yellow",
  muted: "gray",
  text: "white",
  border: "gray",
  info: "blue",
} as const;

export const MIN_WIDTH = 60;
export const MIN_HEIGHT = 20;

export const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"] as const;

export function getStatusIcon(status: string | undefined, spinnerIdx: number): string {
  switch (status) {
    case "loading":
      return SPINNER_FRAMES[spinnerIdx % SPINNER_FRAMES.length];
    case "done":
      return "✔";
    case "error":
      return "✘";
    default:
      return "○";
  }
}

export function getStatusColor(status: string | undefined): string {
  switch (status) {
    case "done":
      return THEME.success;
    case "error":
      return THEME.error;
    case "loading":
      return THEME.warning;
    default:
      return THEME.muted;
  }
}
