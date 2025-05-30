export type DatesToStrings<T> = {
  [K in keyof T]: T[K] extends Date ? string :
    T[K] extends Date | undefined ? string | undefined :
      T[K] extends object ? DatesToStrings<T[K]> :
        T[K]
}

// Helper to convert string properties to Date
export type StringsToDates<T, DateKeys extends keyof T> = {
  [K in keyof T]: K extends DateKeys ? Date : T[K]
}
