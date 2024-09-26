import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      // Get the session for the current user
      const session = await getServerSession(req, res, authOptions);
      if (!session || !session.user?.id) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const userId = session.user.id;

      // Fetch the user's cart
      const cart = await prisma.cart.findFirst({
        where: { userId },
      });

      if (!cart || cart.totalInCents === 0) {
        return res.status(404).json({ error: 'Cart not found or empty' });
      }

      // Calculate the total amount in cents
      const subtotal = cart.totalInCents;

      console.log('Subtotal:', subtotal);

      // Create a payment intent with the calculated amount
      const paymentIntent = await stripe.paymentIntents.create({
        amount: subtotal, // total amount in cents
        currency: 'usd',  // you can change this to your preferred currency
      });

      // Send back the client secret for the payment intent
      return res.status(200).json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
      console.error('Error creating payment intent:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    // Handle any other HTTP methods
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

