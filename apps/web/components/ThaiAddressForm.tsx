import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { MapPin, ChevronDown, Search, X, Check } from 'lucide-react';
// @ts-expect-error — no type declarations for thai-address-database
import { searchAddressByProvince } from 'thai-address-database';
import { EmployeeAddress } from '../types';

interface AddressRecord {
    district: string;   // tambon (sub-district)
    amphoe: string;     // amphoe (district)
    province: string;
    zipcode: string;
}

interface ThaiAddressFormProps {
    value: EmployeeAddress | null | undefined;
    onChange: (address: EmployeeAddress) => void;
}

type TabKey = 'province' | 'district' | 'subDistrict' | 'postalCode';

const TABS: { key: TabKey; label: string }[] = [
    { key: 'province', label: 'จังหวัด' },
    { key: 'district', label: 'เขต/อำเภอ' },
    { key: 'subDistrict', label: 'แขวง/ตำบล' },
    { key: 'postalCode', label: 'รหัสไปรษณีย์' },
];

// Module-level cache — loaded once across all instances
let allRecordsCache: AddressRecord[] | null = null;
function getAllRecords(): AddressRecord[] {
    if (!allRecordsCache) {
        allRecordsCache = searchAddressByProvince('.', 100000) as AddressRecord[];
    }
    return allRecordsCache;
}

