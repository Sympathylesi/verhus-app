import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

const ALL = '__all__';

export default function FilterPanel({ filters, setFilters, options, onReset }) {
  const set = (key, val) => setFilters(f => ({ ...f, [key]: val }));

  const Sel = ({ fkey, label, opts }) => (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{label}</span>
      <Select value={filters[fkey] || ALL} onValueChange={v => set(fkey, v === ALL ? '' : v)}>
        <SelectTrigger className="h-8 text-xs w-full">
          <SelectValue placeholder={`All ${label}`} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All</SelectItem>
          {opts.filter(o => o !== '').map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );

  const NumRange = ({ fkey, label }) => (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{label}</span>
      <div className="flex items-center gap-1">
        <Input
          type="number" placeholder="From"
          value={filters[`${fkey}_from`] || ''}
          onChange={e => set(`${fkey}_from`, e.target.value)}
          className="h-8 text-xs w-20"
        />
        <span className="text-muted-foreground text-xs">–</span>
        <Input
          type="number" placeholder="To"
          value={filters[`${fkey}_to`] || ''}
          onChange={e => set(`${fkey}_to`, e.target.value)}
          className="h-8 text-xs w-20"
        />
      </div>
    </div>
  );

  return (
    <div className="bg-muted/40 border rounded-lg p-3 space-y-3 animate-in slide-in-from-top-2 duration-150">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold">Filters</span>
        <Button variant="ghost" size="sm" className="h-6 text-xs gap-1 text-muted-foreground" onClick={onReset}>
          <X className="h-3 w-3" /> Reset
        </Button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Sel fkey="region"           label="Region"      opts={options.regions} />
        <Sel fkey="district"         label="District"    opts={options.districts} />
        <Sel fkey="health_area_name" label="Health Area" opts={options.healthAreas} />
        <Sel fkey="community"        label="Community"   opts={options.communities} />
        <Sel fkey="strategy"         label="Strategy"    opts={options.strategies} />
        <Sel fkey="status"           label="Status"      opts={options.statuses} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <NumRange fkey="week_number" label="Week range" />
        <NumRange fkey="year"        label="Year range" />
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Stock-Out</span>
          <Select value={filters.scr_stock_out || ALL} onValueChange={v => set('scr_stock_out', v === ALL ? '' : v)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Any</SelectItem>
              <SelectItem value="Yes">Yes</SelectItem>
              <SelectItem value="No">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Group by</span>
          <Select value={filters.groupBy || '__none__'} onValueChange={v => set('groupBy', v === '__none__' ? '' : v)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">None</SelectItem>
              <SelectItem value="region">Region</SelectItem>
              <SelectItem value="district">District</SelectItem>
              <SelectItem value="health_area_name">Health Area</SelectItem>
              <SelectItem value="week_number">Week</SelectItem>
              <SelectItem value="year">Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
