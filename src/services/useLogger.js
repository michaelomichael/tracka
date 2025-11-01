import { getCurrentInstance } from 'vue'

export function useLogger(optionalName) {
  const name = optionalName ?? getCurrentInstance()?.type?.__name ?? '??'
  const prefix = `[${name}]`

  const debug = (...args) => {
    console.debug(prefix, ...args)
  }

  const log = (...args) => {
    console.log(prefix, ...args)
  }

  const info = (...args) => {
    console.info(prefix, ...args)
  }

  const warn = (...args) => {
    console.warn(prefix, ...args)
  }

  const error = (...args) => {
    console.error(prefix, ...args)
  }

  return { debug, log, info, warn, error }
}
