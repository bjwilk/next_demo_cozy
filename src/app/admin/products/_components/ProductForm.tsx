"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { formatCurrency } from "@/lib/formatters"
import { useState } from "react"
import { addProduct, updateProduct } from "../../_actions/products"
import { useFormState, useFormStatus } from "react-dom"
import { Product } from "@prisma/client"
import Image from "next/image"


type FormError = {
  name?: string[];
  description?: string[];
  priceInCents?: string[];
  image?: string[];
};

type ProductFormProps = {
  product?: Product | null;
};

export function ProductForm({ product }: ProductFormProps) {
  const [name, setName] = useState<string>(product?.name || "");
  const [description, setDescription] = useState<string>(product?.description || "");
  const [priceInCents, setPriceInCents] = useState<number | undefined>(product?.priceInCents);
  const [image, setImage] = useState<File | null>(null);
  const [errors, setErrors] = useState<FormError>({});

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setImage(event.target.files[0]);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({}); // Reset errors

    // Validation
    const newErrors: FormError = {};
    if (!name) newErrors.name = ["Name is required"];
    if (!description) newErrors.description = ["Description is required"];
    if (priceInCents === undefined || priceInCents <= 0) newErrors.priceInCents = ["Price must be a positive number"];
    if (!image && product == null) newErrors.image = ["Image is required"];

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return; // Stop submission if there are validation errors
    }

    // Prepare form data
    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("priceInCents", priceInCents?.toString() || "");
    if (image) formData.append("image", image);

    // Call addProduct or updateProduct based on whether the product exists
    if (product) {
      // Pass current errors as prevState or adjust as needed
      const prevState: FormError = {}; // You can customize what to pass as the previous state
      await updateProduct(product.id, prevState, formData);
    } else {
      // Pass empty object as prevState for addProduct
      const prevState: FormError = {}; // Adjust as needed
      await addProduct(prevState, formData);
    }

    // Optionally, reset form fields after successful submission
    setName("");
    setDescription("");
    setPriceInCents(undefined);
    setImage(null);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8" encType="multipart/form-data">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          type="text"
          id="name"
          name="name"
          required
          value={name}
          onChange={e => setName(e.target.value)}
        />
        {errors.name && <div className="text-destructive">{errors.name.join(', ')}</div>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="priceInCents">Price In Cents</Label>
        <Input
          type="number"
          id="priceInCents"
          name="priceInCents"
          required
          value={priceInCents || ""}
          onChange={e => setPriceInCents(Number(e.target.value) || undefined)}
        />
        <div className="text-muted-foreground">
          {formatCurrency((priceInCents || 0) / 100)}
        </div>
        {errors.priceInCents && <div className="text-destructive">{errors.priceInCents.join(', ')}</div>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          required
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
        {errors.description && <div className="text-destructive">{errors.description.join(', ')}</div>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="image">Image</Label>
        <Input 
          type="file" 
          id="image" 
          name="image" 
          onChange={handleFileChange} 
          required={product == null} 
        />
        {product && product.imagePath && (
          <img
            src={product.imagePath}
            alt="Product Image"
            height={400}
            width={400}
          />
        )}
        {errors.image && <div className="text-destructive">{errors.image.join(', ')}</div>}
      </div>
      <SubmitButton />
    </form>
  );
}


function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : "Save"}
    </Button>
  )
}