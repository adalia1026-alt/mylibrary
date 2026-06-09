'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { searchCountries, getCountryByCode, Country } from '@/lib/countries';
import { Globe, Check } from 'lucide-react';

interface CountrySelectProps {
  value: string; // 国家代码
  onChange: (code: string, name: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function CountrySelect({
  value,
  onChange,
  placeholder = '选择国家/地区',
  className,
  disabled = false,
}: CountrySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCountries, setFilteredCountries] = useState<Country[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 获取当前选中的国家
  const selectedCountry = value ? getCountryByCode(value) : null;

  // 初始化过滤后的国家列表
  useEffect(() => {
    setFilteredCountries(searchCountries(''));
  }, []);

  // 处理搜索
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setFilteredCountries(searchCountries(query));
  };

  // 选择国家
  const handleSelect = (country: Country) => {
    onChange(country.code, country.name);
    setSearchQuery('');
    setIsOpen(false);
  };

  // 处理输入框焦点
  const handleFocus = () => {
    if (!disabled) {
      setIsOpen(true);
      setFilteredCountries(searchCountries(searchQuery));
    }
  };

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative">
        <Input
          ref={inputRef}
          value={isOpen ? searchQuery : (selectedCountry ? `${selectedCountry.flag} ${selectedCountry.name}` : '')}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled}
          className="pr-8"
        />
        <Globe className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      </div>

      {/* 下拉列表 */}
      {isOpen && !disabled && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredCountries.length > 0 ? (
            filteredCountries.map((country) => (
              <div
                key={country.code}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-accent transition-colors',
                  value === country.code && 'bg-accent'
                )}
                onClick={() => handleSelect(country)}
              >
                <span className="text-lg">{country.flag}</span>
                <span className="flex-1">{country.name}</span>
                {value === country.code && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-muted-foreground text-center">
              未找到匹配的国家
            </div>
          )}
        </div>
      )}
    </div>
  );
}
