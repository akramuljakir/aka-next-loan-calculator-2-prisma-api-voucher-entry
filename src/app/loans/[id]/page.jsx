'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import calculateAmortization from '@/lib/calculateAmortization';

const Page = () => {
    const { id } = useParams();
    const [monthlyBudget, setMonthlyBudget] = useState(0);
    const [loans, setLoans] = useState([]);
    const [finalData, setFinalData] = useState([]);
    const [selectedLoan, setSelectedLoan] = useState('');

    // Placeholder values for current loan details
    const [loan, setLoan] = useState({
        loanAmount: 0,
        annualInterestRate: 0,
        emiAmount: 0,
        loanStartDate: '',
    });

    const [loanEndMonth, setLoanEndMonth] = useState('');
    const [totalInterestPaid, setTotalInterestPaid] = useState(0);
    const [currentDate] = useState(new Date());
    const [currentBalance, setCurrentBalance] = useState(0);
    const [totalCapital, setTotalCapital] = useState(0);
    const [totalEmiPaid, setTotalEmiPaid] = useState(0);
    const [monthsLeft, setMonthsLeft] = useState(null);

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
            setLoans(result.data);
        };

        if (monthlyBudget !== 0) {
            fetchLoans();
        }
    }, [monthlyBudget]);

    useEffect(() => {
        const schedule = calculateAmortization(loans, monthlyBudget);
        let remainingBalance = 0;

        const finalData = schedule.map(item => {
            let principal = parseFloat(item.principalPart);
            remainingBalance -= principal;

            return {
                ...item,
                remainingBalance: remainingBalance.toFixed(2)
            };
        });

        setFinalData(finalData);
    }, [monthlyBudget, loans]);

    useEffect(() => {
        if (id && loans.length > 0) {
            const loan = loans.find((loanItem) => loanItem.id === parseInt(id));
            if (loan) {
                setSelectedLoan(loan.loanName);
                setLoan(loan);
                setLoanEndMonth(calculateLoanEndMonth(loan));
                setTotalInterestPaid(calculateTotalInterest(loan));
                setCurrentBalance(calculateCurrentBalance(loan));
                setTotalCapital(calculateTotalCapital(loan));
                setTotalEmiPaid(calculateTotalEmiPaid(loan));
                setMonthsLeft(calculateMonthsLeft(loan));
            }
        }
    }, [loans, id]);

    const filteredData = selectedLoan
        ? finalData.filter(item => item.id.toString() === selectedLoan)
        : finalData;

    const getMonthClass = (date) => {
        const currentDate = new Date();
        const entryDate = new Date(date);
        const month = entryDate.getMonth();
        const year = entryDate.getFullYear();

        const colors = [
            'bg-red-200', 'bg-cyan-200',
            'bg-orange-200', 'bg-blue-200',
            'bg-yellow-200', 'bg-purple-200',
            'bg-green-200', 'bg-pink-200',
            'bg-sky-200', 'bg-rose-200',
            'bg-indigo-200', 'bg-lime-200'
        ];
        let classNames = colors[month % colors.length];

        if (month === currentDate.getMonth() && year === currentDate.getFullYear()) {
            classNames += ' font-black';
        }

        return classNames;
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = date.toLocaleString('en-US', { month: 'short' });
        const year = date.getFullYear().toString().slice(-2);
        return `${day}-${month}-${year}`;
    };

    // Helper function to calculate the loan end date
    const calculateLoanEndMonth = (loan) => {
        const totalMonths = Math.ceil(loan.loanAmount / loan.emiAmount);
        const loanStartDate = new Date(loan.loanStartDate);
        loanStartDate.setMonth(loanStartDate.getMonth() + totalMonths);
        return loanStartDate.toLocaleDateString('default', { month: 'long', year: 'numeric' });
    };

    // Helper function to calculate the total interest paid
    const calculateTotalInterest = (loan) => {
        const interestRate = loan.annualInterestRate / 100;
        const totalInterest = loan.loanAmount * interestRate;
        return totalInterest.toFixed(2);
    };

    // Helper function to calculate the current balance
    const calculateCurrentBalance = (loan) => {
        const totalPaid = totalCapital;  // Assuming totalCapital tracks total paid so far
        return (loan.loanAmount - totalPaid).toFixed(2);
    };

    // Helper function to calculate the total capital paid
    const calculateTotalCapital = (loan) => {
        const emi = loan.emiAmount;
        const totalPaidMonths = Math.floor((currentDate - new Date(loan.loanStartDate)) / (1000 * 60 * 60 * 24 * 30));
        const totalCapitalPaid = emi * totalPaidMonths;
        return totalCapitalPaid.toFixed(2);
    };

    // Helper function to calculate total EMI paid so far
    const calculateTotalEmiPaid = (loan) => {
        const totalPaidMonths = Math.floor((currentDate - new Date(loan.loanStartDate)) / (1000 * 60 * 60 * 24 * 30));
        return (loan.emiAmount * totalPaidMonths).toFixed(2);
    };

    // Helper function to calculate months left
    const calculateMonthsLeft = (loan) => {
        const totalMonths = Math.ceil(loan.loanAmount / loan.emiAmount);
        const monthsPassed = Math.floor((currentDate - new Date(loan.loanStartDate)) / (1000 * 60 * 60 * 24 * 30));
        return totalMonths - monthsPassed;
    };

    return (
        <div className="container mx-auto p-4">
            <div className="mb-4">
                <label htmlFor="loanFilter" className="block text-sm font-medium text-gray-700">
                    Filter by Loan Name:
                </label>
                <select
                    id="loanFilter"
                    className="mt-1 block w-full p-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={selectedLoan}
                    onChange={(e) => setSelectedLoan(e.target.value)}
                >
                    <option value="">All Loans</option>
                    {loans.map((loanItem, index) => (
                        <option key={index} value={loanItem.id}>
                            {loanItem.loanName}
                        </option>
                    ))}
                </select>
            </div>

            <h1 className="text-2xl font-bold mb-4">All Loans Amortization Schedule</h1>

            {/* New sections */}
            <div className="grid grid-cols-3 gap-4 bg-white p-4 rounded-lg shadow-md border">
                <div>
                    <h2 className="text-xl font-semibold mb-2">Sanctioned Loan Details</h2>
                    <p><strong>Loan Amount:</strong> {loan.loanAmount}</p>
                    <p><strong>Interest Rate:</strong> {loan.annualInterestRate}%</p>
                    <p><strong>EMI Amount:</strong> {loan.emiAmount}</p>
                    <p><strong>Total EMI Number:</strong> {Math.ceil(loan.loanAmount / loan.emiAmount)}</p>
                    <p><strong>Loan Start Date:</strong> {new Date(loan.loanStartDate).toLocaleDateString('default', { month: 'long', year: 'numeric' })}</p>
                    <p><strong>Loan End Date:</strong> {loanEndMonth}</p>
                    <p><strong>Total Payment:</strong> {(parseFloat(loan.loanAmount) + parseFloat(totalInterestPaid)).toFixed(2)}</p>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-2">Current Details</h2>
                    <p><strong>Current Date:</strong> {currentDate.toLocaleDateString('default', { month: 'long', year: 'numeric' })}</p>
                    <p><strong>Current Balance:</strong> {currentBalance || 'Calculating...'}</p>
                    <p><strong>Total Capital Paid:</strong> {totalCapital}</p>
                    <p><strong>Total Interest Paid:</strong> {totalInterestPaid}</p>
                    <p><strong>Total Amount Paid:</strong> {totalEmiPaid}</p>
                    <p><strong>Months Left:</strong> {monthsLeft !== null ? monthsLeft : 'Calculating...'}</p>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-2">Estimated Closing Details</h2>
                    <p><strong>Loan End Date:</strong> {loanEndMonth}</p>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                    <thead>
                        <tr>
                            <th className="px-4 py-2 border-b">Sl No</th>
                            <th className="px-4 py-2 border-b">Date</th>
                            <th className="px-4 py-2 border-b">Loan Name</th>
                            <th className="px-4 py-2 border-b">Minimum Pay</th>
                            <th className="px-4 py-2 border-b">Interest</th>
                            <th className="px-4 py-2 border-b">Snow Ball</th>
                            <th className="px-4 py-2 border-b">Principal</th>
                            <th className="px-4 py-2 border-b">Loan Balance</th>
                            <th className="px-4 py-2 border-b">Remaining Loans</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.map((payment, index) => (
                            <tr key={index} className={`${getMonthClass(payment.date)}`}>
                                <td className="px-4 py-2 border-b">{index + 1}</td>
                                <td className="px-4 py-2 border-b">{formatDate(payment.date)}</td>
                                <td className="px-4 py-2 border-b">{payment.loanName}</td>
                                <td className="px-4 py-2 border-b">{payment.minimumPay}</td>
                                <td className="px-4 py-2 border-b">{payment.interestPart}</td>
                                <td className="px-4 py-2 border-b">{payment.snowBall}</td>
                                <td className="px-4 py-2 border-b">{payment.principalPart}</td>
                                <td className="px-4 py-2 border-b">{payment.balance}</td>
                                <td className="px-4 py-2 border-b">{(Number(payment.remainingBalance) < 0 ? 0 : payment.remainingBalance)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Page;
