import { useLoaderData } from "react-router-dom";
import {
  createColumnHelper,
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";
import { useState, useEffect } from "react";
import { useUrlState } from "./useUrlState";

export async function loader({ request }) {
  const params = new URL(request.url).searchParams;
  const sortParams = params.getAll("sort");
  // pretend to fetch data from server where colA is sorted descending
  if (sortParams && sortParams.find((s) => s === "colA:desc")) {
    return [
      {
        colA: "A3",
        colB: "B1",
        colC: "C1",
      },
      {
        colA: "A2",
        colB: "B2",
        colC: "C2",
      },
      {
        colA: "A1",
        colB: "B3",
        colC: "C3",
      },
    ];
  }

  return [
    {
      colA: "A1",
      colB: "B1",
      colC: "C1",
    },
    {
      colA: "A2",
      colB: "B2",
      colC: "C2",
    },
    {
      colA: "A3",
      colB: "B3",
      colC: "C3",
    },
  ];
}

const columnHelper = createColumnHelper();

const columns = [
  columnHelper.accessor("colA", { cell: (info) => info.getValue() }),
  columnHelper.accessor("colB", { cell: (info) => info.getValue() }),
  columnHelper.accessor("colC", { cell: (info) => info.getValue() }),
];

const saveTable = (tableState) => {
  localStorage.setItem("tablename", JSON.stringify(tableState));
};

const loadStorage = () => {
  return JSON.parse(localStorage.getItem("tablename"));
};

export default function Table() {
  const data = useLoaderData();
  const [initialized, setInitialized] = useState(false);

  const [{ sort, filter, pageSize, pageIndex }, setParams] = useUrlState({
    arrayKeys: ["sort", "filter", "pageSize", "pageIndex"],
  });

  // React Table expects the sort state to be an array of { id: string, desc: boolean}
  const tableSortingState = sort.map((s) => ({
    id: s.split(":")[0],
    desc: s.split(":")[1] === "desc",
  }));

  useEffect(() => {
    if (initialized) return;

    const storedTableState = loadStorage();

    // Not sure if we should check if the states are the same prior to setting Params
    setParams((prevParams) => ({
      ...prevParams,
      sort: sort?.length ? sort : storedTableState?.sort ?? [],
      filter: filter?.length ? filter : storedTableState?.filter ?? [],
      pageSize: pageSize?.length ? pageSize : storedTableState?.pageSize ?? [],
      pageIndex: pageIndex?.length ? pageIndex : storedTableState?.pageIndex ?? [],
    }));

    setInitialized(true);
  }, [initialized, setParams, sort, filter, pageIndex, pageSize]);

  useEffect(() => {
    if (initialized) {
      saveTable({ sort, filter, pageSize, pageIndex });
    }
  }, [initialized, filter, pageIndex, pageSize, sort]);

  const handleTestParams = () => {
    const test = {
      sort: ["colA:asc", "colB:desc"],
      filter: ["colB:=:5"],
      pageSize: ["20"],
      pageIndex: ["1"],
    };

    setParams(test);
  };

  const handleToggleSort = (column) => {
    if (!column.getCanSort()) return;

    const newSort = sort?.filter((sort) => !sort.startsWith(`${column.id}:`)) || [];
    if (column.getNextSortingOrder()) {
      newSort.push(`${column.id}:${column.getNextSortingOrder()}`);
    }

    setParams((prevParams) => ({
      ...prevParams,
      sort: newSort,
    }));
    column.toggleSorting(undefined, true);
  };

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting: tableSortingState,
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualSorting: true,
  });

  return (
    <div>
      <pre>Sorts: {JSON.stringify(sort)}</pre>
      <pre>Filters: {JSON.stringify(filter)}</pre>
      <pre>Page Size: {JSON.stringify(pageSize)}</pre>
      <pre>Page Index: {JSON.stringify(pageIndex)}</pre>
      <table>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <th key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder ? null : (
                      <div
                        {...{
                          className: header.column.getCanSort()
                            ? "cursor-pointer select-none"
                            : "",
                          onClick: () => handleToggleSort(header.column),
                        }}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {{
                          asc: " 🔼",
                          desc: " 🔽",
                        }[header.column.getIsSorted()] ?? null}
                      </div>
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <button
        onClick={() =>
          setParams((prevParams) => ({ ...prevParams, sort: ["colA:asc"] }))
        }
      >
        Sort by colA asc
      </button>
      <button onClick={() => setParams({})}>Clear Parameters</button>
      <button onClick={handleTestParams}>Set Test Params</button>
    </div>
  );
}
