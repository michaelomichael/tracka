import { getCurrentInstance } from 'vue'

export function useLogger(optionalName) {
  const name = optionalName ?? getCurrentInstance()?.type?.__name ?? '??'
  const prefix = `[${name}]`

  const _prettyArgs = (args) => {
    return args.map((arg) => {
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg)
        } catch (e) {
          return '[Circular]'
        }
      }
      return arg
    })
  }

  const debug = (...args) => {
    console.debug(prefix, ..._prettyArgs(args))
  }

  const log = (...args) => {
    console.log(prefix, ..._prettyArgs(args))
  }

  const info = (...args) => {
    console.info(prefix, ..._prettyArgs(args))
  }

  const warn = (...args) => {
    console.warn(prefix, ..._prettyArgs(args))
  }

  const error = (...args) => {
    console.error(prefix, ..._prettyArgs(args))
  }

  return { debug, log, info, warn, error }
}
