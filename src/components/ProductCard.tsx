"use client";

import { useSession } from "next-auth/react";
import { formatCurrency } from "@/lib/formatters";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import Link from "next/link";
import Image from "next/image";

type ProductCardProps = {
  id: string;
  name: string;
  priceInCents: number;
  description: string;
  imagePath: string;
};

export function ProductCard({
  id,
  name,
  priceInCents,
  description,
  imagePath,
}: ProductCardProps) {
  
  const { data: session } = useSession();
  const [isAdding, setIsAdding] = useState(false);
  
  // Function to add product to the cart
  const addToCart = async () => {
    if (!session) {
      console.error("User not authenticated");
      return;
    }

    setIsAdding(true); // Set loading state
    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        body: JSON.stringify({
          productId: id,
          quantity: 1, // Add 1 item to the cart for now
        }),
        headers: {
          "Content-Type": "application/json", // Ensure the content type is set
        },
        credentials: "include",
      });
      if (response.status === 200) {
        console.log("Item added to cart");
      }
    } catch (error) {
      console.error("Error adding item to cart", error);
    } finally {
      setIsAdding(false); // Reset loading state
    }
  };

  return (
    <Card className="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-lg sm:aspect-h-3 sm:aspect-w-2">
      <div className="relative w-full h-48">
        <Image
          src={imagePath}
          fill
          alt={name}
          className="h-full w-full object-cover object-center group-hover:opacity-75"
        />
      </div>

      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <CardDescription>{formatCurrency(priceInCents / 100)}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="line-clamp-4">{description}</p>
      </CardContent>
      <CardFooter>
        <Button
          onClick={addToCart}
          size="lg"
          className="w-full"
          disabled={isAdding}
        >
          {isAdding ? "Adding..." : "Add to Cart"}
        </Button>{" "}
      </CardFooter>
    </Card>
  );
}

export function ProductCardSkeleton() {
  return (
    <Card className="overflow-hidden flex flex-col animate-pulse">
      <div className="w-full aspect-video bg-gray-300" />
      <CardHeader>
        <CardTitle>
          <div className="w-3/4 h-6 rounded-full bg-gray-300" />
        </CardTitle>
        <CardDescription>
          <div className="w-1/2 h-4 rounded-full bg-gray-300" />
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="w-full h-4 rounded-full bg-gray-300" />
        <div className="w-full h-4 rounded-full bg-gray-300" />
        <div className="w-3/4 h-4 rounded-full bg-gray-300" />
      </CardContent>
      <CardFooter>
        <Button className="w-full" disabled size="lg"></Button>
      </CardFooter>
    </Card>
  );
}