export const ThaiAddressForm: React.FC<ThaiAddressFormProps> = ({ value, onChange }) => {
    const addr = value || {};
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<TabKey>('province');
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    const allRecords = useMemo(() => getAllRecords(), []);

    // Derived lists based on current selections
    const provinces = useMemo(
        () => [...new Set(allRecords.map(r => r.province))].sort(),
        [allRecords]
    );

    const districts = useMemo(() => {
        if (!addr.province) return [];
        return [...new Set(
            allRecords.filter(r => r.province === addr.province).map(r => r.amphoe)
        )].sort();
    }, [allRecords, addr.province]);

    const subDistricts = useMemo(() => {
        if (!addr.province || !addr.district) return [];
        return [...new Set(
            allRecords
                .filter(r => r.province === addr.province && r.amphoe === addr.district)
                .map(r => r.district)
        )].sort();
    }, [allRecords, addr.province, addr.district]);

    const postalCodes = useMemo(() => {
        if (!addr.province || !addr.district || !addr.subDistrict) return [];
        return [...new Set(
            allRecords
                .filter(r =>
                    r.province === addr.province &&
                    r.amphoe === addr.district &&
                    r.district === addr.subDistrict
                )
                .map(r => r.zipcode)
        )].sort();
    }, [allRecords, addr.province, addr.district, addr.subDistrict]);

    // Items for the active tab, filtered by search
    const currentItems = useMemo(() => {
        let items: string[];
        switch (activeTab) {
            case 'province': items = provinces; break;
            case 'district': items = districts; break;
            case 'subDistrict': items = subDistricts; break;
            case 'postalCode': items = postalCodes; break;
        }
        if (search) {
            const q = search.toLowerCase();
            return items.filter(item => item.toLowerCase().includes(q));
        }
        return items;
    }, [activeTab, provinces, districts, subDistricts, postalCodes, search]);

    const getSelectedForTab = (tab: TabKey): string | undefined => {
        switch (tab) {
            case 'province': return addr.province;
            case 'district': return addr.district;
            case 'subDistrict': return addr.subDistrict;
            case 'postalCode': return addr.postalCode;
        }
    };

    const handleSelect = useCallback((item: string) => {
        setSearch('');
        switch (activeTab) {
            case 'province':
                onChange({ ...addr, province: item, district: undefined, subDistrict: undefined, postalCode: undefined });
                setActiveTab('district');
                break;
            case 'district':
                onChange({ ...addr, district: item, subDistrict: undefined, postalCode: undefined });
                setActiveTab('subDistrict');
                break;
            case 'subDistrict': {
                const codes = [...new Set(
                    allRecords
                        .filter(r => r.province === addr.province && r.amphoe === addr.district && r.district === item)
                        .map(r => r.zipcode)
                )];
                if (codes.length === 1) {
                    onChange({ ...addr, subDistrict: item, postalCode: codes[0] });
                    setIsOpen(false);
                } else {
                    onChange({ ...addr, subDistrict: item, postalCode: undefined });
                    setActiveTab('postalCode');
                }
                break;
            }
            case 'postalCode':
                onChange({ ...addr, postalCode: item });
                setIsOpen(false);
                break;
        }
    }, [activeTab, addr, onChange, allRecords]);

    const handleToggle = () => {
        if (!isOpen) {
            // Open on the first incomplete tab
            if (!addr.province) setActiveTab('province');
            else if (!addr.district) setActiveTab('district');
            else if (!addr.subDistrict) setActiveTab('subDistrict');
            else if (!addr.postalCode) setActiveTab('postalCode');
            else setActiveTab('province');
            setSearch('');
        }
        setIsOpen(prev => !prev);
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange({ ...addr, province: undefined, district: undefined, subDistrict: undefined, postalCode: undefined });
        setActiveTab('province');
    };

    // Close on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    // Auto-focus search when panel opens or tab changes
    useEffect(() => {
        if (isOpen && searchRef.current) {
            setTimeout(() => searchRef.current?.focus(), 0);
        }
    }, [isOpen, activeTab]);

    // Display text
    const displayText = useMemo(() => {
        const parts = [addr.province, addr.district, addr.subDistrict, addr.postalCode].filter(Boolean);
        return parts.length > 0 ? parts.join(', ') : '';
    }, [addr.province, addr.district, addr.subDistrict, addr.postalCode]);

    // Empty-state message for the list
    const emptyMessage = useMemo(() => {
        if (search) return 'No results found';
        const tabIdx = TABS.findIndex(t => t.key === activeTab);
        const prevTab = tabIdx > 0 ? TABS[tabIdx - 1] : undefined;
        if (prevTab && !getSelectedForTab(prevTab.key)) {
            return `Please select ${prevTab.label} first`;
        }
        return 'No results found';
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, search, addr.province, addr.district, addr.subDistrict]);

    const labelClass = 'block text-sm font-medium text-text-light dark:text-text-dark mb-1';

    return (
        <div className="md:col-span-2 space-y-4">
            <label className={labelClass}>Current Address</label>

            {/* Address detail textarea */}
            <div>
                <label className={labelClass}>Address</label>
                <div className="relative">
                    <MapPin className="absolute left-3 top-3 text-text-muted-light" size={16} />
                    <textarea
                        rows={2}
                        value={addr.addressLine1 || ''}
                        onChange={(e) => onChange({ ...addr, addressLine1: e.target.value })}
                        className="w-full pl-10 pr-3 py-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-text-light dark:text-text-dark resize-none"
                        placeholder="House No., Building, Street, Soi"
                    />
                </div>
            </div>

            {/* Unified address picker */}
            <div ref={containerRef} className="relative">
                <label className={labelClass}>Province / District / Sub-district</label>

                {/* Trigger button */}
                <div
                    className={`w-full flex items-center gap-2 px-3 py-2 bg-background-light dark:bg-background-dark border rounded-lg cursor-pointer transition-colors ${
                        isOpen
                            ? 'border-primary ring-2 ring-primary'
                            : 'border-border-light dark:border-border-dark hover:border-primary/50'
                    }`}
                    onClick={handleToggle}
                >
                    <Search className="text-text-muted-light shrink-0" size={16} />
                    {displayText ? (
                        <span className="flex-1 text-sm text-text-light dark:text-text-dark truncate">
                            {displayText}
                        </span>
                    ) : (
                        <span className="flex-1 text-sm text-text-muted-light dark:text-text-muted-dark">
                            จังหวัด, เขต/อำเภอ, แขวง/ตำบล, รหัสไปรษณีย์
                        </span>
                    )}
                    {displayText && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="text-text-muted-light hover:text-text-light dark:hover:text-text-dark transition-colors"
                        >
                            <X size={14} />
                        </button>
                    )}
                    <ChevronDown
                        className={`text-text-muted-light shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                        size={16}
                    />
                </div>

                {/* Dropdown panel */}
                {isOpen && (
                    <div className="absolute z-50 left-0 right-0 mt-1 bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-lg shadow-lg overflow-hidden">
                        {/* Search input */}
                        <div className="p-2 border-b border-border-light dark:border-border-dark">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted-light" size={14} />
                                <input
                                    ref={searchRef}
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => {
                                        // Prevent Enter from propagating to form's keydown handler
                                        if (e.key === 'Enter') {
                                            e.stopPropagation();
                                            // Select first item if searching
                                            const first = currentItems[0];
                                            if (first) {
                                                handleSelect(first);
                                            }
                                        }
                                        if (e.key === 'Escape') {
                                            setIsOpen(false);
                                        }
                                    }}
                                    className="w-full pl-8 pr-3 py-1.5 text-sm bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-md focus:outline-none focus:ring-1 focus:ring-primary text-text-light dark:text-text-dark"
                                    placeholder="Search..."
                                />
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-border-light dark:border-border-dark bg-background-light/50 dark:bg-background-dark/50">
                            {TABS.map((tab) => {
                                const isActive = activeTab === tab.key;
                                const hasValue = !!getSelectedForTab(tab.key);
                                return (
                                    <button
                                        key={tab.key}
                                        type="button"
                                        onClick={() => { setActiveTab(tab.key); setSearch(''); }}
                                        className={`flex-1 px-1 py-2.5 text-xs font-medium transition-colors relative ${
                                            isActive
                                                ? 'text-primary'
                                                : hasValue
                                                    ? 'text-green-600 dark:text-green-400'
                                                    : 'text-text-muted-light dark:text-text-muted-dark hover:text-text-light dark:hover:text-text-dark'
                                        }`}
                                    >
                                        <span className="flex items-center justify-center gap-1">
                                            {hasValue && !isActive && <Check size={10} />}
                                            {tab.label}
                                        </span>
                                        {isActive && (
                                            <div className="absolute bottom-0 left-1 right-1 h-0.5 bg-primary rounded-full" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Selected breadcrumb */}
                        {(addr.province || addr.district || addr.subDistrict) && (
                            <div className="px-3 py-1.5 border-b border-border-light dark:border-border-dark bg-primary/5 dark:bg-primary/10">
                                <p className="text-xs text-text-muted-light dark:text-text-muted-dark truncate">
                                    {[addr.province, addr.district, addr.subDistrict, addr.postalCode]
                                        .filter(Boolean)
                                        .join(' › ')}
                                </p>
                            </div>
                        )}

                        {/* Items list */}
                        <div className="max-h-52 overflow-y-auto">
                            {currentItems.length === 0 ? (
                                <div className="px-4 py-8 text-center text-sm text-text-muted-light dark:text-text-muted-dark">
                                    {emptyMessage}
                                </div>
                            ) : (
                                currentItems.map((item) => {
                                    const isSelected = getSelectedForTab(activeTab) === item;
                                    return (
                                        <button
                                            key={item}
                                            type="button"
                                            onClick={() => handleSelect(item)}
                                            className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${
                                                isSelected
                                                    ? 'bg-primary/10 text-primary font-medium'
                                                    : 'text-text-light dark:text-text-dark hover:bg-background-light dark:hover:bg-background-dark'
                                            }`}
                                        >
                                            <span>{item}</span>
                                            {isSelected && <Check size={14} className="shrink-0" />}
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
