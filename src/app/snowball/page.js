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


    const handleBudgetChange = (e) => {
        const value = parseFloat(e.target.value);
        setMonthlyBudget(value);
        localStorage.setItem('monthlyBudget', value);//new code

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



    const calculateMonthlyInterest = (annualInterestRate, loanAmount) => {
        const monthlyInterestRate = parseFloat(annualInterestRate) / 12 / 100;
        return parseFloat(loanAmount) * monthlyInterestRate;
    };

    // const handleSort = (key) => {
    //     let direction = 'ascending';
    //     if (sortConfig.key === key && sortConfig.direction === 'ascending') {
    //         direction = 'descending';
    //     }
    //     setSortConfig({ key, direction });
    // };



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
                    return a.loanAmount - b.loanAmount; // Finally by lowest loan amount
                }
            case '3a': // Avalanche (Highest Interest First)
                return b.annualInterestRate - a.annualInterestRate; // Higher interest rate first
            case '4s': // Snowball (Lowest Balance First)
                return a.loanAmount - b.loanAmount; // Lower loan amount first
            case '5h': // Highest Priority First
                return a.priority - b.priority; // Higher priority first
            case '6l': // Lowest Priority First
                return b.priority - a.priority; // Lower priority first
            default: // Default (Recommended)
                // Handle the default sort using the sortConfig
                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
        }
    });


    return (
        <>
            <div className="w-full max-w-full overflow-x-auto">
                <div className="flex justify-between px-12">
                    <h2 className="text-2xl font-bold mb-4">Snowball</h2>
                    <div className="mb-4">
                        <label htmlFor="budget" className="mr-2 pl-8">Monthly Budget:</label>
                        <input
                            id="budget"
                            type="number"
                            value={monthlyBudget}
                            onChange={handleBudgetChange}
                            className="border border-gray-300 p-2 rounded"
                        />
                        {budgetError && <p className={`${budgetErrorClass} mt-0 absolute `}>{budgetError}</p>}
                    </div>


                    <div className="mb-4 content-center">

                        <label htmlFor="strategy" className="mr-2 pl-8">Strategy:</label>
                        <select
                            id="strategy"
                            value={strategy}
                            onChange={handleStrategyChange}
                            className="border border-gray-300 p-2 rounded">
                            <option value="1n">No Strategy (Not Recommended) </option>
                            <option value="2s">Smart ( Priority + Avalanche + Snowball)</option>
                            <option value="3a">Avalanche (Highest Interest First)</option>
                            <option value="4s">Snowball (Lowest Balance First)</option>
                            <option value="5h">Highest Priority First </option>
                            <option value="6l">Lowest Priority First </option>
                        </select>
                        <p className='text-center ml-20'>Lower numbers indicate higher priority</p>
                    </div>
                </div>
                <div>
                    <table >

                    </table>
                </div>
            </div>

            {isModalOpen && (
                <LoanForm
                    loan={currentLoan}
                    onSave={saveLoan}
                    onClose={closeModal}
                />
            )}
        </>
    );
}

export default Home;
