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
  const [strategy, setStrategy] = useState('Order Entered In Table'); // Default strategy

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
          <h2 className="text-2xl font-bold mb-4">Loan List</h2>

          <div className="mb-4">
            <button
              onClick={() => openModal()}
              className="bg-blue-500 text-white px-4 py-2 rounded-md mb-4"
            >
              Add Loan
            </button>
            <label htmlFor="strategy" className="mr-2 pl-8">Strategy:</label>
            <select
              id="strategy"
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              className="border border-gray-300 p-2 rounded">
              <option value="1n">No Strategy (Not Recommended) </option>
              <option value="2s">Smart ( Priority + Avalanche + Snowball)</option>
              <option value="3a">Avalanche (Highest Interest First)</option>
              <option value="4s">Snowball (Lowest Balance First)</option>
              <option value="5h">Highest Priority First </option>
              <option value="6l">Lowest Priority First </option>
            </select>
          </div>
        </div>
        <div>
          <table className="min-w-full bg-white border text-sm break-normal">
            <thead>
              <tr>
                <th className="border px-4 py-2 w-16">#</th> {/* Serial Number Column */}
                <th className="border px-4 py-2 w-56 cursor-pointer" onClick={() => handleSort('loanName')}>
                  Loan Name
                  {sortConfig.key === 'loanName' ? (
                    sortConfig.direction === 'ascending' ? <FaSortUp className="inline ml-2" /> : <FaSortDown className="inline ml-2" />
                  ) : <FaSort className="inline ml-2" />}
                </th>
                <th className="border px-4 py-2 w-30 cursor-pointer" onClick={() => handleSort('loanAmount')}>
                  Loan Amount
                  {sortConfig.key === 'loanAmount' ? (
                    sortConfig.direction === 'ascending' ? <FaSortUp className="inline ml-2" /> : <FaSortDown className="inline ml-2" />
                  ) : <FaSort className="inline ml-2" />}
                </th>
                <th className="border px-4 py-2 cursor-pointer" onClick={() => handleSort('annualInterestRate')}>
                  Interest Rate
                  {sortConfig.key === 'annualInterestRate' ? (
                    sortConfig.direction === 'ascending' ? <FaSortUp className="inline ml-2" /> : <FaSortDown className="inline ml-2" />
                  ) : <FaSort className="inline ml-2" />}
                </th>
                <th className="border px-4 py-2 cursor-pointer" onClick={() => handleSort('monthlyInterest')}>
                  Monthly Interest Amount
                  {sortConfig.key === 'monthlyInterest' ? (
                    sortConfig.direction === 'ascending' ? <FaSortUp className="inline ml-2" /> : <FaSortDown className="inline ml-2" />
                  ) : <FaSort className="inline ml-2" />}
                </th>
                <th className="border px-4 py-2 cursor-pointer" onClick={() => handleSort('emiAmount')}>
                  EMI Amount
                  {sortConfig.key === 'emiAmount' ? (
                    sortConfig.direction === 'ascending' ? <FaSortUp className="inline ml-2" /> : <FaSortDown className="inline ml-2" />
                  ) : <FaSort className="inline ml-2" />}
                </th>
                <th className="border px-4 py-2 cursor-pointer" onClick={() => handleSort('emiAmount')}>
                  Minimum Monthly Pay
                  {sortConfig.key === 'emiAmount' ? (
                    sortConfig.direction === 'ascending' ? <FaSortUp className="inline ml-2" /> : <FaSortDown className="inline ml-2" />
                  ) : <FaSort className="inline ml-2" />}
                </th>
                <th className="border px-4 py-2 cursor-pointer" onClick={() => handleSort('loanStartDate')}>
                  Start Date
                  {sortConfig.key === 'loanStartDate' ? (
                    sortConfig.direction === 'ascending' ? <FaSortUp className="inline ml-2" /> : <FaSortDown className="inline ml-2" />
                  ) : <FaSort className="inline ml-2" />}
                </th>
                <th className="border px-4 py-2 cursor-pointer" onClick={() => handleSort('priority')}>
                  Priority
                  {sortConfig.key === 'priority' ? (
                    sortConfig.direction === 'ascending' ? <FaSortUp className="inline ml-2" /> : <FaSortDown className="inline ml-2" />
                  ) : <FaSort className="inline ml-2" />}
                </th>
                <th className="border px-4 py-2 w-44">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedLoans.map((loan, index) => (
                <tr key={loan.id}>
                  <td className="border px-4 py-2">{loan.id}</td> {/* Serial Number Column */}
                  <td className="border px-4 py-2">
                    <Link href={`/loans/${loan.id}`}>
                      {loan.loanName}
                    </Link>
                  </td>
                  <td className="border px-4 py-2">{loan.loanAmount}</td>
                  <td className="border px-4 py-2">{loan.annualInterestRate}</td>
                  <td className="border px-4 py-2">
                    {calculateMonthlyInterest(loan.annualInterestRate, loan.loanAmount).toFixed(2)}
                  </td>
                  <td className="border px-4 py-2">{loan.emiAmount}</td>
                  <td className="border px-4 py-2"><input
                    type="text"
                    value={loan.minimumPay}
                    onChange={(e) => handlePriorityChange(loan.id, e.target.value)}
                    className="w-full border border-gray-300 p-1 rounded"
                  /></td>

                  <td className="border px-4 py-2">{formatDate(loan.loanStartDate)}</td>
                  {/*  */}
                  <td className="border px-4 py-2">
                    <div className="flex items-center">
                      <button
                        onClick={() => {
                          const newValue = Math.max(Number(loan.priority) - 1, -10);
                          handlePriorityChange(loan.id, newValue);
                        }}
                        className="text-gray-500 hover:text-blue-600 bg-gray-200 p-2 rounded-l-md"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 12H5"></path>
                        </svg>
                      </button>
                      <input
                        type="text"
                        value={loan.priority}
                        onChange={(e) => {
                          const value = Number(e.target.value);
                          if (value >= -10 && value <= 20) {
                            handlePriorityChange(loan.id, value);
                          }
                        }}
                        className="w-20 border border-gray-300 rounded-md text-center py-2 mx-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="-50"
                        max="50"
                      />
                      <button
                        onClick={() => {
                          const newValue = Math.min(Number(loan.priority) + 1, 20);
                          handlePriorityChange(loan.id, newValue);
                        }}
                        className="text-gray-500 hover:text-blue-600 bg-gray-200 p-2 rounded-r-md"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v14m7-7H5"></path>
                        </svg>
                      </button>
                    </div>
                  </td>


                  {/*  */}
                  <td className="border px-4 py-2 w-36">
                    <button
                      onClick={() => openModal(loan)}
                      className="bg-yellow-500 text-white px-2 py-1 rounded-md mr-2 w-14 break-keep"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteLoan(loan.id)}
                      className="bg-red-500 text-white px-2 py-1 rounded-md w-14 break-keep"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
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
