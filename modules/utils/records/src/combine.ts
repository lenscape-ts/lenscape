
export function deepCombineObjects(...objects: any[]): any{
    return objects.reduce((acc, obj) => deepCombineTwoObject(acc, obj), {})
}
export function deepCombineTwoObject(t1: any, t2: any): any{
  if (t1===undefined) return t2
  if (t1===null) return t2;

  if (t2===undefined) return t1
  if (t2===null) return t1;

  if (typeof t1!=='object') return t2
  if (typeof t2!=='object') return t2

  const result: any={...t1}
  Object.entries(t2).forEach(([k, v]) => {
    if (isForbiddenKey(k)) return;
    if (t1[k]===undefined) result[k]=v
    if (Array.isArray(t1[k])&&Array.isArray(v)) result[k]=t1[k].concat(v); else//
    if (typeof v==='object'&& typeof t1[k]==='object')
      result[k]=deepCombineTwoObject(t1[k] as any, v as any);
    else
      result[k]=v
  })
  return result

}

function isForbiddenKey(key: string): boolean{
  const forbiddenKeys=['__proto__', 'constructor', 'prototype'];
  return forbiddenKeys.includes(key);
}