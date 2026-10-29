type JsonObject = Record<string, unknown>

function asObject(value: unknown): JsonObject | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : null
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function asText(value: unknown) {
  return String(value ?? "").trim()
}

function asNumber(value: unknown) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function normalizeName(value: unknown) {
  return asText(value).toLocaleLowerCase("tr-TR")
}

function usageKey(checkoutId: string, lineId: string) {
  return `${checkoutId}:${lineId}`
}

function normalizeLine(raw: JsonObject): JsonObject {
  const quantity = Math.max(0, asNumber(raw.quantity))
  const usedValue = Number(raw.used)
  const remainingValue = Number(raw.remaining)
  const used = clamp(
    Number.isFinite(usedValue)
      ? usedValue
      : Number.isFinite(remainingValue)
        ? quantity - remainingValue
        : 0,
    0,
    quantity,
  )
  const remaining = clamp(
    Number.isFinite(remainingValue) ? remainingValue : quantity - used,
    0,
    quantity - used,
  )
  const usedCheckoutIds = asArray(raw.usedCheckoutIds)
    .map((value) => asText(value))
    .filter(Boolean)

  return {
    ...raw,
    quantity,
    used,
    remaining,
    usedCheckoutIds,
  }
}

export function normalizePackageSales(promotions: unknown): JsonObject {
  const source = asObject(promotions)
  if (!source) return {}
  const clone = JSON.parse(JSON.stringify(source)) as JsonObject
  clone.packageSales = asArray(clone.packageSales)
    .map((sale) => asObject(sale))
    .filter((sale): sale is JsonObject => Boolean(sale))
    .map((sale) => ({
      ...sale,
      lines: asArray(sale.lines)
        .map((line) => asObject(line))
        .filter((line): line is JsonObject => Boolean(line))
        .map(normalizeLine),
    }))
  return clone
}

function isAttended(checkout: JsonObject) {
  const attendance = asText(checkout.attendance).toLocaleLowerCase("tr-TR")
  const status = asText(checkout.status).toLocaleLowerCase("tr-TR")
  return attendance === "geldi" && status !== "iptal"
}

function checkoutLines(checkout: JsonObject): JsonObject[] {
  const lines = asArray(checkout.lines)
    .map((line) => asObject(line))
    .filter((line): line is JsonObject => Boolean(line))
  if (lines.length > 0) {
    return lines.map((line, index) => ({
      ...line,
      id: asText(line.id) || `line-${index}`,
    }))
  }
  return [
    {
      id: `${asText(checkout.id) || "checkout"}-line`,
      serviceId: asText(checkout.serviceId),
      name: asText(checkout.name),
    },
  ]
}

function customerMatches(sale: JsonObject, checkout: JsonObject) {
  const saleCustomerId = asText(sale.customerId)
  const checkoutCustomerId = asText(checkout.customerId)
  if (saleCustomerId && checkoutCustomerId) {
    return saleCustomerId === checkoutCustomerId
  }
  return (
    normalizeName(sale.customerName) === normalizeName(checkout.customerName)
  )
}

function applyUsage(
  promotions: JsonObject,
  checkout: JsonObject,
  direction: 1 | -1,
) {
  const checkoutId = asText(checkout.id) || "checkout"
  const sales = asArray(promotions.packageSales)
    .map((sale) => asObject(sale))
    .filter((sale): sale is JsonObject => Boolean(sale))

  for (const [index, checkoutLine] of checkoutLines(checkout).entries()) {
    const key = usageKey(checkoutId, asText(checkoutLine.id) || `line-${index}`)
    const checkoutServiceId = asText(checkoutLine.serviceId)
    const checkoutName = normalizeName(checkoutLine.name)

    if (direction === -1) {
      for (const sale of sales) {
        for (const rawLine of asArray(sale.lines)) {
          const line = asObject(rawLine)
          if (!line) continue
          const usedCheckoutIds = asArray(line.usedCheckoutIds).map(asText)
          if (!usedCheckoutIds.includes(key)) continue
          const quantity = Math.max(0, asNumber(line.quantity))
          const used = clamp(asNumber(line.used) - 1, 0, quantity)
          line.used = used
          line.remaining = clamp(asNumber(line.remaining) + 1, 0, quantity - used)
          line.usedCheckoutIds = usedCheckoutIds.filter((id) => id !== key)
          return
        }
      }
      continue
    }

    const alreadyApplied = sales.some((sale) =>
      asArray(sale.lines).some((rawLine) => {
        const line = asObject(rawLine)
        return (
          line &&
          asArray(line.usedCheckoutIds).map(asText).includes(key)
        )
      }),
    )
    if (alreadyApplied) continue

    const candidates: Array<{
      sale: JsonObject
      line: JsonObject
      score: number
      date: string
    }> = []
    for (const sale of sales) {
      if (!customerMatches(sale, checkout)) continue
      for (const rawLine of asArray(sale.lines)) {
        const line = asObject(rawLine)
        if (!line) continue
        if (asNumber(line.remaining) <= 0) continue
        const lineServiceId = asText(line.serviceId)
        const lineName = normalizeName(line.name)
        let score = 0
        if (checkoutServiceId && lineServiceId === checkoutServiceId) score = 3
        else if (checkoutName && lineName === checkoutName) score = 2
        else if (checkoutServiceId && !lineServiceId) score = 1
        if (score === 0) continue
        candidates.push({
          sale,
          line,
          score,
          date: asText(sale.date),
        })
      }
    }
    candidates.sort(
      (left, right) =>
        right.score - left.score || left.date.localeCompare(right.date),
    )
    const candidate = candidates[0]
    if (!candidate) continue

    const quantity = Math.max(0, asNumber(candidate.line.quantity))
    const used = clamp(asNumber(candidate.line.used) + 1, 0, quantity)
    candidate.line.used = used
    candidate.line.remaining = clamp(
      asNumber(candidate.line.remaining) - 1,
      0,
      quantity - used,
    )
    candidate.line.usedCheckoutIds = [
      ...asArray(candidate.line.usedCheckoutIds).map(asText),
      key,
    ]
  }
}

export function applyCheckoutAttendanceUsage({
  previousCheckouts,
  nextCheckouts,
  promotions,
}: {
  previousCheckouts: unknown
  nextCheckouts: unknown
  promotions: unknown
}) {
  const result = normalizePackageSales(promotions)
  const previous = asArray(previousCheckouts)
    .map((checkout) => asObject(checkout))
    .filter((checkout): checkout is JsonObject => Boolean(checkout))
  const next = asArray(nextCheckouts)
    .map((checkout) => asObject(checkout))
    .filter((checkout): checkout is JsonObject => Boolean(checkout))
  const nextById = new Map(
    next.map((checkout) => [asText(checkout.id), checkout]),
  )

  for (const previousCheckout of previous) {
    const id = asText(previousCheckout.id)
    const nextCheckout = nextById.get(id)
    if (isAttended(previousCheckout)) {
      if (!nextCheckout || !isAttended(nextCheckout)) {
        applyUsage(result, previousCheckout, -1)
      }
    } else if (nextCheckout && isAttended(nextCheckout)) {
      applyUsage(result, nextCheckout, 1)
    }
    nextById.delete(id)
  }

  for (const newCheckout of nextById.values()) {
    if (isAttended(newCheckout)) applyUsage(result, newCheckout, 1)
  }

  return result
}
