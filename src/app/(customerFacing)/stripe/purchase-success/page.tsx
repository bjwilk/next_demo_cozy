import db from "@/db/db";
import { formatCurrency } from "@/lib/formatters";
import { notFound } from "next/navigation";
import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";

export default async function SuccessPage() {
  const session = await getSession();
  const userId = session?.user?.id;
  const order = await db.order.findFirst({
    where: { userId: userId },
    include: {
      orderItems: {
        include: {
          product: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!order) {
    notFound();
  }

  const { pricePaidInCents, orderItems } = order;

  return (
    <div className="max-w-5xl w-full mx-auto space-y-8">
      <h1 className="text-4xl font-bold">Success!</h1>
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Order Details:</h2>
        {orderItems.map((item, index) => (
          <div key={index} className="border p-4 rounded-md">
            <h3 className="text-xl font-bold">{item.product.name}</h3>
            <p className="text-sm">Quantity: {item.quantity}</p>
            <p className="text-sm">Price per item: {formatCurrency(item.product.priceInCents / 100)}</p>
            <p className="text-sm font-semibold">
              Total for this item: {formatCurrency((item.product.priceInCents * item.quantity) / 100)}
            </p>
          </div>
        ))}
        <div className="text-xl font-bold mt-4">
          Total Amount Paid: {formatCurrency(pricePaidInCents / 100)}
        </div>
      </div>
    </div>
  );
}

