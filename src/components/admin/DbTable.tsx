import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DbTableProps {
  title: string;
  data: Record<string, any>[];
}

export const DbTable: React.FC<DbTableProps> = ({ title, data }) => {
  if (!data.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>No data to display.</p>
        </CardContent>
      </Card>
    );
  }

  const headers = Object.keys(data[0]);

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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
