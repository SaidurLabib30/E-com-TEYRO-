// Join conditional class names while dropping empty values; used to compose component styles.
export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
