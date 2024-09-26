import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]'; // Adjust the path accordingly
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
const prisma = new PrismaClient();

const stripe = new Stripe(process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY as string);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const session = await getServerSession(req, res, authOptions);
  
    const userId = session?.user?.id;
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  
    if (req.method === 'POST') {
      const { orderItems, pricePaidInCents } = req.body;
  
      try {
        if (!userId) {
          throw new Error('User ID is required');
        }
        console.log("pricePaidInCents", pricePaidInCents);
        console.log("orderItems", orderItems);
        console.log('User ID:', userId);
        
        if (typeof pricePaidInCents !== 'number') {
          throw new Error('Total price must be a number');
        }
        
        if (!Array.isArray(orderItems) || orderItems.length === 0) {
          throw new Error('Order items must be a non-empty array');
        }
  
        // // Validate that all products exist before creating the order
        // const productIds = orderItems.map(item => item.productId);
        // console.log("productIds", productIds);
        // const products = await prisma.product.findMany({
        //   where: {
        //     id: { in: productIds },
        //   },
        // });
  
        // if (products.length !== productIds.length) {
        //   throw new Error('One or more products do not exist');
        // }
  
        const newOrder = await prisma.order.create({
          data: {
            userId: userId,
            pricePaidInCents,
            orderItems: {
              create: orderItems.map((item: { productId: string; quantity: number }) => ({
                productId: item.productId,
                quantity: item.quantity,
              })),
            },
          },
          include: { orderItems: true },
        });
  
        res.status(201).json(newOrder);
      } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Failed to create order' });
      }
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  }
  