// Lets the calculator put its result into the answer field of the current task ("В ответ").
type Setter = (value: string) => void;
let target: Setter | null = null;

export function registerAnswerTarget(fn: Setter): () => void {
  target = fn;
  return () => {
    if (target === fn) target = null;
  };
}

export function insertIntoAnswer(value: string): boolean {
  if (!target) return false;
  target(value);
  return true;
}
