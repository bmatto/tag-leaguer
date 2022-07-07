export type Method = 'POST' | 'GET' | 'DELETE' | 'UPDATE' | 'OPTIONS'
export type Methods = {
  [Property in Method]: Method
}

export const METHODS: Methods = {
  POST: 'POST',
  GET: 'GET',
  DELETE: 'DELETE',
  UPDATE: 'UPDATE',
  OPTIONS: 'OPTIONS',
}
