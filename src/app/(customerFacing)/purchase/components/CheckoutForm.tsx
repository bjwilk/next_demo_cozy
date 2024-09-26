"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import {
  Elements,
  LinkAuthenticationElement,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

type CheckoutFormProps = {
  cart: {
    cartItems: {
      id: string;
      productId: string;
      imagePath: string;
      name: string;
      priceInCents: number;
      description: string;
      quantity: number;
    }[];
    totalInCents: number;
  };
};

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY as string);

export function CheckoutForm({ cart }: CheckoutFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  // Fetch the payment intent's client secret on load
  useEffect(() => {
    const fetchPaymentIntent = async () => {
      try {
        const response = await fetch("/api/payment-intent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            totalInCents: cart.totalInCents,
          }),
        });
        
        const data = await response.json();
        
        if (response.ok) {
          setClientSecret(data.clientSecret);
        } else {
          console.error("Failed to fetch payment intent", data.error);
        }
      } catch (error) {
        console.error("Error fetching payment intent:", error);
      }
    };

    fetchPaymentIntent();
  }, [cart.totalInCents]);

  return (
    <div className="bg-gray-50 px-4 py-6 sm:px-6 bg-indigo-800">
      <div>
        {cart.cartItems.map((item) => (
          <div key={item.id} className="flex gap-4 items-center mb-4">
            <div className="aspect-video flex-shrink-0 w-1/3 relative">
              {/* Image component can be uncommented when images are ready */}
              {/* <Image src={item.imagePath} fill alt={item.name} className="object-cover" /> */}
            </div>
            <div>
              {/* <div className="text-lg">{formatCurrency(item.priceInCents / 100)}</div>
              <h1 className="text-lg font-medium text-slate-300">{item.name}</h1>
              <div className="text-lg font-medium text-slate-300">{item.description}</div> */}
            </div>
          </div>
        ))}
      </div>
      <div className="text-xl font-bold text-white">
        Total: {formatCurrency(cart.totalInCents / 100)}
      </div>

      {clientSecret ? (
        <Elements options={{ clientSecret }} stripe={stripePromise}>
          <Form priceInCents={cart.totalInCents} cart={cart} />
        </Elements>
      ) : (
        <div>Loading payment information...</div>
      )}
    </div>
  );
}

function Form({ priceInCents, cart }: { priceInCents: number; cart: CheckoutFormProps["cart"] }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [email, setEmail] = useState<string>();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!stripe || !elements || !email) {
      setErrorMessage("Payment processing failed. Please try again.");
      return;
    }

    setIsLoading(true);

    try {
      // Confirm the payment with Stripe
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        if (!error) {
          // Payment succeeded, create a new order
          const response = await fetch("/api/order", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              pricePaidInCents: priceInCents,
              orderItems: cart.cartItems.map((item) => ({
                productId: item.productId,
                quantity: item.quantity, // Include quantity
              })),
            }),
          });
  
          if (response.ok) {
            console.log("Order created successfully");
            // Clear the cart after successful order creation
            await fetch("/api/cart", {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
              },
            });
            console.log("Cart deleted successfully");
            window.location.href = `/stripe/purchase-success`;
          } else {
            console.error("Failed to create order");
            setErrorMessage("Failed to create order. Please try again.");
          }
        } else {
          setErrorMessage("An error occurred during payment processing.");
        }
      } else {
        setErrorMessage("Payment failed. Please try again.");
      }
    } catch (err) {
      console.error("Error during payment:", err);
      setErrorMessage("Something went wrong during the payment process.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Checkout</CardTitle>
          {errorMessage && (
            <CardDescription className="text-destructive">{errorMessage}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <PaymentElement />
          <div className="mt-4">
            <LinkAuthenticationElement onChange={(e) => setEmail(e.value.email)} />
          </div>
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            size="lg"
            disabled={stripe == null || elements == null || isLoading}
          >
            {isLoading ? "Purchasing..." : `Purchase - ${formatCurrency(priceInCents / 100)}`}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

