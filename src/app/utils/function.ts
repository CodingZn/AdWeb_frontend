export function sgn (v: number) {
  return  v === 0 ? 0 
                  : v > 0 
                    ? 1 
                    : -1;
}