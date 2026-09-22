const QTY_OPTIONS = [1, 5, 10, 25] as const

export type BuyQty = (typeof QTY_OPTIONS)[number] | 'max'

export function QtySelector({ value, onChange }: { value: BuyQty; onChange: (qty: BuyQty) => void }) {
  return (
    <div className="d-flex gap-2 align-items-center mb-3">
      <span className="text-body-secondary small">Buy:</span>
      {QTY_OPTIONS.map((q) => (
        <button
          key={q}
          type="button"
          className={`btn btn-sm ${value === q ? 'btn-primary' : 'btn-outline-secondary'}`}
          onClick={() => onChange(q)}
        >
          ×{q}
        </button>
      ))}
      <button
        type="button"
        className={`btn btn-sm ${value === 'max' ? 'btn-primary' : 'btn-outline-secondary'}`}
        onClick={() => onChange('max')}
      >
        Max
      </button>
    </div>
  )
}
