type AnyObject = Record<string, unknown>;

export function cleanObject<T extends AnyObject>(obj: T): Partial<T> {
  if (obj === null || obj === undefined) return obj;

  if (Array.isArray(obj)) {
    const cleanedArray = obj
      .map((item) => cleanObject(item as AnyObject))
      .filter(
        (item) =>
          item !== null &&
          item !== undefined &&
          !(typeof item === 'object' && Object.keys(item).length === 0),
      );
    return cleanedArray as unknown as Partial<T>;
  }

  if (typeof obj === 'object') {
    const result: AnyObject = {};
    for (const [key, value] of Object.entries(obj)) {
      const cleaned =
        value && typeof value === 'object'
          ? cleanObject(value as AnyObject)
          : value;

      const isEmptyObject =
        typeof cleaned === 'object' &&
        cleaned !== null &&
        !Array.isArray(cleaned) &&
        Object.keys(cleaned).length === 0;

      if (cleaned !== null && cleaned !== undefined && !isEmptyObject) {
        result[key] = cleaned;
      }
    }
    return result as Partial<T>;
  }

  return obj;
}
