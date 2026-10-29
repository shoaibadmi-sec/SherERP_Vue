import { ArrowRight } from "lucide-react";
import { Button } from "../Button";
import { Panel } from "../Panel";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "../Table";
import { useUiCopy } from "../../i18n/useUiCopy";
import { formatReportCell } from "./ReportResults";
import { reportColumns } from "../../reports/catalog";
import type { ReportRow } from "../../reports/types";

export function ReportEvidencePanel({
  title,
  titleBn,
  rows,
  columns = ["amount"],
  onDetail,
  onOpen,
  note,
  noteBn,
}: {
  title: string;
  titleBn: string;
  rows: ReportRow[];
  columns?: string[];
  onDetail: (row: ReportRow) => void;
  onOpen?: () => void;
  note?: string;
  noteBn?: string;
}) {
  const { text, language } = useUiCopy();
  return (
    <Panel
      title={text(title, titleBn)}
      actions={
        onOpen && (
          <Button variant="ghost" onClick={onOpen}>
            {text("View all", "সব দেখুন")}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        )
      }
      bodyClassName="p-0"
    >
      {note&&<p className="px-4 py-2 text-xs leading-5 text-ink-500">{text(note,noteBn??note)}</p>}
      {rows.length ? (
        <Table scrollRegionLabel={text(title, titleBn)}>
          <TableHeader>
            <TableRow>
              <TableHead className="px-4 py-2">
                {text("Source", "মূল তথ্য")}
              </TableHead>
              {columns.map((column) => (
                <TableHead className="px-4 py-2 text-right" key={column}>
                  {text(
                    reportColumns[column]?.en ?? column,
                    reportColumns[column]?.bn ?? column,
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.slice(0, 5).map((row) => (
              <TableRow key={row.id}>
                <TableCell className="px-4 py-2 whitespace-normal">
                  <button
                    type="button"
                    className="rounded text-left font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    onClick={() => onDetail(row)}
                  >
                    {language === "Bangla"
                      ? (row.labelBn ?? row.label)
                      : row.label}
                  </button>
                  {row.party && row.party !== row.label && (
                    <span
                      data-table-helper=""
                      className="mt-0.5 block text-ink-500"
                    >
                      {row.party}
                    </span>
                  )}
                </TableCell>
                {columns.map((column) => (
                  <TableCell
                    className="whitespace-nowrap px-4 py-2 text-right"
                    key={column}
                  >
                    {formatReportCell(row, column, language)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="px-4 py-6 text-sm text-ink-500">
          {text(
            "No source records match this selection.",
            "এই ফিল্টারে মূল রেকর্ড নেই।",
          )}
        </p>
      )}
    </Panel>
  );
}
