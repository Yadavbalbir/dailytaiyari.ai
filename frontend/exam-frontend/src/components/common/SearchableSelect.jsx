import { useState, useRef, useEffect, useMemo } from 'react'
import { Search, Check, ChevronDown } from 'lucide-react'

/**
 * A lightweight, dependency-free searchable dropdown that scales to hundreds of
 * options (search + virtualised-height scroll list) instead of rendering every
 * option inline.
 *
 * Props:
 *  - options: [{ value, label }]
 *  - value: string (single) | string[] (multiple)
 *  - onChange: (value) => void
 *  - multiple: boolean
 *  - placeholder / searchPlaceholder / emptyText
 *  - buttonClassName: classes for the trigger button
 *  - align: 'left' | 'right' (popover alignment)
 */
const SearchableSelect = ({
    options = [],
    value,
    onChange,
    multiple = false,
    placeholder = 'Select...',
    searchPlaceholder = 'Search...',
    emptyText = 'No matches found',
    buttonClassName = '',
    align = 'left',
    renderTriggerLabel,
}) => {
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState('')
    const containerRef = useRef(null)
    const inputRef = useRef(null)

    useEffect(() => {
        if (!open) return undefined
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false)
            }
        }
        const handleEsc = (e) => e.key === 'Escape' && setOpen(false)
        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('keydown', handleEsc)
        // Focus the search box when opening.
        const t = setTimeout(() => inputRef.current?.focus(), 10)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('keydown', handleEsc)
            clearTimeout(t)
        }
    }, [open])

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase()
        if (!q) return options
        return options.filter((o) => o.label.toLowerCase().includes(q))
    }, [options, query])

    const selectedValues = multiple ? (value || []) : (value ? [value] : [])
    const isSelected = (v) => selectedValues.includes(v)

    const handleSelect = (v) => {
        if (multiple) {
            const set = new Set(value || [])
            if (set.has(v)) set.delete(v)
            else set.add(v)
            onChange([...set])
        } else {
            onChange(v)
            setOpen(false)
            setQuery('')
        }
    }

    const triggerLabel = () => {
        if (renderTriggerLabel) return renderTriggerLabel(selectedValues)
        if (multiple) {
            if (!selectedValues.length) return placeholder
            return `${selectedValues.length} selected`
        }
        const match = options.find((o) => o.value === value)
        return match ? match.label : placeholder
    }

    return (
        <div className="relative" ref={containerRef}>
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className={buttonClassName || 'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border border-surface-200 dark:border-surface-700 text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors'}
            >
                <span className="truncate max-w-[180px]">{triggerLabel()}</span>
                <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div
                    className={`absolute z-40 mt-1 w-64 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 shadow-xl ${align === 'right' ? 'right-0' : 'left-0'}`}
                >
                    <div className="p-2 border-b border-surface-100 dark:border-surface-800">
                        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-surface-50 dark:bg-surface-800">
                            <Search size={14} className="text-surface-400 shrink-0" />
                            <input
                                ref={inputRef}
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder={searchPlaceholder}
                                className="bg-transparent outline-none text-sm w-full"
                            />
                        </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto py-1">
                        {filtered.length ? (
                            filtered.map((o) => (
                                <button
                                    key={o.value}
                                    type="button"
                                    onClick={() => handleSelect(o.value)}
                                    className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                                >
                                    <span className={`truncate ${isSelected(o.value) ? 'text-primary-600 font-medium' : 'text-surface-700 dark:text-surface-300'}`}>
                                        {o.label}
                                    </span>
                                    {isSelected(o.value) && <Check size={15} className="text-primary-600 shrink-0" />}
                                </button>
                            ))
                        ) : (
                            <div className="px-3 py-6 text-center text-sm text-surface-400">{emptyText}</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default SearchableSelect
