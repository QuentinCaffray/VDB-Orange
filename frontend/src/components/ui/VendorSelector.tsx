import { useState } from 'react'

export interface VendorOption {
  id: string
  name: string
  color: string
}

interface VendorSelectorProps {
  vendors: VendorOption[]
  selectedId: string
  onSelect: (vendorId: string) => void
  label?: string
}

export function VendorSelector({ vendors, selectedId, onSelect, label = 'Membre consulté' }: VendorSelectorProps) {
  return (
    <>
      {/* Mobile : menu déroulant */}
      <div className="md:hidden">
        <VendorDropdown vendors={vendors} selectedId={selectedId} onSelect={onSelect} />
      </div>

      {/* Desktop : rangée de boutons */}
      <div className="hidden md:block">
        <p className="text-xs font-bold text-text-tertiary uppercase tracking-widest mb-2 m-0">
          {label}
        </p>
        <VendorButtonRow vendors={vendors} selectedId={selectedId} onSelect={onSelect} />
      </div>
    </>
  )
}

// ── Dropdown (mobile) ─────────────────────────────────────────────────────────

interface VendorDropdownProps {
  vendors: VendorOption[]
  selectedId: string
  onSelect: (vendorId: string) => void
}

function VendorDropdown({ vendors, selectedId, onSelect }: VendorDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const selectedVendor = vendors.find((vendor) => vendor.id === selectedId)

  function handleSelect(vendorId: string): void {
    onSelect(vendorId)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen((previous) => !previous)}
        className="w-full flex items-center gap-3 bg-white px-4 py-3 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] text-left"
      >
        {selectedVendor ? (
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0"
            style={{ background: selectedVendor.color }}
          >
            {selectedVendor.name.charAt(0).toUpperCase()}
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-surface shrink-0" />
        )}
        <span className="flex-1 text-sm font-bold text-text-primary">
          {selectedVendor?.name ?? 'Choisir un membre'}
        </span>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="#9A9088" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
          className={`shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.12)] z-20 overflow-hidden">
          {vendors.map((vendor) => (
            <button
              key={vendor.id}
              onClick={() => handleSelect(vendor.id)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface transition-colors"
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0"
                style={{ background: vendor.color }}
              >
                {vendor.name.charAt(0).toUpperCase()}
              </div>
              <span className={`text-sm font-semibold ${vendor.id === selectedId ? 'text-brand' : 'text-text-primary'}`}>
                {vendor.name}
              </span>
              {vendor.id === selectedId && (
                <svg
                  width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="#FF7900" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  className="ml-auto shrink-0"
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Rangée de boutons (desktop) ───────────────────────────────────────────────

interface VendorButtonRowProps {
  vendors: VendorOption[]
  selectedId: string
  onSelect: (vendorId: string) => void
}

function VendorButtonRow({ vendors, selectedId, onSelect }: VendorButtonRowProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      {vendors.map((vendor) => {
        const isSelected = selectedId === vendor.id
        return (
          <button
            key={vendor.id}
            onClick={() => onSelect(vendor.id)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all"
            style={{
              background: isSelected ? vendor.color : 'var(--color-surface)',
              color: isSelected ? 'white' : 'var(--color-text-secondary)',
            }}
          >
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black"
              style={{
                background: isSelected ? 'rgba(255,255,255,0.25)' : vendor.color,
                color: 'white',
              }}
            >
              {vendor.name.charAt(0).toUpperCase()}
            </div>
            {vendor.name}
          </button>
        )
      })}
    </div>
  )
}
