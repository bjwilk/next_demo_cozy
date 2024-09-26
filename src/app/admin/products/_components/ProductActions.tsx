"use client";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useTransition, useState } from "react";
import {
  deleteProduct,
  toggleProductAvailability,
} from "../../_actions/products";
import { useRouter } from "next/navigation";

export function ActiveToggleDropdownItem({
  id,
  isAvailableForPurchase,
}: {
  id: string;
  isAvailableForPurchase: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [available, setAvailable] = useState(isAvailableForPurchase);

  const handleToggle = () => {
    console.log(`Toggling product availability for ID: ${id}`);
    console.log(
      `Current state: ${available ? "Available" : "Unavailable"}`
    );

    startTransition(() => {
      toggleProductAvailability(id, !available)
        .then(() => {
          console.log(`Successfully toggled availability to ${!available ? "Available" : "Unavailable"}`);
          setAvailable(!available); // Update local state
          return router.refresh(); // Refresh the router to get latest data
        })
        .catch((error) => {
          console.error("Error toggling product availability:", error);
        })
        .finally(() => {
          console.log("Toggle process finished");
        });
    });
  };

  return (
    <DropdownMenuItem
      disabled={isPending}
      onClick={handleToggle}
    >
      {available ? "Deactivate" : "Activate"}
    </DropdownMenuItem>
  );
}



export function DeleteDropdownItem({
  id,
  disabled,
}: {
  id: string;
  disabled: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <DropdownMenuItem
      variant="destructive"
      disabled={disabled || isPending}
      onClick={() => {
        startTransition(async () => {
          await deleteProduct(id);
          router.refresh();
        });
      }}
    >
      Delete
    </DropdownMenuItem>
  );
}
