//src/app/page.js
"use client";

import { useState, useEffect } from 'react';
import LoanForm from '@/components/LoanForm';
import Link from 'next/link';

const Home = () => {
  const [loans, setLoans] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentLoan, setCurrentLoan] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

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

  const interest = (annualInterestRate, loanAmount) => {
    const monthlyInterestRate = parseFloat(annualInterestRate) / 12 / 100;
    const interest = parseFloat(loanAmount) * monthlyInterestRate;
    return interest
  }

  return (
    <>
      <div className="w-full max-w-full overflow-x-auto ">
        <div className='flex justify-between px-12'>
          <h2 className="text-2xl font-bold mb-4">Loan List</h2>
          <button
            onClick={() => openModal()}
            className="bg-blue-500 text-white px-4 py-2 rounded-md mb-4">
            Add Loan
          </button>
        </div>
        <div className="">
          <table className="min-w-full bg-white border text-sm break-normal ">
            <thead>
              <tr>
                <th className="border px-4 py-2 w-56">Loan Name</th>
                <th className="border px-4 py-2 w-30">Loan Amount</th>
                <th className="border px-4 py-2">Interest Rate</th>
                <th className="border px-4 py-2">Monthly Interest Amount</th>
                <th className="border px-4 py-2">EMI Amount/ Minimum Monthly Pay</th>
                <th className="border px-4 py-2">Start Date</th>
                <th className="border px-4 py-2">Priority</th>
                <th className="border px-4 py-2 w-44">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((loan) => (
                <tr key={loan.id}>
                  <td className="border px-4 py-2">
                    <Link href={`/loans/${loan.id}`}>
                      {loan.loanName}
                    </Link>
                  </td>
                  <td className="border px-4 py-2">{loan.loanAmount}</td>
                  <td className="border px-4 py-2">{loan.annualInterestRate}</td>
                  <td className="border px-4 py-2">{interest(loan.annualInterestRate, loan.loanAmount)}</td>
                  <td className="border px-4 py-2">{loan.emiAmount}</td>
                  <td className="border px-4 py-2">{formatDate(loan.loanStartDate)}</td>
                  <td className="border px-4 py-2">1</td>
                  <td className="border border-red-900 px-4 py-2 w-36 ">
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

// i want short by Loan Name, Short By Loan Amount, Interest Rate, Monthly Interest Amount, EMI Amount/ Minimum Monthly Pay, Start Date, Priority