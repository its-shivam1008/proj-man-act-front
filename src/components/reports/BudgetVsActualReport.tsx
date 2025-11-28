"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { fetchBudgetsByProject } from "@/redux/slices/budgetSlice";
import { fetchWbsByProject } from "@/redux/slices/wbsSlice";

import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectTrigger, SelectValue, SelectItem, SelectContent } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
    projectList: { _id: string; name: string }[];
}

export default function BudgetVsActualReport({ projectList }: Props) {
    const dispatch = useDispatch<AppDispatch>();

    const [selectedProject, setSelectedProject] = useState<string>("");

    const { budgets: budgetData, loading: budgetLoading } = useSelector(
        (state: RootState) => state.budget
    );

    const { wbs: wbsData, loading: wbsLoading } = useSelector(
        (state: RootState) => state.wbs
    );


    useEffect(() => {
        if (selectedProject) {
            dispatch(fetchBudgetsByProject(selectedProject));
            dispatch(fetchWbsByProject(selectedProject));
        }
    }, [selectedProject, dispatch]);

    const loading = budgetLoading || wbsLoading;

    // Calculate actual costs from WBS Materials & Labor
    const actualCost = wbsData?.reduce((sum, item) => {
        const labor = item?.assignedPersons?.reduce(
            (x: number, p: any) => x + (p.cost || 0),
            0
        );
        const materials = item?.assignedMaterials?.reduce(
            (x: number, m: any) => x + (m.totalCost || 0),
            0
        );
        return sum + labor + materials;
    }, 0) || 0;

    const totalBudget = budgetData?.reduce(
        (sum: number, b: any) => sum + b.amount,
        0
    ) || 0;

    const variance = totalBudget - actualCost;
    const variancePercent = totalBudget ? (actualCost / totalBudget) * 100 : 0;

    return (
        <div className="space-y-6">
            {/* Top Bar */}
            <Card className="border shadow-lg">
                <CardHeader>
                    <CardTitle className="text-xl font-bold">Budget vs Actual Report</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="max-w-sm">
                        <Select onValueChange={setSelectedProject}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Project" />
                            </SelectTrigger>
                            <SelectContent>
                                {projectList?.map((p) => (
                                    <SelectItem key={p._id} value={p._id}>
                                        {p.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {loading ? (
                    <>
                        <Skeleton className="h-32 w-full rounded-xl" />
                        <Skeleton className="h-32 w-full rounded-xl" />
                        <Skeleton className="h-32 w-full rounded-xl" />
                    </>
                ) : (
                    <>
                        <SummaryCard title="Total Budget" value={totalBudget} />
                        <SummaryCard title="Actual Cost" value={actualCost} />
                        <SummaryCard
                            title="Variance"
                            value={variance}
                            highlight={variance >= 0 ? "green" : "red"}
                        />
                    </>
                )}
            </div>

            {/* Variance Progress */}
            <Card className="shadow-md">
                <CardHeader>
                    <CardTitle className="font-semibold">Budget Utilization</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <Skeleton className="h-8 w-full" />
                    ) : (
                        <>
                            <Progress value={variancePercent} className="h-3" />
                            <p className="text-sm mt-2 text-muted-foreground">
                                {variancePercent.toFixed(1)}% of budget used
                            </p>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Detailed Table */}
            <Card className="border shadow-lg">
                <CardHeader>
                    <CardTitle className="font-semibold">Detailed Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <Skeleton className="h-40 w-full" />
                    ) : (
                        <Table className="min-w-full">
                            <TableHeader>
                                <TableRow>
                                    <TableHead>WBS Item</TableHead>
                                    <TableHead>Budget</TableHead>
                                    <TableHead>Actual Cost</TableHead>
                                    <TableHead>Variance</TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {budgetData?.map((budgetItem: any) => {
                                    const wbs = wbsData?.find((w: any) => w._id === budgetItem.wbsId);

                                    const aCost =
                                        (wbs?.assignedPersons?.reduce(
                                            (x: number, p: any) => x + (p.cost || 0),
                                            0
                                        ) || 0) +
                                        (wbs?.assignedMaterials?.reduce(
                                            (x: number, m: any) => x + (m.totalCost || 0),
                                            0
                                        ) || 0);

                                    const v = budgetItem.amount - aCost;

                                    return (
                                        <TableRow key={budgetItem._id}>
                                            <TableCell className="font-medium">{budgetItem.name}</TableCell>
                                            <TableCell>₹{budgetItem.amount?.toLocaleString()}</TableCell>
                                            <TableCell>₹{aCost?.toLocaleString()}</TableCell>
                                            <TableCell
                                                className={`font-semibold ${v >= 0 ? "text-green-600" : "text-red-600"
                                                    }`}
                                            >
                                                ₹{v.toLocaleString()}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function SummaryCard({
    title,
    value,
    highlight,
}: {
    title: string;
    value: number;
    highlight?: "red" | "green";
}) {
    return (
        <Card
            className={`shadow-md border ${highlight === "green"
                ? "border-green-400"
                : highlight === "red"
                    ? "border-red-400"
                    : ""
                }`}
        >
            <CardHeader>
                <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-2xl font-bold">
                    ₹{value.toLocaleString()}
                </p>
            </CardContent>
        </Card>
    );
}
