// 国家/地区字典数据
export interface Country {
  code: string;      // ISO 3166-1 alpha-2 代码
  name: string;      // 中文名称
  nameEn: string;    // 英文名称
  flag: string;      // 国旗 emoji
}

// 主要国家/地区列表（按中文拼音排序）
export const countries: Country[] = [
  { code: 'AL', name: '阿尔巴尼亚', nameEn: 'Albania', flag: '🇦🇱' },
  { code: 'DZ', name: '阿尔及利亚', nameEn: 'Algeria', flag: '🇩🇿' },
  { code: 'AR', name: '阿根廷', nameEn: 'Argentina', flag: '🇦🇷' },
  { code: 'AE', name: '阿联酋', nameEn: 'United Arab Emirates', flag: '🇦🇪' },
  { code: 'EG', name: '埃及', nameEn: 'Egypt', flag: '🇪🇬' },
  { code: 'IE', name: '爱尔兰', nameEn: 'Ireland', flag: '🇮🇪' },
  { code: 'AT', name: '奥地利', nameEn: 'Austria', flag: '🇦🇹' },
  { code: 'AU', name: '澳大利亚', nameEn: 'Australia', flag: '🇦🇺' },
  { code: 'PK', name: '巴基斯坦', nameEn: 'Pakistan', flag: '🇵🇰' },
  { code: 'PS', name: '巴勒斯坦', nameEn: 'Palestine', flag: '🇵🇸' },
  { code: 'BR', name: '巴西', nameEn: 'Brazil', flag: '🇧🇷' },
  { code: 'BG', name: '保加利亚', nameEn: 'Bulgaria', flag: '🇧🇬' },
  { code: 'BE', name: '比利时', nameEn: 'Belgium', flag: '🇧🇪' },
  { code: 'PL', name: '波兰', nameEn: 'Poland', flag: '🇵🇱' },
  { code: 'DK', name: '丹麦', nameEn: 'Denmark', flag: '🇩🇰' },
  { code: 'DE', name: '德国', nameEn: 'Germany', flag: '🇩🇪' },
  { code: 'RU', name: '俄罗斯', nameEn: 'Russia', flag: '🇷🇺' },
  { code: 'FR', name: '法国', nameEn: 'France', flag: '🇫🇷' },
  { code: 'PH', name: '菲律宾', nameEn: 'Philippines', flag: '🇵🇭' },
  { code: 'FI', name: '芬兰', nameEn: 'Finland', flag: '🇫🇮' },
  { code: 'CO', name: '哥伦比亚', nameEn: 'Colombia', flag: '🇨🇴' },
  { code: 'KR', name: '韩国', nameEn: 'South Korea', flag: '🇰🇷' },
  { code: 'NL', name: '荷兰', nameEn: 'Netherlands', flag: '🇳🇱' },
  { code: 'CA', name: '加拿大', nameEn: 'Canada', flag: '🇨🇦' },
  { code: 'CZ', name: '捷克', nameEn: 'Czech Republic', flag: '🇨🇿' },
  { code: 'HR', name: '克罗地亚', nameEn: 'Croatia', flag: '🇭🇷' },
  { code: 'KE', name: '肯尼亚', nameEn: 'Kenya', flag: '🇰🇪' },
  { code: 'LV', name: '拉脱维亚', nameEn: 'Latvia', flag: '🇱🇻' },
  { code: 'RO', name: '罗马尼亚', nameEn: 'Romania', flag: '🇷🇴' },
  { code: 'MG', name: '马达加斯加', nameEn: 'Madagascar', flag: '🇲🇬' },
  { code: 'US', name: '美国', nameEn: 'United States', flag: '🇺🇸' },
  { code: 'MY', name: '马来西亚', nameEn: 'Malaysia', flag: '🇲🇾' },
  { code: 'MX', name: '墨西哥', nameEn: 'Mexico', flag: '🇲🇽' },
  { code: 'ZA', name: '南非', nameEn: 'South Africa', flag: '🇿🇦' },
  { code: 'NO', name: '挪威', nameEn: 'Norway', flag: '🇳🇴' },
  { code: 'PT', name: '葡萄牙', nameEn: 'Portugal', flag: '🇵🇹' },
  { code: 'JP', name: '日本', nameEn: 'Japan', flag: '🇯🇵' },
  { code: 'SE', name: '瑞典', nameEn: 'Sweden', flag: '🇸🇪' },
  { code: 'CH', name: '瑞士', nameEn: 'Switzerland', flag: '🇨🇭' },
  { code: 'SA', name: '沙特阿拉伯', nameEn: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'SK', name: '斯洛伐克', nameEn: 'Slovakia', flag: '🇸🇰' },
  { code: 'TH', name: '泰国', nameEn: 'Thailand', flag: '🇹🇭' },
  { code: 'TR', name: '土耳其', nameEn: 'Turkey', flag: '🇹🇷' },
  { code: 'VE', name: '委内瑞拉', nameEn: 'Venezuela', flag: '🇻🇪' },
  { code: 'VN', name: '越南', nameEn: 'Vietnam', flag: '🇻🇳' },
  { code: 'TW', name: '中国台湾', nameEn: 'Taiwan', flag: '🇹🇼' },
  { code: 'HK', name: '中国香港', nameEn: 'Hong Kong', flag: '🇭🇰' },
  { code: 'SG', name: '新加坡', nameEn: 'Singapore', flag: '🇸🇬' },
  { code: 'NZ', name: '新西兰', nameEn: 'New Zealand', flag: '🇳🇿' },
  { code: 'HU', name: '匈牙利', nameEn: 'Hungary', flag: '🇭🇺' },
  { code: 'SY', name: '叙利亚', nameEn: 'Syria', flag: '🇸🇾' },
  { code: 'JM', name: '牙买加', nameEn: 'Jamaica', flag: '🇯🇲' },
  { code: 'AM', name: '亚美尼亚', nameEn: 'Armenia', flag: '🇦🇲' },
  { code: 'IR', name: '伊朗', nameEn: 'Iran', flag: '🇮🇷' },
  { code: 'IL', name: '以色列', nameEn: 'Israel', flag: '🇮🇱' },
  { code: 'IT', name: '意大利', nameEn: 'Italy', flag: '🇮🇹' },
  { code: 'IN', name: '印度', nameEn: 'India', flag: '🇮🇳' },
  { code: 'ID', name: '印度尼西亚', nameEn: 'Indonesia', flag: '🇮🇩' },
  { code: 'GB', name: '英国', nameEn: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CN', name: '中国', nameEn: 'China', flag: '🇨🇳' },
  { code: 'NG', name: '尼日利亚', nameEn: 'Nigeria', flag: '🇳🇬' },
  { code: 'ES', name: '西班牙', nameEn: 'Spain', flag: '🇪🇸' },
  { code: 'GR', name: '希腊', nameEn: 'Greece', flag: '🇬🇷' },
  { code: 'SG', name: '新加坡', nameEn: 'Singapore', flag: '🇸🇬' },
  { code: 'UA', name: '乌克兰', nameEn: 'Ukraine', flag: '🇺🇦' },
  { code: 'IS', name: '冰岛', nameEn: 'Iceland', flag: '🇮🇸' },
  { code: 'BT', name: '不丹', nameEn: 'Bhutan', flag: '🇧🇹' },
  { code: 'NP', name: '尼泊尔', nameEn: 'Nepal', flag: '🇳🇵' },
  { code: 'MM', name: '缅甸', nameEn: 'Myanmar', flag: '🇲🇲' },
  { code: 'LA', name: '老挝', nameEn: 'Laos', flag: '🇱🇦' },
  { code: 'KH', name: '柬埔寨', nameEn: 'Cambodia', flag: '🇰🇭' },
  { code: 'BN', name: '文莱', nameEn: 'Brunei', flag: '🇧🇳' },
  { code: 'TL', name: '东帝汶', nameEn: 'Timor-Leste', flag: '🇹🇱' },
  { code: 'MN', name: '蒙古', nameEn: 'Mongolia', flag: '🇲🇳' },
  { code: 'KP', name: '朝鲜', nameEn: 'North Korea', flag: '🇰🇵' },
  { code: 'MO', name: '中国澳门', nameEn: 'Macau', flag: '🇲🇴' },
];

// 搜索国家
export function searchCountries(query: string): Country[] {
  if (!query.trim()) return countries.slice(0, 10);
  
  const lowerQuery = query.toLowerCase();
  return countries.filter(
    country => 
      country.name.includes(query) ||
      country.nameEn.toLowerCase().includes(lowerQuery) ||
      country.code.toLowerCase() === lowerQuery
  ).slice(0, 10);
}

// 根据代码获取国家
export function getCountryByCode(code: string): Country | undefined {
  return countries.find(country => country.code === code);
}

// 根据名称获取国家
export function getCountryByName(name: string): Country | undefined {
  return countries.find(country => country.name === name);
}
