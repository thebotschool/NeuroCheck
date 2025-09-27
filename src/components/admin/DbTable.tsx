import React from 'react';
import { useTranslation } from 'react-i18next';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DbTableProps {
  title: string;
  data: Record<string, any>[];
  excludeColumns?: string[];
  actions?: (row: Record<string, any>) => React.ReactNode;
}

export const DbTable: React.FC<DbTableProps> = ({ title, data, excludeColumns = [], actions }) => {
  const { t } = useTranslation();

  if (!data.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{t('dbTable.noData')}</p>
        </CardContent>
      </Card>
    );
  }

  const headers = Object.keys(data[0]).filter(header => !excludeColumns.includes(header));

  const renderCell = (cellData: any) => {
    if (cellData === null) return 'NULL';
    if (typeof cellData === 'object') {
      return <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(cellData, null, 2)}</pre>;
    }
    return cellData.toString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {headers.map((header) => (
                  <TableHead key={header}>{header}</TableHead>
                ))}
                {actions && <TableHead>{t('dbTable.actions')}</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {headers.map((header) => (
                    <TableCell key={header}>
                      {renderCell(row[header])}
                    </TableCell>
                  ))}
                  {actions && <TableCell>{actions(row)}</TableCell>}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
