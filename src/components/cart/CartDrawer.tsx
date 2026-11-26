'use client';

import React from 'react';
import { Drawer } from '@/components/ui/Drawer';
import { ShoppingCart } from './ShoppingCart';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

/** Slide-in cart panel built on the shared Drawer component. */
export function CartDrawer({ open, onClose }: CartDrawerProps) {
  return (
    <Drawer open={open} onClose={onClose} side="right" ariaLabel="Shopping cart">
      <div className="flex-1 min-h-0">
        <ShoppingCart isOpen={open} onClose={onClose} />
      </div>
    </Drawer>
  );
}

export default CartDrawer;
