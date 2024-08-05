import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(req, { params }) {
    const { id } = params;
    let payload = await req.json();

    console.log('Received payload:', payload);

    // Destructure the payload
    const {
        loanName,
        loanAmount,
        annualInterestRate,
        emiAmount,
        currentBalance,
        monthsLeft,
        loanStartDate
    } = payload;

    // Check for required fields
    if (!loanName || !loanAmount || !annualInterestRate) {
        return NextResponse.json({ result: 'Required field not found' }, { status: 400 });
    }

    // Update the existing loan entry
    try {
        const loan = await prisma.loan.update({
            where: { id: parseInt(id) },
            data: {
                loanName,
                loanAmount: parseFloat(loanAmount),
                annualInterestRate: parseFloat(annualInterestRate),
                emiAmount: parseFloat(emiAmount),
                // currentBalance: parseFloat(currentBalance),
                // monthsLeft: parseInt(monthsLeft, 10),
                loanStartDate: new Date(loanStartDate),
            },
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

    // Delete the loan entry
    try {
        await prisma.loan.delete({
            where: { id: parseInt(id) },
        });

        return NextResponse.json({ result: 'Loan deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error('Error deleting loan:', error);
        return NextResponse.json({ result: 'Loan not found or delete failed' }, { status: 404 });
    }
}

