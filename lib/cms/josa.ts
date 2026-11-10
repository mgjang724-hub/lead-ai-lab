/** 받침에 맞는 조사 — josa('소식', '을', '를') → '소식을', josa('날짜', '을', '를') → '날짜를'. 한글로 끝나지 않으면 '을(를)' 처럼 둘 다 */
export function josa(word: string, withFinal: string, withoutFinal: string): string {
  const w = word.trim();
  const code = w.charCodeAt(w.length - 1);
  if (code >= 0xac00 && code <= 0xd7a3) return w + ((code - 0xac00) % 28 ? withFinal : withoutFinal);
  return `${w}${withFinal}(${withoutFinal})`;
}
