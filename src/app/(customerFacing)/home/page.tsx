import { ProductCard, ProductCardSkeleton } from "@/components/ProductCard"
import { Button } from "@/components/ui/button"
import db from "@/db/db"
import { cache } from "@/lib/cache"
import { Product } from "@prisma/client"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { Suspense } from "react"

const getMostPopularProducts = cache(
  async () => {
    try {
      const products = await db.product.findMany({
        where: { isAvailableForPurchase: true },
        orderBy: { orderItems: { _count: "desc" } },
        take: 3,
      });
      // console.log("Most Popular Products:", products); // Log products for debugging
      return products;
    } catch (error) {
      console.error("Error fetching most popular products:", error);
      return [];
    }
  },
  ["/", "getMostPopularProducts"],
  { revalidate: 60 * 60 * 24 }
);

const getNewestProducts = cache(async () => {
  try {
    const products = await db.product.findMany({
      where: { isAvailableForPurchase: true },
      orderBy: { createdAt: "desc" },
      take: 3,
    });
    // console.log("Newest Products:", products); // Log products for debugging
    return products;
  } catch (error) {
    console.error("Error fetching newest products:", error);
    return [];
  }
}, ["/", "getNewestProducts"]);

export default function HomePage() {
  return (
    <main className="space-y-12">
      <ProductGridSection
        title="Most Popular"
        productsFetcher={getMostPopularProducts}
      />
      <ProductGridSection title="Newest" productsFetcher={getNewestProducts} />
    </main>
  )
}

type ProductGridSectionProps = {
  title: string
  productsFetcher: () => Promise<Product[]>
}

function ProductGridSection({
  productsFetcher,
  title,
}: ProductGridSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <h2 className="text-3xl font-bold">{title}</h2>
        <Button variant="outline" asChild>
          <Link href="/products" className="space-x-2">
            <span>View All</span>
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Suspense
          fallback={
            <>
              <ProductCardSkeleton />
              <ProductCardSkeleton />
              <ProductCardSkeleton />
            </>
          }
        >
          <ProductSuspense productsFetcher={productsFetcher} />
        </Suspense>
      </div>
    </div>
  )
}

async function ProductSuspense({
  productsFetcher,
}: {
  productsFetcher: () => Promise<Product[]>
}) {
  try {
    const products = await productsFetcher();
    if (products.length === 0) {
      return <div>No products available.</div>; // Show a message if no products are found
    }
    return products.map(product => (
      <ProductCard key={product.id} {...product} />
    ));
  } catch (error) {
    console.error("Error displaying products:", error);
    return <div>Error loading products.</div>; // Show an error message
  }
}
