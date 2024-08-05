//src/app/api/loans/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


export async function GET(req) {
    const data = await prisma.loan.findMany()
    return NextResponse.json({ data }, { status: 200 })// alternate way, NextResponse pass Array 
}


export async function POST(req) {
    let payload = await req.json();
    console.log(payload);

    // Destructure the payload
    const {
        loanName,
        loanAmount,
        annualInterestRate,
        emiAmount,
        loanStartDate,
        priority,
        minimumPay
    } = payload;

    // Check for required fields
    if (!loanName || !loanAmount || !annualInterestRate) {
        return NextResponse.json({ result: "Required field not found" }, { status: 400 });
    }

    // Create a new loan entry
    const data = {
        loanName,
        loanAmount: parseFloat(loanAmount),
        annualInterestRate: parseFloat(annualInterestRate),
        loanStartDate: new Date(loanStartDate),
    };

    // Add optional fields if they are truthy
    if (emiAmount) data.emiAmount = parseFloat(emiAmount);
    if (priority) data.priority = parseInt(priority);
    if (minimumPay) data.minimumPay = parseFloat(minimumPay);

    const loan = await prisma.loan.create({
        data
    });

    return NextResponse.json({ result: loan }, { status: 200 });
}