import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Columns3 } from 'lucide-react';
import { COLUMN_GROUPS, COLUMN_DEFS } from '@/lib/mainDbColumns';

export default function ColumnVisibilityPanel({ visibility, onToggle, onToggleGroup }) {
  const [openGroup, setOpenGroup] = useState(null);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
          <Columns3 className="h-3.5 w-3.5" />
          Columns
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3 max-h-[70vh] overflow-y-auto" align="end">
        <p className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wide">Column Visibility</p>
        {COLUMN_GROUPS.map(group => {
          const groupCols = COLUMN_DEFS.filter(c => c.group === group);
          const allOn = groupCols.every(c => visibility[c.id] !== false);
          return (
            <div key={group} className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <button
                  className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide hover:text-foreground"
                  onClick={() => setOpenGroup(openGroup === group ? null : group)}
                >
                  {group} ({groupCols.length})
                </button>
                <button
                  className="text-[10px] text-primary hover:underline"
                  onClick={() => onToggleGroup(group, !allOn)}
                >
                  {allOn ? 'Hide all' : 'Show all'}
                </button>
              </div>
              {(openGroup === group || ['Identity', 'Totals'].includes(group)) && (
                <div className="space-y-1 pl-1">
                  {groupCols.map(c => (
                    <label key={c.id} className="flex items-center gap-2 cursor-pointer py-0.5">
                      <Checkbox
                        checked={visibility[c.id] !== false}
                        onCheckedChange={() => onToggle(c.id)}
                        className="h-3.5 w-3.5"
                      />
                      <span className="text-xs">{c.header}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}
