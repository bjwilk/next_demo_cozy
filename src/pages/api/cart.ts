import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]'; // Adjust the path accordingly
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Use getServerSession to get the session in API route
  const session = await getServerSession(req, res, authOptions);

  const userId = session?.user?.id; // Retrieve the user's ID from the session
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }




// Handle PUT request to update cart total and cart items
if (req.method === 'PUT') {
  const { totalInCents, cartItems } = req.body;  // Expect cartItems array along with totalInCents
  console.log("CART ITEMS", cartItems);



  try {
    // Update the total in the cart
    const cart = await prisma.cart.update({
      where: { userId },
      data: { totalInCents },
    });

     // Update the quantity for each cart item
     for (const item of cartItems) {
      await prisma.cartItem.update({
        where: { id: item.id },
        data: { quantity: item.quantity },
      });
    }

    return res.status(200).json({ message: 'Cart and items updated successfully', cart });
  } catch (error) {
    console.error('Error updating cart or cart items:', error);
    return res.status(500).json({ error: 'Error updating cart or cart items' });
  }
}


  // Handle GET request to retrieve the cart and its items
  else if (req.method === 'GET') {
    try {
      const cart = await prisma.cart.findFirst({
        where: { userId },
        include: {
          cartItems: {
            include: {
              product: true, // Include product details for cart items
            },
          },
        },
      });
      if (!cart) {
        return res.status(200).json({ items: [] });
      }

      return res.status(200).json(cart);
    } catch (error) {
      console.error('Error fetching cart details:', error);
      return res.status(500).json({ error: 'Error fetching cart details' });
    }
  }

  // Handle POST request to add a new product to the cart
  else if (req.method === 'POST') {
    const { productId, quantity } = req.body;

    // Validate inputs
    if (!productId || typeof quantity !== 'number' || quantity <= 0) {
      return res.status(400).json({ error: 'Invalid product ID or quantity' });
    }

    try {
      // Check if the product exists
      const product = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      const total = product.priceInCents * quantity;

      // Check if the cart already exists for the user
      let cart = await prisma.cart.findFirst({
        where: { userId },
      });

      if (!cart) {
        // Create a new cart if it doesn't exist
        cart = await prisma.cart.create({
          data: {
            userId: userId!, // Assert that userId is not undefined
            totalInCents: total,
          },
        });
      }

      // Check if the cart item already exists
      let cartItem = await prisma.cartItem.findFirst({
        where: {
          cartId: cart.id,
          productId,
        },
      });

      if (cartItem) {
        // If the item exists, update the quantity
        cartItem = await prisma.cartItem.update({
          where: { id: cartItem.id },
          data: { quantity: cartItem.quantity + quantity },
        });
      } else {
        // If the item doesn't exist, create a new cart item
        cartItem = await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId,
            quantity,
          },
        });
      }

      // Update the cart total
      await prisma.cart.update({
        where: { id: cart.id },
        data: { totalInCents: cart.totalInCents + total },
      });

      return res.status(200).json({ message: 'Item added to cart', cartItem });
    } catch (error) {
      console.error('Error adding item to cart:', error);
      return res.status(500).json({ error: 'Error adding item to cart' });
    }
  }

  if (req.method === 'DELETE') {

    try {
      // Delete cart items and the cart itself
      await prisma.cartItem.deleteMany({
        where: { cart: { userId } },
      });
      
      await prisma.cart.delete({
        where: { userId },
      });

      res.status(200).json({ message: 'Cart deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to delete cart' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }


}

