import React, { useRef, useMemo, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getGroupedRowModel,
  getExpandedRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

const ROW_HEIGHT = 32;
const HEADER_HEIGHT = 36;

const helper = createColumnHelper();

function buildTanstackColumns(visibleCols) {
  return visibleCols.map(c =>
    helper.accessor(c.id, {
      id: c.id,
      header: c.header,
      enableSorting: true,
      enableGrouping: c.id !== 'sn',
      aggregationFn: c.numeric ? 'sum' : 'count',
      cell: info => {
        const v = info.getValue();
        if (v === null || v === undefined || v === '') return <span className="text-muted-foreground/40">–</span>;
        if (c.numeric && typeof v === 'number') return <span className="tabular-nums">{v.toLocaleString()}</span>;
        return String(v);
      },
      aggregatedCell: info => {
        const v = info.getValue();
        if (v === null || v === undefined) return null;
        return <span className="font-semibold tabular-nums text-primary">{c.numeric ? Number(v).toLocaleString() : v}</span>;
      },
    })
  );
}

export default function VirtualTable({ rows, visibleCols, groupBy, globalFilter }) {
  const parentRef = useRef(null);

  const columns = useMemo(() => buildTanstackColumns(visibleCols), [visibleCols]);

  const grouping = useMemo(() => (groupBy ? [groupBy] : []), [groupBy]);

  const table = useReactTable({
    data: rows,
    columns,
    state: { grouping, globalFilter },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    autoResetExpanded: false,
    globalFilterFn: 'includesString',
  });

  const { rows: tableRows } = table.getRowModel();

  const virtualizer = useVirtualizer({
    count: tableRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 20,
  });

  const virtualItems = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();
  const paddingTop = virtualItems.length > 0 ? virtualItems[0].start : 0;
  const paddingBottom = virtualItems.length > 0 ? totalSize - virtualItems[virtualItems.length - 1].end : 0;

  const SortIcon = useCallback(({ col }) => {
    const sorted = col.getIsSorted();
    if (!sorted) return <ArrowUpDown className="h-3 w-3 opacity-30" />;
    return sorted === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
  }, []);

  return (
    <div
      ref={parentRef}
      className="overflow-auto border rounded-lg"
      style={{ height: 'calc(100vh - 340px)', minHeight: 400 }}
    >
      <table className="text-xs border-collapse" style={{ width: 'max-content', minWidth: '100%' }}>
        <thead className="sticky top-0 z-20 bg-card">
          {table.getHeaderGroups().map(hg => (
            <tr key={hg.id} style={{ height: HEADER_HEIGHT }}>
              {hg.headers.map(header => (
                <th
                  key={header.id}
                  className={cn(
                    'px-2.5 text-left font-medium text-muted-foreground border-b border-r last:border-r-0 whitespace-nowrap select-none bg-muted/50',
                    header.column.getCanSort() && 'cursor-pointer hover:bg-muted'
                  )}
                  style={{ width: header.getSize() }}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  <div className="flex items-center gap-1">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getCanSort() && <SortIcon col={header.column} />}
                  </div>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {paddingTop > 0 && <tr><td style={{ height: paddingTop }} /></tr>}
          {virtualItems.map(vRow => {
            const row = tableRows[vRow.index];
            const isGrouped = row.getIsGrouped();
            return (
              <tr
                key={row.id}
                className={cn(
                  'border-b hover:bg-muted/30 transition-colors',
                  isGrouped && 'bg-violet-50/60 dark:bg-violet-950/20 font-medium'
                )}
                style={{ height: ROW_HEIGHT }}
              >
                {row.getVisibleCells().map((cell, ci) => {
                  if (cell.getIsGrouped()) {
                    return (
                      <td
                        key={cell.id}
                        className="px-2.5 border-r last:border-r-0"
                        colSpan={visibleCols.length - ci}
                      >
                        <button
                          className="flex items-center gap-1.5 text-violet-700 dark:text-violet-300 font-semibold"
                          onClick={row.getToggleExpandedHandler()}
                        >
                          {row.getIsExpanded()
                            ? <ChevronDown className="h-3.5 w-3.5" />
                            : <ChevronRight className="h-3.5 w-3.5" />}
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          <span className="text-muted-foreground font-normal ml-1">
                            ({row.subRows.length})
                          </span>
                        </button>
                      </td>
                    );
                  }
                  if (cell.getIsAggregated()) {
                    return (
                      <td key={cell.id} className="px-2.5 border-r last:border-r-0 text-right">
                        {flexRender(cell.column.columnDef.aggregatedCell ?? cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    );
                  }
                  if (cell.getIsPlaceholder()) {
                    return <td key={cell.id} className="border-r last:border-r-0" />;
                  }
                  return (
                    <td key={cell.id} className="px-2.5 border-r last:border-r-0 whitespace-nowrap">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  );
                })}
              </tr>
            );
          })}
          {paddingBottom > 0 && <tr><td style={{ height: paddingBottom }} /></tr>}
        </tbody>
      </table>

      {tableRows.length === 0 && (
        <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
          No records match the current filters
        </div>
      )}
    </div>
  );
}
