export function sliceOrAll<T>(
  rows: T[],
  showAll: boolean,
  visibleCount: number,
) {
  return showAll ? rows : rows.slice(0, visibleCount);
}

export function canToggle(rowsLength: number, visibleCount: number) {
  return rowsLength > visibleCount;
}
