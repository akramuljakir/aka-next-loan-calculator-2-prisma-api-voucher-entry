import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req, { params }) {
    const { id } = params;
    try {
        const data = await prisma.loan.findUnique({
            where: { id: Number(id) }
        });
        return NextResponse.json({ data }, { status: 200 });
    } catch (error) {
        console.error('Error fetching loan:', error);
        return NextResponse.json({ result: 'Loan not found' }, { status: 404 });
    }
}

export async function PUT(req, { params }) {
    const { id } = params;
    let payload = await req.json();

    console.log('Received payload:', payload);
    console.log('Updating loan with ID:', id);

    // Ensure the id is valid and parseable
    const loanId = parseInt(id);
    if (isNaN(loanId)) {
        return NextResponse.json({ result: 'Invalid loan ID' }, { status: 400 });
    }

    // Check if the record exists before updating
    const existingLoan = await prisma.loan.findUnique({
        where: { id: loanId }
    });

    if (!existingLoan) {
        return NextResponse.json({ result: 'Record to update not found' }, { status: 404 });
    }

    // Prepare the data to update, only include fields that are provided
    const updateData = {};
    if (payload.loanName !== undefined) updateData.loanName = payload.loanName;
    if (payload.loanAmount !== undefined) updateData.loanAmount = parseFloat(payload.loanAmount);
    if (payload.annualInterestRate !== undefined) updateData.annualInterestRate = parseFloat(payload.annualInterestRate);
    if (payload.emiAmount !== undefined) updateData.emiAmount = parseFloat(payload.emiAmount);
    if (payload.loanStartDate !== undefined) updateData.loanStartDate = new Date(payload.loanStartDate);
    if (payload.priority !== undefined) updateData.priority = parseInt(payload.priority);
    if (payload.minimumPay !== undefined) updateData.minimumPay = parseFloat(payload.minimumPay);

    try {
        const loan = await prisma.loan.update({
            where: { id: loanId },
            data: updateData,
        });

        return NextResponse.json({ result: loan }, { status: 200 });
    } catch (error) {
        console.error('Error updating loan:', error);
        return NextResponse.json({ result: 'Loan not found or update failed' }, { status: 404 });
    }
}

export async function DELETE(req, { params }) {
    const { id } = params;

    console.log('Deleting loan with id:', id);

    // Ensure the id is valid and parseable
    const loanId = parseInt(id);
    if (isNaN(loanId)) {
        return NextResponse.json({ result: 'Invalid loan ID' }, { status: 400 });
    }

    try {
        await prisma.loan.delete({
            where: { id: loanId },
        });

        return NextResponse.json({ result: 'Loan deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error('Error deleting loan:', error);
        return NextResponse.json({ result: 'Loan not found or delete failed' }, { status: 404 });
    }
}
