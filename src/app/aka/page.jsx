'use client'

import React, { useEffect, useState } from 'react';

const Page = () => {

    const [monthlyBudget, setMonthlyBudget] = useState(0);
    const [loan, setLoan] = useState([]);

    useEffect(() => {
        const savedBudget = localStorage.getItem('monthlyBudget');
        if (savedBudget) {
            setMonthlyBudget(parseFloat(savedBudget));
        }
    }, []);

    useEffect(() => {
        const fetchLoans = async () => {
            const response = await fetch('/api/loans');
            const result = await response.json();
            setLoan(result.data);
        }

        if (monthlyBudget !== 0) {
            fetchLoans();
        }

    }, [monthlyBudget]);

    const calculateAmortization = (loans, budget) => {
        if (!loans.length) {
            return []; // Return an empty array if loans array is empty
        }

        const schedule = [];
        let transactionDate = new Date(loans[0].loanStartDate);
        let remainingBudget = budget;
        let remainingBalance = loans.reduce((acc, loan) => acc + loan.loanAmount, 0);

        // Sort loans by interest rate in descending order (highest interest rate first)
        loans.sort((a, b) => parseFloat(b.annualInterestRate) - parseFloat(a.annualInterestRate));

        // Function to calculate the monthly interest for a loan
        const calculateMonthlyInterest = (loan) => {
            const monthlyInterestRate = parseFloat(loan.annualInterestRate) / 12 / 100;
            return loan.loanAmount * monthlyInterestRate;
        };

        // Monthly payment loop
        while (remainingBalance > 0 && remainingBudget > 0) {
            let totalMonthlyPayment = 0;

            // Step 1: Pay the minimum EMI for each loan
            loans.forEach((loan) => {
                // const principal = Math.min(minimumPay - interest, remainingBudget);
                const interest = calculateMonthlyInterest(loan);
                const minimumPay = parseFloat(loan.minimumPay);
                let principal = 0
                // if (loan.loanAmount + (loan.loanAmount * loan.annualInterestRate) > 0) {
                if (loan.loanAmount + (loan.loanAmount * loan.annualInterestRate) >= minimumPay) {
                    // const interest = calculateMonthlyInterest(loan);
                    // const minimumPay = parseFloat(loan.minimumPay);
                    principal = Math.min(minimumPay - interest, remainingBudget);
                    // const principal = (minimumPay - interest);

                    loan.loanAmount -= principal;
                    // remainingBudget -= (principal + interest);
                    remainingBudget -= minimumPay;
                    remainingBalance -= principal;
                    totalMonthlyPayment += (principal + interest);

                    schedule.push({
                        date: transactionDate.toISOString().split('T')[0],
                        principalPart: principal.toFixed(2),
                        interestPart: interest.toFixed(2),
                        emiToPay: (principal + interest).toFixed(2),
                        balance: loan.loanAmount.toFixed(2),
                        loanName: loan.loanName,
                        totalMonthlyPayment: totalMonthlyPayment.toFixed(2),
                        remainingBalance: remainingBalance.toFixed(2),
                        remainingBudget: remainingBudget.toFixed(2),

                    });



                } else if (loan.loanAmount + (loan.loanAmount * loan.annualInterestRate) < minimumPay) {

                    // const interest = calculateMonthlyInterest(loan);
                    // const minimumPay = parseFloat(loan.minimumPay);
                    principal = Math.min(minimumPay - interest, remainingBudget);
                    // const principal = (minimumPay - interest);

                    loan.loanAmount -= principal;
                    remainingBudget -= (principal + interest);
                    // remainingBudget -= minimumPay;
                    remainingBalance -= principal;
                    totalMonthlyPayment += (principal + interest);

                    schedule.push({
                        date: transactionDate.toISOString().split('T')[0],
                        principalPart: principal.toFixed(2),
                        interestPart: interest.toFixed(2),
                        emiToPay: (principal + interest).toFixed(2),
                        balance: loan.loanAmount.toFixed(2),
                        loanName: loan.loanName,
                        totalMonthlyPayment: totalMonthlyPayment.toFixed(2),
                        remainingBalance: remainingBalance.toFixed(2),
                        remainingBudget: remainingBudget.toFixed(2),

                    });





                }
                // }
            });

            // Step 2: If budget remains, allocate to the highest interest loan
            if (remainingBudget > 0) {
                for (const loan of loans) {
                    if (loan.loanAmount > 0 && remainingBudget > 0) {
                        const extraPayment = Math.min(remainingBudget, loan.loanAmount);

                        loan.loanAmount -= extraPayment;
                        remainingBudget -= extraPayment;
                        remainingBalance -= extraPayment;

                        schedule.push({
                            date: transactionDate.toISOString().split('T')[0],
                            principalPart: extraPayment.toFixed(2),
                            interestPart: '0.00',
                            emiToPay: extraPayment.toFixed(2),
                            balance: loan.loanAmount.toFixed(2),
                            loanName: loan.loanName,
                            totalMonthlyPayment: totalMonthlyPayment.toFixed(2),
                            remainingBalance: remainingBalance.toFixed(2),
                            remainingBudget: remainingBudget.toFixed(2),

                        });

                        break; // Exit the loop once the extra payment has been made
                    }
                }
            }

            // Update the transaction date for the next month
            transactionDate.setMonth(transactionDate.getMonth() + 1);

            // Reset remaining budget for the next month
            remainingBudget = budget;



            // If no payments could be made, break the loop to avoid infinite looping
            if (totalMonthlyPayment === 0) {
                break;
            }
        }

        return schedule;
    };

    const schedule = calculateAmortization(loan, monthlyBudget);

    console.table(schedule);


    const filteredSchedule = schedule.filter(item => item.loanName === 'home loan');
    console.table(filteredSchedule);

    const filteredSchedule1 = schedule.filter(item => item.loanName === 'car loan');
    console.table(filteredSchedule1);

    // loan.forEach((schedule) => {
    //     if (schedule.loanName === 'home loan') {
    //         console.table(schedule);
    //     }
    // });

    return (
        <div>
            <h2>Monthly Budget: {monthlyBudget}</h2>
        </div>
    );
}

export default Page;
