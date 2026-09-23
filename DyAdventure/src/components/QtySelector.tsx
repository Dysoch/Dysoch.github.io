const QTY_OPTIONS = [1, 5, 10, 25] as const

export type BuyQty = (typeof QTY_OPTIONS)[number] | 'max'

/** `compact` renders smaller, tighter buttons with no "Buy:" label — for embedding inside a card rather than as a page-level toolbar. */
export function QtySelector({ value, onChange, compact }: { value: BuyQty; onChange: (qty: BuyQty) => void; compact?: boolean }) {
  const btnStyle = compact ? { padding: '1px 7px', fontSize: '11px' } : undefined
  return (
    <div className={`d-flex gap-2 align-items-center ${compact ? '' : 'mb-3'}`}>
      {!compact && <span className="text-body-secondary small">Buy:</span>}
      {QTY_OPTIONS.map((q) => (
        <button
          key={q}
          type="button"
          className={`btn btn-sm ${value === q ? 'btn-primary' : 'btn-outline-secondary'}`}
          style={btnStyle}
          onClick={() => onChange(q)}
        >
          ×{q}
        </button>
      ))}
      <button
        type="button"
        className={`btn btn-sm ${value === 'max' ? 'btn-primary' : 'btn-outline-secondary'}`}
        style={btnStyle}
        onClick={() => onChange('max')}
      >
        Max
      </button>
    </div>
  )
}
