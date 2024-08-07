// src/app/page.js
"use client";

import { useState, useEffect } from 'react';
import LoanForm from '@/components/LoanForm';
import Link from 'next/link';
import { FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';

const Home = () => {
    const [loans, setLoans] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentLoan, setCurrentLoan] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'ascending' });
    const [strategy, setStrategy] = useState('2s'); // Default strategy
    const [totalMonthlyInterest, setTotalMonthlyInterest] = useState(0);
    const [totalMinimumMonthlyPay, setTotalMinimumMonthlyPay] = useState(0);
    const [totalEMI, setTotalEMI] = useState(0);
    const [monthlyBudget, setMonthlyBudget] = useState(0);
    const [budgetError, setBudgetError] = useState('');
    const [budgetErrorClass, setBudgetErrorClass] = useState('');

    useEffect(() => {
        const totalInterest = loans.reduce((sum, loan) => sum + calculateMonthlyInterest(loan.annualInterestRate, loan.loanAmount), 0);
        const totalMinPay = loans.reduce((sum, loan) => sum + loan.minimumPay, 0);
        const totalEmi = loans.reduce((sum, loan) => sum + loan.emiAmount, 0);

        setTotalMonthlyInterest(totalInterest);
        setTotalMinimumMonthlyPay(totalMinPay);
        setTotalEMI(totalEmi);
    }, [loans]);

    const handleBudgetChange = (e) => {
        const value = parseFloat(e.target.value);
        setMonthlyBudget(value);
        localStorage.setItem('monthlyBudget', value);

        if (value < totalMonthlyInterest) {
            setBudgetError('⚠️ Insufficient Budget: Your budget is less than the total monthly interest. Please increase your budget to cover the interest.');
            setBudgetErrorClass('text-red-700 text-xl font-bold');
        } else if (value >= totalMonthlyInterest && value < totalMinimumMonthlyPay) {
            setBudgetError('⚠️ Warning: Your budget is between the total monthly interest and the minimum payment. Aim to budget above the minimum payment for a healthier financial situation.');
            setBudgetErrorClass('text-yellow-700 text-xl font-bold');
        } else if (value >= totalMinimumMonthlyPay && value < totalEMI) {
            setBudgetError('⚠️ Caution: Your budget is below the total EMI amount. Consider increasing your budget to avoid tight financial situations.');
            setBudgetErrorClass('text-yellow-700 text-xl font-semibold');
        } else if (value === totalEMI) {
            setBudgetError('✅ Great! Your budget matches the total EMI amount perfectly. Keep it up!');
            setBudgetErrorClass('text-green-600 text-xl font-bold');
        } else if (value > totalEMI) {
            setBudgetError('🎉 Excellent! Your budget exceeds the total EMI amount. You’re in a good position.');
            setBudgetErrorClass('text-green-600 text-xl font-bold');
        } else {
            setBudgetError('');
            setBudgetErrorClass('');
        }
    }

    const handleStrategyChange = (e) => {
        setStrategy(e.target.value);
        localStorage.setItem('strategy', e.target.value);
    };

    useEffect(() => {
        const fetchLoans = async () => {
            try {
                const response = await fetch('/api/loans');
                const result = await response.json();
                setLoans(result.data);
            } catch (error) {
                console.error('Error fetching loans:', error);
            }
        };

        fetchLoans();

        // Load monthlyBudget and strategy from localStorage
        const savedBudget = localStorage.getItem('monthlyBudget');
        const savedStrategy = localStorage.getItem('strategy');
        if (savedBudget) {
            setMonthlyBudget(parseFloat(savedBudget));
        }
        if (savedStrategy) {
            setStrategy(savedStrategy);
        }
    }, []);

    const openModal = (loan = null) => {
        setCurrentLoan(loan);
        setIsEditing(!!loan);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentLoan(null);
        setIsEditing(false);
    };

    const saveLoan = async (loan) => {
        try {
            const method = isEditing ? 'PUT' : 'POST';
            const url = isEditing ? `/api/loans/${currentLoan.id}` : '/api/loans';
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(loan),
            });

            const result = await response.json();
            if (response.ok) {
                const updatedLoans = isEditing
                    ? loans.map((item) => (item.id === currentLoan.id ? result.result : item))
                    : [...loans, result.result];
                setLoans(updatedLoans);
                closeModal();
            } else {
                console.error('Error saving loan:', result);
            }
        } catch (error) {
            console.error('Error saving loan:', error);
        }
    };

    const deleteLoan = async (id) => {
        try {
            await fetch(`/api/loans/${id}`, {
                method: 'DELETE',
            });
            setLoans(loans.filter((loan) => loan.id !== id));
        } catch (error) {
            console.error('Error deleting loan:', error);
        }
    };

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    const calculateMonthlyInterest = (annualInterestRate, loanAmount) => {
        const monthlyInterestRate = parseFloat(annualInterestRate) / 12 / 100;
        return parseFloat(loanAmount) * monthlyInterestRate;
    };

    const handleSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const handlePriorityChange = async (id, newPriority) => {
        try {
            const response = await fetch(`/api/loans/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ priority: Number(newPriority) }),
            });

            if (!response.ok) {
                throw new Error('Failed to update priority');
            }

            const result = await response.json();
            setLoans(loans.map((loan) => (loan.id === id ? { ...loan, priority: newPriority } : loan)));
        } catch (error) {
            console.error('Error updating priority:', error);
        }
    };

    const handleMinimumPayChange = async (id, newMinimumPay) => {
        try {
            const response = await fetch(`/api/loans/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ minimumPay: Number(newMinimumPay) }),
            });

            if (!response.ok) {
                throw new Error('Failed to update minimum pay');
            }

            const result = await response.json();
            setLoans(loans.map((loan) => (loan.id === id ? { ...loan, minimumPay: newMinimumPay } : loan)));
        } catch (error) {
            console.error('Error updating minimum pay:', error);
        }
    };

    const getSortableValue = (loan, key) => {
        switch (key) {
            case 'monthlyInterest':
                return calculateMonthlyInterest(loan.annualInterestRate, loan.loanAmount);
            default:
                return loan[key];
        }
    };

    const sortedLoans = [...loans].sort((a, b) => {
        let aValue = getSortableValue(a, sortConfig.key);
        let bValue = getSortableValue(b, sortConfig.key);

        // Strategy-based sorting logic
        switch (strategy) {
            case '2s': // Smart (Priority + Avalanche + Snowball)
                if (a.priority !== b.priority) {
                    return a.priority - b.priority; // Sort by priority first
                } else if (a.annualInterestRate !== b.annualInterestRate) {
                    return b.annualInterestRate - a.annualInterestRate; // Then by highest interest rate
                } else {
                    return a.loanAmount - b.loanAmount; // Finally by loan amount
                }
            case '3a': // Avalanche (Highest Interest First)
                return b.annualInterestRate - a.annualInterestRate;
            case '4s': // Snowball (Lowest Balance First)
                return a.loanAmount - b.loanAmount;
            case '5h': // Highest Priority First
                return a.priority - b.priority;
            case '6l': // Lowest Priority First
                return b.priority - a.priority;
            default:
                return sortConfig.direction === 'ascending' ? aValue - bValue : bValue - aValue;
        }
    });

    return (
        <div className="container mx-auto p-4">
            <div className="mb-4 flex items-center">
                <label htmlFor="budget" className="mr-2">Monthly Budget:</label>
                <input
                    id="budget"
                    type="number"
                    value={monthlyBudget}
                    onChange={handleBudgetChange}
                    className={`border p-2 rounded ${budgetErrorClass}`}
                />
                {budgetError && <p className={`mt-2 ${budgetErrorClass}`}>{budgetError}</p>}
            </div>
            <div className="mb-4 flex items-center">
                <label htmlFor="strategy" className="mr-2">Strategy:</label>
                <select
                    id="strategy"
                    value={strategy}
                    onChange={handleStrategyChange}
                    className="border p-2 rounded"
                >
                    <option value="2s">Smart (Priority + Avalanche + Snowball)</option>
                    <option value="3a">Avalanche (Highest Interest First)</option>
                    <option value="4s">Snowball (Lowest Balance First)</option>
                    <option value="5h">Highest Priority First</option>
                    <option value="6l">Lowest Priority First</option>
                </select>
            </div>
            <table className="w-full border-collapse border border-gray-300">
                <thead>
                    <tr>
                        <th className="border border-gray-300 p-2 cursor-pointer" onClick={() => handleSort('priority')}>
                            Priority
                            {sortConfig.key === 'priority' ? (
                                sortConfig.direction === 'ascending' ? <FaSortUp /> : <FaSortDown />
                            ) : (
                                <FaSort />
                            )}
                        </th>
                        <th className="border border-gray-300 p-2 cursor-pointer" onClick={() => handleSort('annualInterestRate')}>
                            Annual Interest Rate
                            {sortConfig.key === 'annualInterestRate' ? (
                                sortConfig.direction === 'ascending' ? <FaSortUp /> : <FaSortDown />
                            ) : (
                                <FaSort />
                            )}
                        </th>
                        <th className="border border-gray-300 p-2 cursor-pointer" onClick={() => handleSort('loanAmount')}>
                            Loan Amount
                            {sortConfig.key === 'loanAmount' ? (
                                sortConfig.direction === 'ascending' ? <FaSortUp /> : <FaSortDown />
                            ) : (
                                <FaSort />
                            )}
                        </th>
                        <th className="border border-gray-300 p-2 cursor-pointer" onClick={() => handleSort('emiAmount')}>
                            EMI Amount
                            {sortConfig.key === 'emiAmount' ? (
                                sortConfig.direction === 'ascending' ? <FaSortUp /> : <FaSortDown />
                            ) : (
                                <FaSort />
                            )}
                        </th>
                        <th className="border border-gray-300 p-2 cursor-pointer" onClick={() => handleSort('minimumPay')}>
                            Minimum Pay
                            {sortConfig.key === 'minimumPay' ? (
                                sortConfig.direction === 'ascending' ? <FaSortUp /> : <FaSortDown />
                            ) : (
                                <FaSort />
                            )}
                        </th>
                        <th className="border border-gray-300 p-2">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedLoans.length ? sortedLoans.map((loan) => (
                        <tr key={loan.id}>
                            <td className="border border-gray-300 p-2">{loan.priority}</td>
                            <td className="border border-gray-300 p-2">{loan.annualInterestRate}%</td>
                            <td className="border border-gray-300 p-2">{loan.loanAmount.toFixed(2)}</td>
                            <td className="border border-gray-300 p-2">{loan.emiAmount.toFixed(2)}</td>
                            <td className="border border-gray-300 p-2">{loan.minimumPay.toFixed(2)}</td>
                            <td className="border border-gray-300 p-2">
                                <button onClick={() => openModal(loan)}>Edit</button>
                                <button onClick={() => deleteLoan(loan.id)} className="ml-2 text-red-500">Delete</button>
                            </td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan="6" className="border border-gray-300 p-2 text-center">No loans available</td>
                        </tr>
                    )}
                </tbody>
                <tfoot>
                    <tr>
                        <td className="border border-gray-300 p-2 font-bold" colSpan="2">Total</td>
                        <td className="border border-gray-300 p-2 font-bold">{totalEMI.toFixed(2)}</td>
                        <td className="border border-gray-300 p-2 font-bold">{totalMinimumMonthlyPay.toFixed(2)}</td>
                        <td className="border border-gray-300 p-2 font-bold">{totalMonthlyInterest.toFixed(2)}</td>
                        <td className="border border-gray-300 p-2"></td>
                    </tr>
                </tfoot>
            </table>

            {isModalOpen && (
                <LoanForm
                    loan={currentLoan}
                    isEditing={isEditing}
                    onSave={saveLoan}
                    onClose={closeModal}
                />
            )}
        </div>
    );
};

export default Home;
