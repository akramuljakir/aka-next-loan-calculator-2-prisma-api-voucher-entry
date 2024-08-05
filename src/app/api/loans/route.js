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
        priority
    } = payload;

    // Check for required fields
    if (!loanName || !loanAmount || !annualInterestRate) {
        return NextResponse.json({ result: "Required field not found" }, { status: 400 });
    }

    // Create a new loan entry
    const loan = await prisma.loan.create({
        data: {
            loanName,
            loanAmount: parseFloat(loanAmount),
            annualInterestRate: parseFloat(annualInterestRate),
            emiAmount: parseFloat(emiAmount),
            loanStartDate: new Date(loanStartDate),
            priority: parseInt(priority),
        }
    });

    return NextResponse.json({ result: loan }, { status: 200 });
}