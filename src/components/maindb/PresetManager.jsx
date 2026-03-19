import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Bookmark, BookmarkCheck, Trash2 } from 'lucide-react';

export default function PresetManager({ presets, onSave, onLoad, onDelete }) {
  const [name, setName] = useState('');

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
          <Bookmark className="h-3.5 w-3.5" />
          Presets {presets.length > 0 && <Badge className="h-4 px-1 text-[9px]">{presets.length}</Badge>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="end">
        <p className="text-xs font-semibold mb-2">Filter Presets</p>

        <div className="flex gap-1.5 mb-3">
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Preset name…"
            className="h-7 text-xs flex-1"
            onKeyDown={e => { if (e.key === 'Enter' && name.trim()) { onSave(name.trim()); setName(''); } }}
          />
          <Button
            size="sm" className="h-7 px-2 text-xs"
            disabled={!name.trim()}
            onClick={() => { onSave(name.trim()); setName(''); }}
          >
            Save
          </Button>
        </div>

        {presets.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-3">No saved presets</p>
        ) : (
          <div className="space-y-1">
            {presets.map(p => (
              <div key={p.name} className="flex items-center gap-1.5 group">
                <button
                  className="flex-1 text-left text-xs py-1.5 px-2 rounded hover:bg-muted transition-colors flex items-center gap-1.5"
                  onClick={() => onLoad(p)}
                >
                  <BookmarkCheck className="h-3 w-3 text-primary shrink-0" />
                  <span className="truncate">{p.name}</span>
                </button>
                <button
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 text-destructive transition-all"
                  onClick={() => onDelete(p.name)}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
