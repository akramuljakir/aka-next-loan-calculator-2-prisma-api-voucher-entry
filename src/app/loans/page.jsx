'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const LoansPage = () => {
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLoans = async () => {
            try {
                const response = await fetch('/api/loans');
                if (!response.ok) {
                    throw new Error('Failed to fetch loans');
                }
                const data = await response.json();
                setLoans(data.data);
                console.log(data.data);
            } catch (error) {
                console.error('Error fetching loans:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchLoans();
    }, []);

    // if (loading) {
    //     return <div>Loading...</div>;
    // }

    return (
        <>
            <h1 className="text-2xl font-bold mb-4 mx-10">All Loans</h1>
            <div className="w-full">
                <table className="min-w-full bg-white border border-gray-200">
                    <thead>
                        <tr>
                            <th className="px-4 py-2 border-b">Loan Name</th>
                            <th className="px-4 py-2 border-b">Loan Amount</th>
                            <th className="px-4 py-2 border-b">Interest Rate</th>
                            <th className="px-4 py-2 border-b">EMI Amount</th>
                            <th className="px-4 py-2 border-b">Start Date</th>
                            <th className="px-4 py-2 border-b">Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loans.map((loan, index) => (
                            <tr key={index}>
                                <td className="px-4 py-2 border-b">{loan.loanName}</td>
                                <td className="px-4 py-2 border-b">{loan.loanAmount}</td>
                                <td className="px-4 py-2 border-b">{loan.annualInterestRate}%</td>
                                <td className="px-4 py-2 border-b">{loan.emiAmount}</td>
                                <td className="px-4 py-2 border-b">{loan.loanStartDate.split('T')[0]}</td>
                                <td className="px-4 py-2 border-b">
                                    <Link href={`/loans/${loan.id}`} className="text-blue-500 hover:underline">
                                        View Details
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
};

export default LoansPage;
