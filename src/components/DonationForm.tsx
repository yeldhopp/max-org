import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import ErrorBoundary from './ErrorBoundary';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface DonationFormData {
  firstName: string;
  lastName: string;
  email: string;
  amount: string;
}

const DonationFormContent: React.FC = () => {
  const stripe = useStripe();
  const elements = useElements();
  
  const [formData, setFormData] = useState<DonationFormData>({
    firstName: '',
    lastName: '',
    email: '',
    amount: ''
  });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      setMessage({ type: 'error', text: 'Stripe has not loaded yet. Please try again.' });
      return;
    }

    // Validate form data
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.amount) {
      setMessage({ type: 'error', text: 'Please fill in all required fields.' });
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount < 1) {
      setMessage({ type: 'error', text: 'Please enter a valid donation amount.' });
      return;
    }

    setIsProcessing(true);
    setMessage(null);

    try {
      // Create payment method
      const { error: paymentError, paymentMethod } = await stripe.createPaymentMethod({
        elements,
        params: {
          billing_details: {
            name: `${formData.firstName} ${formData.lastName}`,
            email: formData.email,
          },
        },
      });

      if (paymentError) {
        setMessage({ type: 'error', text: paymentError.message || 'Payment method creation failed.' });
        setIsProcessing(false);
        return;
      }

      // Submit donation to our API
      const response = await fetch('/api/submit-donation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formId: 1, // Default form ID - should be configurable
          amount: amount,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          paymentMethodId: paymentMethod.id,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: 'Thank you for your donation! Your support helps us build stronger communities through technology.' 
        });
        // Reset form
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          amount: ''
        });
      } else {
        setMessage({ 
          type: 'error', 
          text: result.error || 'Donation processing failed. Please try again.' 
        });
      }
    } catch (error) {
      console.error('Donation error:', error);
      setMessage({ 
        type: 'error', 
        text: 'An unexpected error occurred. Please try again.' 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
            First Name *
          </label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
            Last Name *
          </label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
          Email Address *
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
          Donation Amount ($) *
        </label>
        <input
          type="number"
          id="amount"
          name="amount"
          value={formData.amount}
          onChange={handleInputChange}
          min="1"
          step="0.01"
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Payment Information
        </label>
        <div className="border border-gray-300 rounded-lg p-4">
          <PaymentElement />
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-primary-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
      >
        {isProcessing ? 'Processing...' : 'Donate Now'}
      </button>
    </form>
  );
};

const DonationForm: React.FC = () => {
  const options = {
    mode: 'payment' as const,
    amount: 2500, // $25.00 default
    currency: 'usd',
    appearance: {
      theme: 'stripe' as const,
    },
  };

  return (
    <ErrorBoundary>
      <div className="max-w-md mx-auto">
        <Elements stripe={stripePromise} options={options}>
          <DonationFormContent />
        </Elements>
      </div>
    </ErrorBoundary>
  );
};

export default DonationForm;