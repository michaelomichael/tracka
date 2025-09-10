// Asserts that there is a single match on the given array after filtering
// it using the given predicate.
export const single = (arr, predicate) => {
  if (arr === null) {
    throw 'single: Array is null'
  }

  if (arr.length === 0) {
    throw 'single: Before filtering, array has no entries'
  }

  const result = arr.filter(predicate)

  if (result.length === 1) {
    return result[0]
  } else if (result.length === 0) {
    throw 'single: After filtering, array has no entries'
  } else {
    const msg = `single: After filtering, array has multiple (${result.length}) entries`
    console.error(msg, result)
    throw msg
  }
}

export const copy = (anything) => {
  return JSON.parse(JSON.stringify(anything))
}

export const stringToHslColour = (str) => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  // Convert hash to [0–360] for hue
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 70%, 50%)`
}
