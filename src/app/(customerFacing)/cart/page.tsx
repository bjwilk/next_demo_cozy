// pages/cart.tsx
"use client";

import { CheckIcon, ClockIcon } from "@heroicons/react/20/solid";
import { useEffect, useState } from "react";
import { formatCurrency } from "../../../lib/formatters";
import Link from "next/link";
interface CartItem {
  id: string;
  product: {
    id: string;
    name: string;
    priceInCents: number;
    imagePath: string;
    href: string;
  };
  quantity: number;
}

export default function Cart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]); // Initialize with empty array
  const [isCartConfirmed, setIsCartConfirmed] = useState(false); // State for cart confirmation
  const [loading, setLoading] = useState(true); // State to track loading

  useEffect(() => {
    // Fetch cart items from the API or DB
    async function fetchCartItems() {
      try {
        const response = await fetch('/api/cart'); // Replace with your actual API endpoint
        const data = await response.json();
        setCartItems(data.cartItems); // Assuming `data.cartItems` contains the array of cart items
        setLoading(false);
      } catch (error) {
        console.error('Error fetching cart items:', error);
        setLoading(false);
      }
    }

    fetchCartItems();
  }, []);

  if (loading) {
    return <p>Loading...</p>; // Display a loading state while cart items are being fetched
  }

  if (!cartItems) return null;
  if (cartItems.length === 0) return <div>No items in cart</div>;
  const quantity = cartItems.reduce((total, item) => total + item.quantity, 0);

  const handleQuantityChange = (itemId: string, newQuantity: string) => {
    const updatedCartItems = cartItems.map((item) =>
      item.id === itemId
        ? { ...item, quantity: parseInt(newQuantity, 10) }
        : item
    );
    setCartItems(updatedCartItems);
  };

  const handleRemoveItem = (itemId: string) => {
    const updatedCartItems = cartItems.filter((item) => item.id !== itemId);
    setCartItems(updatedCartItems);
  };

  const calculateTotal = () => {
    return cartItems.reduce(
      (total, item) =>
        total + (item.product.priceInCents / 100) * item.quantity,
      0
    );
  };

  const handleConfirmCart = async () => {
    const totalInCents = Math.round(calculateTotal() * 100);
    try {
      const response = await fetch("/api/cart", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          totalInCents,
          cartItems: cartItems.map(item => ({
            id: item.id,
            quantity: item.quantity
          }))
        }),
      });

      if (response.ok) {
        setIsCartConfirmed(true);
      } else {
        console.error("Failed to update cart total");
      }
    } catch (error) {
      console.error("Error updating cart total:", error);
    }
  };

  const handleCheckout = async () => {
    window.location.href = '/purchase';
  };

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Shopping Cart
        </h1>

        <form className="mt-12">
          <div>
            <h2 className="sr-only">Items in your shopping cart</h2>

            <ul
              role="list"
              className="divide-y divide-gray-200 border-b border-t border-gray-200"
            >
              {cartItems &&
                cartItems.map((item) => (
                  <li key={item.id} className="flex py-6 sm:py-10">
                    <div className="flex-shrink-0">
                      <img
                        alt={item.product.name}
                        src={item.product.imagePath}
                        className="h-24 w-24 rounded-lg object-cover object-center sm:h-32 sm:w-32"
                      />
                    </div>

                    <div className="relative ml-4 flex flex-1 flex-col justify-between sm:ml-6">
                      <div>
                        <div className="flex justify-between sm:grid sm:grid-cols-2">
                          <div className="pr-6">
                            <h3 className="text-sm">
                              <a
                                href={item.product.href}
                                className="font-medium text-gray-700 hover:text-gray-800"
                              >
                                {item.product.name}
                              </a>
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                              {formatCurrency(item.product.priceInCents / 100)}
                            </p>
                          </div>

                          <p className="text-right text-sm font-medium text-gray-900">
                            {formatCurrency(
                              (item.product.priceInCents / 100) * item.quantity
                            )}
                          </p>
                        </div>

                        <div className="mt-4 flex items-center sm:absolute sm:left-1/2 sm:top-0 sm:mt-0 sm:block">
                          <label
                            htmlFor={`quantity-${item.id}`}
                            className="sr-only"
                          >
                            Quantity, {item.product.name}
                          </label>
                          <select
                            id={`quantity-${item.id}`}
                            name={`quantity-${item.id}`}
                            value={item.quantity}
                            onChange={(e) =>
                              handleQuantityChange(item.id, e.target.value)
                            }
                            className="block max-w-full rounded-md border border-gray-300 py-1.5 text-left text-base font-medium leading-5 text-gray-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                          >
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                              <option key={num} value={num}>
                                {num}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="ml-4 text-sm font-medium text-indigo-600 hover:text-indigo-500 sm:ml-0 sm:mt-3"
                          >
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
            </ul>
          </div>

          {/* Order summary */}
          <div className="mt-10 sm:ml-32 sm:pl-6">
            <div className="rounded-lg bg-gray-50 px-4 py-6 sm:p-6 lg:p-8">
              <h2 className="sr-only">Order summary</h2>

              <div className="flow-root">
                <dl className="-my-4 divide-y divide-gray-200 text-sm">
                  <div className="flex items-center justify-between py-4">
                    <dt className="text-gray-600">Subtotal</dt>
                    <dd className="font-medium text-gray-900">
                      {formatCurrency(calculateTotal())}
                    </dd>
                  </div>
                  {/* Add more order summary fields */}
                </dl>
              </div>
            </div>
            {/* Confirm Cart Button */}
            <button
              type="button"
              onClick={handleConfirmCart}
              className="mt-6 w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
            >
              Confirm Cart
            </button>
            <div className="mt-10">
              <Link href="/purchase" passHref>
                <button
                  type="button"
                  className={`mt-6 w-full py-2 px-4 rounded ${
                    isCartConfirmed
                      ? "bg-green-600 text-white hover:bg-green-700"
                      : "bg-gray-400 text-gray-700 cursor-not-allowed"
                  }`}
                  disabled={!isCartConfirmed} // Disable if cart is not confirmed
                >
                  Checkout
                </button>
              </Link>{" "}
            </div>

            <div className="mt-6 text-center text-sm text-gray-500">
              <p>
                or{" "}
                <a
                  onClick={() => window.history.back()}
                  className="font-medium text-indigo-600 hover:text-indigo-500 cursor-pointer"
                >
                  Continue Shopping
                  <span aria-hidden="true"> &rarr;</span>
                </a>
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

