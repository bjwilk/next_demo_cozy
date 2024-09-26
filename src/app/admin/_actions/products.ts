"use server"

import db from "@/db/db"
import { z } from "zod"
import fs from "fs/promises"
import { notFound, redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import AWS from "aws-sdk"
import { randomUUID } from "crypto"

// const fileSchema = z.instanceof(File, { message: "Required" })
// const imageSchema = fileSchema.refine(
//   file => file.size === 0 || file.type.startsWith("image/")
// )

// Initialize the S3 client
const s3 = new AWS.S3({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
})

// Define schema for form validation
const addSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  priceInCents: z.coerce.number().int().min(1),
})

export async function addProduct(
  prevState: unknown,
  formData: FormData,  // Adjusted to properly take props
) {
  const result = addSchema.safeParse(Object.fromEntries(formData.entries()))
  if (result.success === false) {
    return result.error.formErrors.fieldErrors
  }

  const data = result.data
  const image = formData.get("image") as File

  if (!image || image.size === 0) {
    return { image: "Image is required" }
  }

  // Create unique file name for S3
  const fileName = `${randomUUID()}-${image.name}`

  // Prepare S3 upload parameters
  const s3Params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME as string, // Your S3 bucket name
    Key: fileName,
    Body: Buffer.from(await image.arrayBuffer()),
    ContentType: image.type,
    ACL: "public-read", // This makes the file publicly accessible
  }

  // Upload image to S3
  try {
    const uploadResult = await s3.upload(s3Params).promise()

    // Save product details including S3 image URL to the database
    await db.product.create({
      data: {
        name: data.name,
        description: data.description,
        priceInCents: data.priceInCents,
        imagePath: uploadResult.Location, // S3 URL of the uploaded image
      },
    })

  
  } catch (err) {
    console.error("Error uploading image to S3:", err)
    return { image: "Failed to upload image" }
  } finally {
      // Revalidate paths and redirect
      revalidatePath("/")
      revalidatePath("/products")
  
      redirect("/admin/products")
  }
}

// Extend the add schema to make image optional for updates
const editSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  priceInCents: z.coerce.number().int().min(1),
  image: z.any().optional(), // Image is optional for updates
})

export async function updateProduct(
  id: string,
  prevState: unknown,
  formData: FormData
) {
  const result = editSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!result.success) {
    return result.error.formErrors.fieldErrors
  }

  const data = result.data
  const product = await db.product.findUnique({ where: { id } })
  if (!product) return notFound()

  let imagePath = product.imagePath
  const newImage = formData.get("image") as File | null

  if (newImage && newImage.size > 0) {
    // Delete the old image from S3
    const oldImageKey = product.imagePath.split("/").pop() // Get the file key from the URL
    if (oldImageKey) {
      await s3
        .deleteObject({
          Bucket: process.env.AWS_S3_BUCKET_NAME!,
          Key: oldImageKey,
        })
        .promise()
    }

    // Upload the new image to S3
    const newFileName = `${randomUUID()}-${newImage.name}`
    const s3Params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: newFileName,
      Body: Buffer.from(await newImage.arrayBuffer()),
      ContentType: newImage.type,
      ACL: "public-read", // Make the file publicly accessible
    }
    const uploadResult = await s3.upload(s3Params).promise()

    // Update the image path to the new S3 URL
    imagePath = uploadResult.Location
  }

  // Update the product in the database
  await db.product.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      priceInCents: data.priceInCents,
      imagePath, // Update the image path
    },
  })

  // Revalidate paths and redirect
  revalidatePath("/")
  revalidatePath("/products")
  redirect("/admin/products")
}

export async function toggleProductAvailability(
  id: string,
  isAvailableForPurchase: boolean
) {
  try {
    console.log(`Attempting to toggle availability for product ID: ${id}`);

    // Attempt to update product availability in the database
    await db.product.update({
      where: { id },
      data: { isAvailableForPurchase },
    });

    console.log("Product availability updated successfully");
    revalidatePath("/");
    revalidatePath("/products");
  } catch (error) {
    console.error("Error toggling product availability:", error);
    throw error; // Re-throw the error
  } finally {

    console.log(`toggleProductAvailability operation completed for product ID: ${id}`);
    revalidatePath("/");
    revalidatePath("/products");
  }
}



export async function deleteProduct(id: string) {
  const product = await db.product.delete({ where: { id } })

  if (product == null) return notFound()

  // await fs.unlink(product.filePath)
  await fs.unlink(`public${product.imagePath}`)

  revalidatePath("/")
  revalidatePath("/products")
}

