"use client";

import * as React from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchWorkOrders } from "@/redux/slices/production/workOrderSlice";
import { RootState, AppDispatch } from "@/redux/store";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

/* ================================
   DEBOUNCE (INLINE)
================================ */
function useDebounce<T>(value: T, delay = 500) {
  const [debounced, setDebounced] = React.useState(value);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

/* ================================
   MAIN COMPONENT
================================ */
export default function WorkOrderReport() {
  const dispatch = useDispatch<AppDispatch>();
  const { list, pagination, loading } = useSelector(
    (state: RootState) => state.workOrders
  );

  const [page, setPage] = React.useState(1);
  const [sort, setSort] = React.useState({
    field: "startDate",
    order: "desc",
  });

  const [filters, setFilters] = React.useState({
    orderNo: "",
    product: "",
    status: "",
  });

  const debouncedFilters = useDebounce(filters);

  React.useEffect(() => {
    const organisationId = localStorage.getItem("organisationId");
    if (!organisationId) return;

    dispatch(
      fetchWorkOrders({
        organisationId,
        page,
        limit: 10,
        filters: debouncedFilters,
        sort,
      })
    );
  }, [dispatch, page, sort, debouncedFilters]);

  /* ================================
     KPI CALCULATIONS
  ================================ */
  const total = pagination.total || 0;
  const completed = list.filter((o) => o.status === "completed").length;
  const pending = total - completed;
  const completedPercent = total
    ? Math.round((completed / total) * 100)
    : 0;

  /* ================================
     EXPORT FUNCTIONS
  ================================ */
  function exportExcel() {
    const ws = XLSX.utils.json_to_sheet(list);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "WorkOrders");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), "work-orders.xlsx");
  }

  function exportPDF() {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [["WO No", "Product", "Qty", "Status", "Planned Hrs"]],
      body: list.map((o) => [
        o.orderNo,
        o.productName,
        o.quantity,
        o.status,
        o.plannedHours,
      ]),
    });
    doc.save("work-orders.pdf");
  }

  if (loading) {
    return <div className="p-6 text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6 bg-muted/30 min-h-screen">
      {/* ================= KPI ================= */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Kpi title="Total Work Orders" value={total} />
        <Kpi title="Completed %" value={`${completedPercent}%`} />
        <Kpi title="Pending Orders" value={pending} />
        <Kpi
          title="In Progress"
          value={list.filter((o) => o.status === "in-progress").length}
        />
      </div>

      {/* ================= ACTIONS ================= */}
      <div className="flex gap-2">
        <Button onClick={exportExcel}>Export Excel</Button>
        <Button variant="outline" onClick={exportPDF}>
          Export PDF
        </Button>
      </div>

      {/* ================= FILTERS ================= */}
      <Card>
        <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Work Order No"
            onChange={(e) =>
              setFilters({ ...filters, orderNo: e.target.value })
            }
          />
          <Input
            placeholder="Product"
            onChange={(e) =>
              setFilters({ ...filters, product: e.target.value })
            }
          />
          <Input
            placeholder="Status"
            onChange={(e) =>
              setFilters({ ...filters, status: e.target.value })
            }
          />
        </CardContent>
      </Card>

      {/* ================= TABLE ================= */}
      <Card>
        <CardHeader>
          <CardTitle>Work Orders</CardTitle>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHead label="WO No" field="orderNo" sort={sort} setSort={setSort} />
                <SortableHead label="Product" field="productName" sort={sort} setSort={setSort} />
                <SortableHead label="Qty" field="quantity" sort={sort} setSort={setSort} />
                <SortableHead label="Start Date" field="startDate" sort={sort} setSort={setSort} />
                <TableHead>Status</TableHead>
                <SortableHead label="Planned Hrs" field="plannedHours" sort={sort} setSort={setSort} />
              </TableRow>
            </TableHeader>

            <TableBody>
              {list.map((wo) => (
                <TableRow key={wo._id}>
                  <TableCell>{wo.orderNo}</TableCell>
                  <TableCell>{wo.productName}</TableCell>
                  <TableCell>{wo.quantity}</TableCell>
                  <TableCell>{wo.startDate}</TableCell>
                  <TableCell>
                    <Badge>{wo.status}</Badge>
                  </TableCell>
                  <TableCell>{wo.plannedHours}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* ================= PAGINATION ================= */}
          <div className="flex items-center justify-between mt-4">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>

            <span className="text-sm text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages}
            </span>

            <Button
              variant="outline"
              disabled={page === pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ================================
   SMALL COMPONENTS
================================ */
function SortableHead({ label, field, sort, setSort }: any) {
  const active = sort.field === field;

  return (
    <TableHead
      className="cursor-pointer select-none"
      onClick={() =>
        setSort({
          field,
          order:
            active && sort.order === "asc"
              ? "desc"
              : "asc",
        })
      }
    >
      {label}
      {active && (sort.order === "asc" ? " ↑" : " ↓")}
    </TableHead>
  );
}

function Kpi({ title, value }: { title: string; value: any }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">{title}</p>
        <h2 className="text-2xl font-semibold mt-1">{value}</h2>
      </CardContent>
    </Card>
  );
}
