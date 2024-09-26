"use client"

import db from "@/db/db"
import Stripe from "stripe"
import { CheckoutForm } from "./components/CheckoutForm"
import { getSession } from "next-auth/react"
import { useEffect, useState } from 'react';
import { notFound } from 'next/navigation'; // Used for notFound in app dir

const stripe = new Stripe(process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY as string);

export default function PurchasePage() {
  const [cart, setCart] = useState<any>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // Add loading state

  useEffect(() => {
    async function fetchCartAndCreatePaymentIntent() {
      try {
        const session = await getSession();
        if (!session || !session.user) {
          throw new Error('User not authenticated');
        }


        // Fetch the cart from the backend
        const cartResponse = await fetch(`/api/cart`);
        const cart = await cartResponse.json();

        if (!cart || cart.cartItems.length === 0) {
          throw new Error('Cart is empty or not found');
        }

        setCart(cart);

        // Send the cart to the payment intent API
        const paymentIntentResponse = await fetch('/api/payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cart: cart.cartItems }),
        });

        if (!paymentIntentResponse.ok) {
          throw new Error('Failed to create payment intent');
        }

        const paymentData = await paymentIntentResponse.json();
        setClientSecret(paymentData.clientSecret);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false); // Set loading to false after fetching
      }
    }

    fetchCartAndCreatePaymentIntent();
  }, []);

  // Render loading state
  if (loading) {
    return <div>Loading...</div>;
  }

  // If clientSecret is still null, handle the error
  if (!clientSecret) {
    return <div>Error: Unable to initialize payment. Please try again.</div>;
  }

  // Render CheckoutForm once cart and clientSecret are available
  return (
    <CheckoutForm
      cart={cart}
      // clientSecret={clientSecret}
    />
  );
}

