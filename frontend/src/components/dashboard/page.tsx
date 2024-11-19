"use client";

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronDown, TrendingDown } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface Expense {
  id: number;
  name: string;
  division: string;
  category: string;
  date: string;
  amount: string;
}

interface EditedExpense extends Expense {
  amount: string;
}

function ExpenseDashboard() {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedExpense, setSelectedExpense] = React.useState<Expense | null>(
    null
  );

  const [unreconciled, setUnreconciled] = React.useState<Expense[]>([
    {
      id: 1,
      name: "Expense 1",
      division: "Division 1",
      category: "Marketing",
      date: "12/02/24",
      amount: "£14,500",
    },
    {
      id: 2,
      name: "Expense 2",
      division: "Division 3",
      category: "Marketing",
      date: "20/02/24",
      amount: "£20,130",
    },
    {
      id: 3,
      name: "Expense 3",
      division: "Division 2",
      category: "Marketing",
      date: "14/02/24",
      amount: "£8,650",
    },
  ]);

  const [reconciled, setReconciled] = React.useState<Expense[]>([]);

  const [editedExpense, setEditedExpense] = React.useState<Expense | null>(
    null
  );
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);

  // Update the handleResolveConfirm function
  const handleResolveConfirm = (editedExpense: EditedExpense) => {
    if (!editedExpense && !selectedFile) return;

    const updatedExpenses = unreconciled.filter(
      (expense) => expense.id !== editedExpense.id
    );

    setReconciled([...reconciled, editedExpense]);
    setUnreconciled(updatedExpenses);
    setIsDialogOpen(false);
    setSelectedFile(null);
    setEditedExpense(null);
    setSelectedExpense(null);
  };

  const handleResolveClick = (expense: Expense) => {
    setSelectedExpense(expense);
    setEditedExpense({
      ...expense,
      amount: expense.amount.replace("£", ""),
    });
    setIsDialogOpen(true);
  };

  // Update the amount input to handle the £ symbol better
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editedExpense) return;

    const value = e.target.value;
    const numericValue = value.replace(/[^0-9.]/g, "");

    setEditedExpense({
      ...editedExpense,
      amount: `£${numericValue}`,
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const chartData = [
    { month: "January", div1: 75, div2: 85, div3: 65 },
    { month: "February", div1: 78, div2: 82, div3: 68 },
    { month: "March", div1: 80, div2: 85, div3: 70 },
    { month: "April", div1: 77, div2: 83, div3: 68 },
    { month: "May", div1: 82, div2: 86, div3: 71 },
    { month: "June", div1: 85, div2: 88, div3: 75 },
  ];

  const chartConfig = {
    div1: {
      label: "Division 1",
      color: "hsl(var(--chart-1))",
    },
    div2: {
      label: "Division 2",
      color: "hsl(var(--chart-2))",
    },
    div3: {
      label: "Division 3",
      color: "hsl(var(--chart-3))",
    },
  } satisfies ChartConfig;

  const distributionData = [
    { name: "Division 1", value: 27, fill: "hsl(var(--chart-1))" },
    { name: "Division 2", value: 23, fill: "hsl(var(--chart-2))" },
    { name: "Division 3", value: 18, fill: "hsl(var(--chart-3))" },
    { name: "Unreconciled", value: 32, fill: "hsl(var(--destructive))" },
  ];

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      <Tabs defaultValue="overview" className="mb-8">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="division1">Division 1</TabsTrigger>
          <TabsTrigger value="division2">Division 2</TabsTrigger>
          <TabsTrigger value="division3">Division 3</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8">
          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">
              Unreconciled expenses:
            </h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer">
                    Name <ChevronDown className="inline h-4 w-4" />
                  </TableHead>
                  <TableHead className="cursor-pointer">
                    Division <ChevronDown className="inline h-4 w-4" />
                  </TableHead>
                  <TableHead className="cursor-pointer">
                    Category <ChevronDown className="inline h-4 w-4" />
                  </TableHead>
                  <TableHead className="cursor-pointer">
                    Date <ChevronDown className="inline h-4 w-4" />
                  </TableHead>
                  <TableHead className="cursor-pointer">
                    Amount <ChevronDown className="inline h-4 w-4" />
                  </TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unreconciled.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{expense.name}</TableCell>
                    <TableCell>{expense.division}</TableCell>
                    <TableCell>{expense.category}</TableCell>
                    <TableCell>{expense.date}</TableCell>
                    <TableCell>{expense.amount}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        onClick={() => handleResolveClick(expense)}
                        className="glow-effect hover:bg-violet-600 transition-all duration-300"
                      >
                        Resolve Expense
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-12">
            <h2 className="text-2xl font-semibold mb-8">Overall Spending</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="flex flex-col gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Division Performance</CardTitle>
                    <CardDescription>January - June 2024</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig}>
                      <BarChart accessibilityLayer data={chartData}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                          dataKey="month"
                          tickLine={false}
                          tickMargin={10}
                          axisLine={false}
                          tickFormatter={(value) => value.slice(0, 3)}
                        />
                        <ChartTooltip
                          cursor={false}
                          content={<ChartTooltipContent indicator="dashed" />}
                        />
                        <Bar
                          dataKey="div1"
                          fill="var(--color-div1)"
                          radius={4}
                        />
                        <Bar
                          dataKey="div2"
                          fill="var(--color-div2)"
                          radius={4}
                        />
                        <Bar
                          dataKey="div3"
                          fill="var(--color-div3)"
                          radius={4}
                        />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                  <CardFooter className="flex-col items-start gap-2 text-sm">
                    <div className="flex gap-2 font-medium leading-none">
                      Overall spending down 3.2% this month{" "}
                      <TrendingDown className="h-4 w-4" />
                    </div>
                    <div className="leading-none text-muted-foreground">
                      Showing division performance for the last 6 months
                    </div>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Division Distribution</CardTitle>
                    <CardDescription>Current Month</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={distributionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, value }) => `${name} (${value}%)`}
                        >
                          {distributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                  <CardFooter className="flex justify-between text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      {distributionData.map((item, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: item.fill }}
                          />
                          <span className="text-muted-foreground">
                            {item.name}: {item.value}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardFooter>
                </Card>
              </div>

              <div className="flex flex-col gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Total Spending</CardTitle>
                    <CardDescription>+20.1% from last month</CardDescription>
                  </CardHeader>
                  <CardContent className="text-xl font-semibold">
                    £
                    {unreconciled.reduce((acc, expense) => {
                      return (
                        acc +
                        parseFloat(
                          expense.amount.replace("£", "").replace(",", "")
                        )
                      );
                    }, 0) +
                      reconciled.reduce((acc, expense) => {
                        return (
                          acc +
                          parseFloat(
                            expense.amount.replace("£", "").replace(",", "")
                          )
                        );
                      }, 0)}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Resolved</CardTitle>
                    <CardDescription>Highest spend: Marketing</CardDescription>
                  </CardHeader>
                  <CardContent className="text-xl font-semibold">
                    £
                    {reconciled.reduce((acc, expense) => {
                      return (
                        acc +
                        parseFloat(
                          expense.amount.replace("£", "").replace(",", "")
                        )
                      );
                    }, 0)}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Not Resolved</CardTitle>
                    <CardDescription>
                      {reconciled.length} expenses resolved this month
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-xl font-semibold">
                    £
                    {unreconciled.reduce((acc, expense) => {
                      return (
                        acc +
                        parseFloat(
                          expense.amount.replace("£", "").replace(",", "")
                        )
                      );
                    }, 0)}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="division1">
          <div className="h-96 flex items-center justify-center text-gray-500">
            Division 1 content
          </div>
        </TabsContent>

        <TabsContent value="division2">
          <div className="h-96 flex items-center justify-center text-gray-500">
            Division 2 content
          </div>
        </TabsContent>

        <TabsContent value="division3">
          <div className="h-96 flex items-center justify-center text-gray-500">
            Division 3 content
          </div>
        </TabsContent>
      </Tabs>
      {selectedExpense && editedExpense && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Resolve Expense</DialogTitle>
              <DialogDescription>
                Match this expense with an invoice and update details if needed.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">
                  Amount
                </Label>
                <div className="col-span-3 relative">
                  <span className="absolute left-3 top-2">£</span>
                  <Input
                    id="amount"
                    type="text"
                    value={editedExpense.amount?.replace("£", "") || ""}
                    onChange={handleAmountChange}
                    className="pl-6"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="invoice" className="text-right">
                  Invoice
                </Label>
                <div className="col-span-3">
                  <Input
                    id="invoice"
                    type="file"
                    onChange={handleFileChange}
                    className="col-span-3"
                    accept=".pdf,.jpg,.png,.xlsx"
                  />
                  {selectedFile && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Selected: {selectedFile.name}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => handleResolveConfirm(editedExpense)}>
                Confirm Match
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default ExpenseDashboard;
