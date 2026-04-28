'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp } from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ReferenceLine } from 'recharts';
import type { Tables } from '@/lib/repositories';

interface FinancialChartsProps {
  financials: Pick<Tables<'company_financials'>, 'fiscal_year' | 'revenue_usd_mn' | 'ebitda_usd_mn'>[];
}

const formatCurrency = (value: number | null) => {
  if (value === null || value === undefined) return '-';
  if (Math.abs(value) >= 1000) {
    const billions = value / 1000;
    return `$${billions.toFixed(2)}B`;
  }
  return `$${value.toFixed(2)}M`;
};

export function FinancialCharts({ financials }: FinancialChartsProps) {
  const sorted = [...financials].sort((a, b) => a.fiscal_year - b.fiscal_year);

  const revenueData = sorted.map((row) => ({
    year: String(row.fiscal_year),
    value: row.revenue_usd_mn ?? 0,
  }));

  const ebitdaData = sorted.map((row) => ({
    year: String(row.fiscal_year),
    value: row.ebitda_usd_mn ?? 0,
  }));

  const colClass = (n: number) => {
    if (n <= 1) return 'grid-cols-1';
    if (n === 2) return 'grid-cols-2';
    if (n === 3) return 'grid-cols-3';
    if (n === 4) return 'grid-cols-4';
    return 'grid-cols-4';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Revenue Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Revenue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[180px]">
            <ChartContainer
              config={{
                value: {
                  label: "Revenue",
                  color: "hsl(var(--primary))",
                },
              }}
              className="h-full w-full"
            >
              <BarChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                <XAxis dataKey="year" className="text-xs" />
                <YAxis
                  tickFormatter={(value) => formatCurrency(value)}
                  className="text-xs"
                  width={60}
                />
                <ReferenceLine y={0} stroke="hsl(var(--border))" strokeWidth={1} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => formatCurrency(value as number)}
                    />
                  }
                />
                <Bar
                  dataKey="value"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </div>
          {revenueData.length > 0 && (
            <div className={`grid gap-2 mt-3 pt-3 border-t ${colClass(revenueData.length)}`}>
              {revenueData.map((item) => (
                <div key={item.year} className="text-center">
                  <p className="text-xs text-muted-foreground">{item.year}</p>
                  <p className="font-semibold text-sm">{formatCurrency(item.value)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* EBITDA Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-success" />
            EBITDA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[180px]">
            <ChartContainer
              config={{
                value: {
                  label: "EBITDA",
                  color: "hsl(var(--success))",
                },
              }}
              className="h-full w-full"
            >
              <BarChart data={ebitdaData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                <XAxis dataKey="year" className="text-xs" />
                <YAxis
                  tickFormatter={(value) => formatCurrency(value)}
                  className="text-xs"
                  width={60}
                />
                <ReferenceLine y={0} stroke="hsl(var(--border))" strokeWidth={1} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => formatCurrency(value as number)}
                    />
                  }
                />
                <Bar
                  dataKey="value"
                  fill="hsl(var(--success))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </div>
          {ebitdaData.length > 0 && (
            <div className={`grid gap-2 mt-3 pt-3 border-t ${colClass(ebitdaData.length)}`}>
              {ebitdaData.map((item) => (
                <div key={item.year} className="text-center">
                  <p className="text-xs text-muted-foreground">{item.year}</p>
                  <p className="font-semibold text-sm">{formatCurrency(item.value)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
